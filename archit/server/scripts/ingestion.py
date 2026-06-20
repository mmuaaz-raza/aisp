import uuid
import aiohttp
from models.document import Doc
from pydantic import BaseModel,Field,HttpUrl
from utils.processDoc import GutenBurg
from qdrant_client import models as mod

class BookUrl(BaseModel):
    url : HttpUrl = Field(...)


async def DownloadContent(body:BookUrl)->bool:
    try :
        doc = await Doc.find_one(Doc.index==str(body.url))
        
        if doc: 
            return True
        lib = GutenBurg()

        async with aiohttp.ClientSession() as session:
            async with session.get(str(body.url)) as response:
                if not response.ok:
                    return False
                content =  await response.text(encoding="utf-8")
                title = content[content.find("Title:")+6:content.find("Author:")-1].strip()
                content = lib.cleanHeaderFooter(content)
                size = response.headers.get("Content-Length")
                size = int(size) / 1024**2 if size else -1
                
                new_doc = Doc(content=content,title=title,size=size,index=str(body.url))
                await new_doc.insert()
                return True
    except Exception as e:
            print(str(e))
            return False
    






async def saveChunks(models):
    docs =await Doc.find(Doc.is_embedded==False).to_list()

    for doc in docs:
        chunks = models["chunker"].chunk(doc.content)
        docList = [c.text for c in chunks]
        embeddings =models["embedder"].encode(docList)

        await models["qd_client"].upsert(
            collection_name="books",
            points=[
                mod.PointStruct(
                    id=str(uuid.uuid4()),
                    vector={
                        "bm25": mod.Document(text=c.text,model="Qdrant/bm25"),   
                        "dense": embeddings[i].tolist(),
                    },
                    payload={
                        "m_id": str(doc.id),
                        "title" : str(doc.title),
                        "text": c.text,
                        "token_count": c.token_count,
                    }
                )
                for i, c in enumerate(chunks)
            ]
        )

        doc.content = ""
        doc.is_embedded = True
        await doc.save()
        



