from fastapi import APIRouter ,status
from init import setup
from fastapi.responses import JSONResponse
import aiohttp
from models.document import Doc
from pydantic import BaseModel,Field,HttpUrl
from typing import List
from .utils.processDoc import GutenBurg

app = APIRouter()

class BookUrl(BaseModel):
    url : HttpUrl = Field(...)

@app.post("/")
async def DownloadContent(body:BookUrl):
    try :
        doc = await Doc.find_one(Doc.index==str(body.url))
        if doc: 
            return JSONResponse(status_code=status.HTTP_202_ACCEPTED,content=doc.model_dump(mode="json",exclude={"content"}))    
        lib = GutenBurg()

        async with aiohttp.ClientSession() as session:
            async with session.get(str(body.url)) as response:
                if not response.ok:
                    return JSONResponse(status_code=status.HTTP_502_BAD_GATEWAY,content={"error":"link is unavailable"})    
                content =  await response.text(encoding="utf-8")
                title = content[content.find("Title:")+6:content.find("Author:")-1].strip()
                content = lib.cleanHeaderFooter(content)
                size = response.headers.get("Content-Length")
                size = int(size) / 1024**2 if size else -1
                
                new_doc = Doc(content=content,title=title,size=size,index=str(body.url))
                await new_doc.insert()
                return JSONResponse(status_code=status.HTTP_201_CREATED,content=new_doc.model_dump(mode="json",exclude={"content"}))
    except Exception as e:
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,content={"error":str(e)})