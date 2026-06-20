from fastapi import APIRouter,status,Depends,responses,Path,HTTPException
from models.user import User
from datetime import datetime , timezone
from models.chat import Chat ,Message
import asyncio
from dependencies.auth import authenticateUser ,TokenPayload
from fastapi.responses import JSONResponse
from beanie import PydanticObjectId
from typing import List,Annotated,cast
from models.document import Doc
from pydantic import BaseModel
from init import models
from beanie import PydanticObjectId
from qdrant_client import models as mod

router = APIRouter(prefix="/chats")

class SearchRequest(BaseModel):
    ids : List[PydanticObjectId] = []
    query : str
    chat_id : PydanticObjectId 
    tags : List[str] = []
    is_entire_corpus : bool = False

class RelevantDocumets(BaseModel):
    token : int
    text: str
    title : str


def generatePrompt(query:str,documents:List[RelevantDocumets]):
    context_text = ""
    for idx,e in enumerate(documents) :
        context_text += f"\n--- Excerpt {idx + 1} ---\n"
        context_text += f"Source BOOK TITLE: {e.title}\n"
        context_text += f"Content: {e.text}\n"
        context_text += f"Tokens (current chunk): {str(e.token)}\n"

    prompt = f"""

    <context>
    {context_text}
    </context>

    <query> {query} </query>

    """

    return prompt




@router.post("/c")
async def SearchBook(user: Annotated[TokenPayload,Depends(authenticateUser)], req:SearchRequest):
    try : 
        if isinstance(user,responses.Response):
            return user
        
        cid = req.chat_id
        cuser  = await User.get(PydanticObjectId(user.id))
        if not cuser : 
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail={"message":"invalid chat id"})
        
        current_chat = await Chat.find_one({"userId.$id": PydanticObjectId(user.id),"_id":cid})
        if not current_chat:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail={"message":"invalid chat id"})
        if current_chat.is_exhausted:
            raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED,detail={"message":"Token limit for this chat has been exceeded"})

        if len(current_chat.messages) == 1:
            splitted = req.query.strip().split(" ")
            current_chat.title = " ".join(splitted[:min(len(splitted),30)])

        Responses = []
        extracted_ids = [str(id) for id in req.ids]

        if len(req.tags):
            docs = await Doc.find({"tags":{"$in":req.tags}}).to_list()
            extracted_ids = [str(doc.id) for doc in docs]

        embedded_query = await asyncio.to_thread(models["embedder"].encode,req.query)
        if len(req.ids) or  req.is_entire_corpus:
            search_results =await models["qd_client"].query_points(
                collection_name= "books",
                query=embedded_query,
                using="dense",
                with_payload=True,
                query_filter=mod.Filter(
                must=([
                    mod.FieldCondition(
                        key="m_id", 
                        match=mod.MatchAny(any=extracted_ids) 
                    )
                ]if not req.is_entire_corpus else [])
            ),limit=5
            )
            matched_documents = search_results.points
            for point in matched_documents:
                    title = str(point.payload.get("title", "N/A"))
                    Responses.append(RelevantDocumets(text=point.payload["text"],title=title,token=point.payload["token_count"]))

        prompt = generatePrompt(req.query,Responses)
        current_chat.tokens_used += int(len(prompt)/4 + 20)

        if(current_chat.tokens_used + 120 >= current_chat.token_limit) :
            current_chat.is_exhausted = True
            await current_chat.save()
            raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED,detail={"message":"Token limit for this chat has been reached"})
        
        current_chat.messages.append(Message(role= "user",content= prompt,timestamp=datetime.now(timezone.utc)))
        response = models["llm"].chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role":e.role,"content":e.content} for e in current_chat.messages],
            temperature=0.4
        )

        llm_response = response.choices[0].message.content

        current_chat.messages.append(Message(role="assistant",content=llm_response,timestamp=datetime.now(timezone.utc)))
        current_chat.tokens_used += int(len(llm_response)/4)

        await current_chat.save()

        return JSONResponse(status_code=status.HTTP_200_OK,content={"response":llm_response})
    except Exception as e:
        print(e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,detail={"message":"internal server error"})


def generateSummaryCommand():
    prompt = f"""
    You are a conversation summarizer. When given a chat history between a user and an assistant, produce a concise summary that captures:

    1. The user's original goal or question
    2. Key decisions, answers, or solutions reached
    3. Any important context, constraints, or preferences the user mentioned
    4. Unresolved questions or next steps, if any

    Rules:
    - Be factual — do not infer intent beyond what was stated
    - Omit filler exchanges (greetings, acknowledgments)
    - Keep it under 250 words unless the conversation is long and complex
    - Output plain prose, no bullet points

    
    """
    return prompt

@router.post("/summary/{cid}")
async def GenerateSummary(user: Annotated[TokenPayload,Depends(authenticateUser)],cid:PydanticObjectId):
    try : 
        if isinstance(user,responses.Response):
            return user

        cuser  = await User.get(PydanticObjectId(user.id))
        if not cuser : 
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail={"message":"invalid chat id"})
        
        current_chat = await Chat.find_one({"userId.$id": PydanticObjectId(user.id),"_id":cid})
        if not current_chat:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail={"message":"invalid chat id"})
        if current_chat.is_exhausted and len(current_chat.summary):
            return JSONResponse(status_code=status.HTTP_202_ACCEPTED,content={"summary":current_chat.summary})
        

        response = models["llm"].chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                 {"role": "system", "content": generateSummaryCommand()},
                 {"role":"user","content":f"Summarize this conversation:\n\n{"\n".join([f"<{msg.role}>: <{msg.content}>" for msg in current_chat.messages])}"}],
            temperature=0.5
        )
        llm_response = response.choices[0].message.content
        current_chat.summary = llm_response

        await current_chat.save()

        return JSONResponse(status_code=status.HTTP_201_CREATED,content={"summary":current_chat.summary})
    except Exception as e:
        print(e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,detail={"message":"internal server error"})