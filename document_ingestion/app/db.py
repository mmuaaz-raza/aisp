import os
from contextlib import asynccontextmanager

from beanie import init_beanie
from fastapi import FastAPI
from pymongo import AsyncMongoClient

from models.document import Doc


@asynccontextmanager
async def lifespan(app: FastAPI):
        client = AsyncMongoClient(os.getenv("MONGODBURI"), serverSelectionTimeoutMS=5000)
        try:
            await client["orch"].command("ping")
            db = client["orch"]
            await init_beanie(database=db, document_models=[Doc])
    
            print("Connected to MongoDB successfully!")
    
        except Exception as e:
            print(f"unexpected error occured : {e}")
        
        yield
        await client.close()
        
