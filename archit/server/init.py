from contextlib import asynccontextmanager
from groq import Groq
from models.user import User
from sentence_transformers import SentenceTransformer
from fastapi import FastAPI
import os
from beanie import init_beanie
from fastapi import FastAPI
from pymongo import AsyncMongoClient
from models.document import Doc
from models.chat import Chat
from dotenv import load_dotenv
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import VectorParams,Distance,SparseVectorParams,Modifier ,PayloadSchemaType
import httpx
import asyncio
models = {}

async def keep_alive():
    async with httpx.AsyncClient() as client:
        while True:
            try:
                res = await client.get(os.getenv("SERVER_URI")or"", timeout=10)
                print(f"[keep-alive] ping → {res.status_code}")
            except Exception as e:
                print(f"[keep-alive] ping failed: {e}")
            await asyncio.sleep(5*60)

@asynccontextmanager
async def setup(app: FastAPI):
    load_dotenv()
    print("==> Starting setup...")
    client = AsyncMongoClient(os.getenv("MONGODBURI"), serverSelectionTimeoutMS=5000)
    task = asyncio.create_task(keep_alive())
    try:
        print("==> Connecting to Qdrant...")
        models["qd_client"] = AsyncQdrantClient(url=os.getenv("QdrantURI"),api_key=os.getenv("QdrantAPIKEY"))
        if not await models["qd_client"].collection_exists("books"):
            await models["qd_client"].create_collection(
                collection_name="books",
                vectors_config={
                    "dense":VectorParams(
                size=384,   
                distance = Distance.COSINE)},
                sparse_vectors_config={
                    "bm25":SparseVectorParams(
                        modifier=Modifier.IDF,
                    ) 
                },
                on_disk_payload=True,

            )
                
        await models["qd_client"].create_payload_index(
            collection_name="books",
        field_name="m_id",
        field_schema=PayloadSchemaType.KEYWORD,
        )
        print("==> Qdrant ready")

        print("==> Loading embedder...")
        models["embedder"] = SentenceTransformer("BAAI/bge-small-en-v1.5")
        print("==> Embedder ready")

        print("==> Pinging MongoDB...")
        await client["archit"].command("ping")
        db = client["archit"]
        print("==> MongoDB connected")

        await init_beanie(database=db, document_models=[Doc,Chat,User])
        print("==> Beanie ready")

        models["llm"] = Groq(api_key=os.getenv("GROQ_API_KEY"))
        print("==> LLM ready. Setup complete!")

    except Exception as e:
        print(f"==> ERROR: {e}")
        models["startup_error"] = str(e)

        # raise e

    yield

    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
    
    await client.close()
    if "llm" in models:
        models["llm"].close()
    if "qd_client" in models:
        await models["qd_client"].close()
    models.clear()