from contextlib import asynccontextmanager
from scripts.ingestion import saveChunks
from chonkie import SemanticChunker
from sentence_transformers import SentenceTransformer
from fastapi import FastAPI
import os
from beanie import init_beanie
from fastapi import FastAPI
from pymongo import AsyncMongoClient
from models.document import Doc
from dotenv import load_dotenv
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import VectorParams,Distance,SparseVectorParams,Modifier
models = {}
qd_client = None
@asynccontextmanager
async def setup(app: FastAPI):
    load_dotenv()
    client = AsyncMongoClient(os.getenv("MONGODBURI"), serverSelectionTimeoutMS=5000)
    global qd_client

    try:
        qd_client = AsyncQdrantClient(url="http://localhost:6333")
        if not await qd_client.collection_exists("books"):
            await qd_client.create_collection(
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
        print("Qdrant setup has been completed")
        models["chunker"] = SemanticChunker( 
        embedding_model="minishlab/potion-base-32M",       
        threshold=0.4,
        similarity_window=3, 
        min_sentences_per_chunk=3,
        min_characters_per_sentence=40,
        chunk_size=512
        )
        print("Chunker is ready!")

        models["embedder"] = SentenceTransformer("all-MiniLM-L6-v2")
        print("Embedder is ready!")

        await client["archit"].command("ping")
        db = client["archit"]

        await init_beanie(database=db, document_models=[Doc])
        print("Connected to MongoDB successfully!")

        await saveChunks(models,qd_client)
    except Exception as e:
        print(f"unexpected error occured : {e}")
        
            
    yield 

    models.clear()
    await client.close()
    if qd_client :
        await qd_client.close()