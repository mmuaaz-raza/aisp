from pydantic import BaseModel , Field,ConfigDict
from langgraph.graph import StateGraph,  START, END 
import asyncio
from langchain_core.runnables import RunnableConfig
from langchain_core.prompts import ChatPromptTemplate
from models.document import Doc
from fastapi import status,HTTPException
from beanie import PydanticObjectId
from typing import List ,Optional
from fastapi.responses import Response,JSONResponse
from datetime import datetime , timezone
from models.chat import Chat ,Message
from qdrant_client.models import Prefetch, FusionQuery, Fusion
from qdrant_client import models as mod

class RelevantDocumets(BaseModel):
    token : int
    text: str
    title : str


class SearchRequest(BaseModel):
    ids : List[PydanticObjectId] = []
    query : str
    chat_id : PydanticObjectId 
    tags : List[str] = []
    is_entire_corpus : bool = False


class State(SearchRequest):
    is_history : bool  = False
    userid:PydanticObjectId
    error:Response|None = None
    response:Response|None = None
    chat:Optional[Chat] = None
    model_config = ConfigDict(arbitrary_types_allowed=True)

def generatePrompt(query:str,documents:List[RelevantDocumets],isHistory:bool):
    context_text = ""
    for idx,e in enumerate(documents) :
        context_text += f"\n--- Excerpt {idx + 1} ---\n"
        context_text += f"Source BOOK TITLE: {e.title}\n"
        context_text += f"Content: {e.text}\n"
        context_text += f"Tokens (current chunk): {str(e.token)}\n"

    prompt = f"""
    <mode>{"history" if isHistory else "context"} </mode>

    <context>
    { context_text}
    </context>

    <query> {query} </query>

    """

    return prompt




async def getCurrentChat(state:State):
    try :
        current_chat = await Chat.find_one({"userId.$id": PydanticObjectId(state.userid),"_id":state.chat_id})
        if not current_chat:
            return {**state.model_dump(),"error":HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail={"message":"invalid chat id"})}
        if current_chat.is_exhausted:
            return {**state.model_dump(),"error":HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED,detail={"message":"Token limit for this chat has been exceeded"})}
        
        if len(current_chat.messages) == 1:
            splitted = state.query.strip().split(" ")
            current_chat.title = " ".join(splitted[:min(len(splitted),30)])    
        
        return {**state.model_dump(),"chat":current_chat}
    except Exception as e:
         print(e)
         return {**state.model_dump(),"error":HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED,detail={"message":"Internal server error"})}



async def ClassifyRetrivalNeeded(state:State,config: RunnableConfig):
    class Classification(BaseModel):
        isContentRetrieval:bool = Field(description="This field is set true if the history(chat given between user and assistant), doesn't contain the answer and the external lookup is needed ")
    try :
         
        structured_model = config.get("configurable",{}).get("llm2",{}).with_structured_output(Classification)
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", """You are a strict routing assistant. Your ONLY job is to determine if external document retrieval is necessary to answer the user's latest query.

Evaluate the provided Conversation History against the User's Latest Query using these strict rules:

1. RESOLVED BY HISTORY (isContentRetrieval = False):
   - The user's query can be completely, accurately, and thoroughly answered using ONLY the information already discussed in the provided history.
   - The query is a simple conversational follow-up regarding things already stated (e.g., "can you summarize what we just talked about?", "what was your first point?").

2. NEEDS RETRIEVAL (isContentRetrieval = True):
   - The history lacks the *detailed* factual information required to answer the new query.
   - The user introduces a new topic, asks for deeper details not previously mentioned, or requires external facts.
   - The history is completely empty.

BE STRICT. If the history only contains a superficial or brief mention of the topic, but the user is now asking for specific details that are NOT in the history, you MUST set 'isContentRetrieval' to true. Do not assume or guess; rely only on the explicit details present in the history."""),
            ("human", """--- CONVERSATION HISTORY ---
{history}

