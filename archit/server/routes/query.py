from fastapi import APIRouter,status,Depends,responses,Path,HTTPException
from models.user import User
from models.chat import Chat 
from dependencies.auth import authenticateUser ,TokenPayload
from fastapi.responses import JSONResponse
from beanie import PydanticObjectId
from typing import List,Annotated,cast
from scripts.query import SearchRequest,State
from init import models
from beanie import PydanticObjectId


router = APIRouter(prefix="/chats")


    






@router.post("/c")
async def SearchBook(user: Annotated[TokenPayload,Depends(authenticateUser)], req:SearchRequest):
    try : 
        if isinstance(user,responses.Response):
            return user
        
        cuser  = await User.get(PydanticObjectId(user.id))
        if not cuser : 
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail={"message":"invalid chat id"})
        
        response = await models["graph"]["query"].ainvoke(State(**req.model_dump(),userid=PydanticObjectId(user.id)),config={"configurable":models})

        if response["error"] != None:
            return response["error"]
        else :
            return response["response"] 

        
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