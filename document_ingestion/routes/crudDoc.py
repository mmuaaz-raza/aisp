from datetime import  datetime
from typing import Annotated
from beanie.operators import Set
import logging
from pathlib import Path
from beanie import PydanticObjectId
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette import status
from models.document import Doc
from utils.rateLimiter import rate_limit
from fastapi import APIRouter, Depends, Query, UploadFile
import os
router = APIRouter()

def getErrorJson(error:str):
    return {"error":error,"status":"failed"}

@router.post("/")
async def saveDoc(file:UploadFile,_=Depends(rate_limit(lp="m",lr=1))):
    content = await file.read()
    parent_dir = Path(__file__).resolve().parent.parent
    file_path = Path(os.path.join(parent_dir,f"media/{file.filename}"))
    
    if file.content_type and file.filename and file.size :
        try :
            with open(file_path,"wb") as f:
                f.write(content)
            docf = await Doc.find_one(Doc.path == str(file_path)) #  user id needs to be attached for better validation
            if docf :
                await docf.update(Set({Doc.dateofupload:datetime.now(),Doc.size:file.size}))
            else :
                doc = Doc( size=file.size ,type=file.content_type,filename=file.filename, path=str(file_path),dateofupload=datetime.now())
                await doc.insert()
            return JSONResponse(status_code=201,content={"status":"created"})
        except (IOError, OSError) as e:
            
            logging.error(f"File system write failed: {e}")
            return JSONResponse( status_code=500, content=getErrorJson("Internal server error saving the file to disk."))
        except Exception as e:
            logging.error(f"error : {e}")
            if file_path.exists():
                    try:
                        # .unlink() is the modern way to delete a file in Python
                        file_path.unlink() 
                        logging.info(f"Rollback successful: Deleted orphaned file {file_path}")
                    except OSError as cleanup_error:
                        # If the deletion fails (e.g., file is locked), log it as a critical error
                        logging.critical(f"Rollback failed! Ghost file left at {file_path}. Error: {cleanup_error}")
            return JSONResponse( status_code=500, content=getErrorJson("Database error."))
    else : 
        return JSONResponse( status_code=500, content=getErrorJson("missing file object's required attributes"))



@router.get("/",status_code=status.HTTP_200_OK)
async def getDocumentList(limit: Annotated[int, Query(le=30, ge=1)] = 30,skip: Annotated[int, Query(ge=0)] = 0):
    docs = await Doc.find_all().skip(skip).limit(min(30,limit)).to_list()
    class GrainedDocDict(BaseModel):
        id : str
        filename: str
        dateofupload: str
        size: int
    grained_doc : list[GrainedDocDict] = []
    for doc in docs:
        grained_doc.append(GrainedDocDict(id=str(doc.id),dateofupload=doc.dateofupload.strftime("%d-%m-%Y %H:%M:%S"),filename=doc.filename,size=doc.size))
    return {"data":grained_doc,"detail":"top 30(upper cap) recent documents","total":len(docs)}


@router.get("/{id}")
async def getDocument(id:PydanticObjectId):
    doc = await Doc.get(id)
    if doc :
        return JSONResponse(status_code=200,content={"data":doc.model_dump(mode="json"),"detail":"Comprehensive view of the required doc"})
    else :
        return JSONResponse( status_code=401, content=getErrorJson("The required doc is not found"))
        


@router.delete("/{id}")
async def deleteDocument(id:PydanticObjectId):
    doc = await Doc.get(id)
    print(doc.model_dump(mode="json") if doc else "not found")
    if doc :
        object_path = Path(doc.path)
        if object_path.exists:
            try :
                object_path.unlink()
                await doc.delete()
                
            except OSError as cleanup_error:
                return JSONResponse( status_code=502, content=getErrorJson(str(cleanup_error)+"unable to delete the document"))
            except Exception as e:
                return JSONResponse( status_code=502, content=getErrorJson(str(e)+ "unable to delete the document"))
        return JSONResponse(status_code=200,content={"detail":"Deleted sucessfully"})
    else :
        return JSONResponse( status_code=401, content=getErrorJson("The required doc is not found"))
               