--- LATEST USER QUERY ---
{query}""")
        ])
        
        if state.chat is None:
            return {**state.model_dump(),"error":HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail={"message":"invalid chat id"})}
            
        history = "\n".join([f"<role>{message.role}</role>:\n<content>{message.content}</content>" for message in state.chat.messages])
        chain = prompt_template | structured_model
        result = await chain.ainvoke({"history": history, "query": state.query})
        print(result)
        return {"is_history":not result.isContentRetrieval}
    except Exception as e:
        print(e)
        return {**state.model_dump(),"error":HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED,detail={"message":"Internal server error"})}



async def PostClassificationTasks(state:State,config: RunnableConfig):
    req=state

    Responses = []
    extracted_ids = [str(id) for id in req.ids]


    try:        
        if len(req.tags):
                docs = await Doc.find({"tags":{"$in":req.tags}}).to_list()
                extracted_ids = [str(doc.id) for doc in docs]

        embedded_query = await asyncio.to_thread(config.get("configurable",{}).get("embedder",{}).encode,req.query)
        if not req.is_history:
                search_results = await config.get("configurable",{}).get("qd_client",{}).query_points(
                                            collection_name="books",
                                            prefetch=[
                                                Prefetch(
                                                    query=embedded_query.tolist(),
                                                    using="dense",
                                                    limit=20,
                                                ),
                                                Prefetch(
                                                    query=mod.Document(text=req.query, model="Qdrant/bm25"),
                                                    using="bm25",
                                                    limit=20,
                                                ),
                                            ],
                                            query=FusionQuery(fusion=Fusion.RRF),
                                            with_payload=True,
                                            query_filter=mod.Filter(
                                                must=([
                                                    mod.FieldCondition(
                                                        key="m_id",
                                                        match=mod.MatchAny(any=extracted_ids)
                                                    )
                                                ] if not req.is_entire_corpus else [])
                                            ),
                                            limit=5)
                
                matched_documents = search_results.points
                for point in matched_documents:
                        title = str(point.payload.get("title", "N/A"))
                        Responses.append(RelevantDocumets(text=point.payload["text"],title=title,token=point.payload["token_count"]))

        prompt = generatePrompt(req.query,Responses,req.is_history)
        if req.chat is None:
            return {**req.model_dump(),"error":HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail={"message":"invalid chat id"})}
            
        req.chat.tokens_used += int(len(prompt)/4 + 20)

        if(req.chat.tokens_used + 120 >= req.chat.token_limit) :
                req.chat.is_exhausted = True
                await req.chat.save()
                return {**req.model_dump(),"error":HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED,detail={"message":"Token limit for this chat has been reached"})}
            
        req.chat.messages.append(Message(role= "user",content= prompt,timestamp=datetime.now(timezone.utc)))
        response = config.get("configurable",{}).get("llm",{}).chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role":e.role,"content":e.content} for e in req.chat.messages],
                temperature=0.4
            )

        llm_response = response.choices[0].message.content

        req.chat.messages.append(Message(role="assistant",content=llm_response,timestamp=datetime.now(timezone.utc)))
        req.chat.tokens_used += int(len(llm_response)/4)

        await req.chat.save()
        return {**req.model_dump(),"response":JSONResponse(status_code=status.HTTP_200_OK,content={"response":llm_response})}

    
    except Exception as e:
        print(e)
        return {**req.model_dump(),"error":HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED,detail={"message":"Internal server error"})}
         



def ValidateError(state:State,config: RunnableConfig):
     if state.error is None:
          return "continue"
     else :
          return "end"


workflow = StateGraph(State)
workflow.add_node("load_chat",getCurrentChat)
workflow.add_node("history_classification",ClassifyRetrivalNeeded)
workflow.add_node("final",PostClassificationTasks)


workflow.add_edge(START,"load_chat")
workflow.add_conditional_edges("load_chat",ValidateError,{"continue":"history_classification","end":END})
workflow.add_conditional_edges("history_classification",ValidateError,{"continue":"final","end":END})
workflow.add_edge("final",END)




