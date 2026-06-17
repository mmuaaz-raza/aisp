from fastapi import APIRouter,Path,status,Query
from fastapi.responses import JSONResponse
from typing import Annotated
from models.chat import Chat
from beanie import PydanticObjectId
router = APIRouter(prefix="/chats")

@router.post("/")
async def newChat(userId:Annotated[PydanticObjectId,Query()]):
    try :
        chat = Chat(userId=userId,title="",messages=[],is_exhausted=False)
        await chat.insert()
        return JSONResponse(status_code=status.HTTP_201_CREATED,content=chat.model_dump(mode="json",exclude={"is_exhausted","messages"}))
    except Exception as e:
        return JSONResponse(status_code=status.HTTP_501_NOT_IMPLEMENTED,content={"error":f"could not be proceeded : {str(e)}"})





@router.get("/{id}")
async def getMyChats(id:Annotated[PydanticObjectId,Path()]):
    try :
        chats = await Chat.find(Chat.userId==id).to_list()
        return JSONResponse(status_code=status.HTTP_201_CREATED,content=[chat.model_dump(mode="json",exclude={"messages"}) for chat in chats])

    except Exception as e:
        return JSONResponse(status_code=status.HTTP_501_NOT_IMPLEMENTED,content={"error":f"internal server error: {str(e)}"})

