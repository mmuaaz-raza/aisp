from fastapi import APIRouter,status,Depends,responses,Path,HTTPException
from datetime import datetime , timezone
from models.chat import Chat ,Message
import asyncio
from dependencies.auth import authenticateUser
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
async def SearchBook(user: Annotated[dict,Depends(authenticateUser)], req:SearchRequest):
    if isinstance(user,responses.Response):
        return user
    
    cid = req.chat_id
    current_chat = await Chat.get(cid)
    if not current_chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail={"message":"invalid chat id"})
    if current_chat.is_exhausted:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED,detail={"message":"Token limit for this chat has been exceeded"})

    if len(current_chat.messages) == 1:
        splitted = req.query.strip().split(" ")
        current_chat.title = " ".join(splitted[:min(len(splitted),30)])

    Responses = []
    docs = []
    extracted_ids = []

    if len(req.ids) and not req.is_entire_corpus:
        filters = {}
        filters["_id"]= {"$in":req.ids}
        docs =await Doc.find(Doc.is_embedded==True,filters).to_list()
        if not docs:
            return JSONResponse(status_code=status.HTTP_404_NOT_FOUND,content={"message":"no document to find"})
                
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
    current_chat.tokens_used += len(llm_response)

    await current_chat.save()

    return JSONResponse(status_code=status.HTTP_200_OK,content={"response":llm_response})

