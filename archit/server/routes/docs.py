from fastapi import APIRouter ,status ,Query
from fastapi.responses import JSONResponse
from models.document import Doc
from typing import Annotated ,List
from beanie import PydanticObjectId
import re
router = APIRouter(prefix="/books")


@router.get("")
async def listAllBooks(name:Annotated[str,Query()]="",tags:Annotated[List[str],Query()]=[],page:Annotated[int,Query()]=0):
    filters = {}
    if name :
        words = name.split(" ")
        regex_pattern = "|".join([re.escape(word) for word in words])
        filters["title"] = {"$regex": regex_pattern, "$options": "i"}
    if tags : 
        filters["tags"] = tags
    
    perPage=30
    docs =await Doc.find(Doc.is_embedded==True,filters).skip(page*perPage).limit(perPage).to_list()
    return JSONResponse(status_code=status.HTTP_200_OK,content=[doc.model_dump(mode="json",exclude={"content","is_embedded"} )for doc in docs])


@router.get("{id}")
async def GetBook(id:PydanticObjectId):
    doc =await Doc.get(id)
    if not doc or not doc.is_embedded :
        return JSONResponse(status_code=status.HTTP_404_NOT_FOUND,content="")
    return JSONResponse(status_code=status.HTTP_200_OK,content=doc.model_dump(mode="json",exclude={"content","is_embedded"} ))

