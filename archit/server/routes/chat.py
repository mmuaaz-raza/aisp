from models.user import User
from beanie import PydanticObjectId
from fastapi import APIRouter,Path,status,Depends ,HTTPException,Body
from fastapi.responses import JSONResponse ,Response 
from typing import Annotated , cast 
from models.chat import Chat ,Message
from beanie import PydanticObjectId ,Link
from dependencies.auth import authenticateUser ,TokenPayload
router = APIRouter(prefix="/chats")

@router.get("/")
async def allChats(user:Annotated[TokenPayload,Depends(authenticateUser)]):
    try :
        if isinstance(user,Response):
            return user
        cuser = await User.get(PydanticObjectId(user.id))
        if not cuser:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail={"message":"invalid credentials"})
        
        chats = await Chat.find({"userId.$id": cuser.id}).to_list()

        return JSONResponse(status_code=status.HTTP_201_CREATED,content=[chat.model_dump(mode="json",exclude={"messages","summary"})for chat in chats])
    
    except Exception as e:
        return JSONResponse(status_code=status.HTTP_501_NOT_IMPLEMENTED,content={"error":f"could not be proceeded : {str(e)}"})



@router.post("/")
async def newChat(user:Annotated[TokenPayload,Depends(authenticateUser)],query:Annotated[str,Body(embed=True)]):
    try :
        if isinstance(user,Response):
            return user
        cuser = await User.get(PydanticObjectId(user.id))
        if not cuser :
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail={"message":"invalid credentials."})

        splitted = query.strip().split(" ")
        new_chat  = Chat(userId=cast(Link[User], cuser),title=" ".join(splitted[:min(len(splitted),30)]))
        await new_chat.save()
        return JSONResponse(status_code=status.HTTP_201_CREATED,content=new_chat.model_dump(mode="json"))
   
    except Exception as e:
        return JSONResponse(status_code=status.HTTP_501_NOT_IMPLEMENTED,content={"error":f"could not be proceeded : {str(e)}"})






@router.get("/{id}")
async def getMyChats(id:Annotated[PydanticObjectId,Path()],user:Annotated[TokenPayload,Depends(authenticateUser)]):
    try :
        chat = await Chat.find_one({"userId.$id": PydanticObjectId(user.id),"_id":id})
        if not chat : 
            return JSONResponse(status_code=status.HTTP_404_NOT_FOUND,content={"message":"invalid chat id"} )
        return JSONResponse(status_code=status.HTTP_200_OK,content=chat.model_dump(mode="json") )
    except Exception as e:
        return JSONResponse(status_code=status.HTTP_501_NOT_IMPLEMENTED,content={"error":f"internal server error: {str(e)}"})



@router.delete("/{id}")
async def deleteChat(user:Annotated[TokenPayload,Depends(authenticateUser)],id:PydanticObjectId):
    try :
        if isinstance(user,Response):
            return user
        cuser = await User.get(PydanticObjectId(user.id))
        chat = await Chat.find_one({"userId.$id": PydanticObjectId(user.id),"_id":id})
        if not cuser or not chat:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail={"message":"chat not found."})
        await chat.delete()
        return JSONResponse(status_code=status.HTTP_201_CREATED,content={"message":"chat has been deleted"})
   
    except Exception as e:
        return JSONResponse(status_code=status.HTTP_501_NOT_IMPLEMENTED,content={"error":f"could not be proceeded : {str(e)}"})