from contextlib import asynccontextmanager
from fastapi import FastAPI
import os
from beanie import init_beanie
from fastapi import FastAPI
from pymongo import AsyncMongoClient
from models.document import Doc
from dotenv import load_dotenv
@asynccontextmanager

async def setup(app: FastAPI):
    load_dotenv()
    client = AsyncMongoClient(os.getenv("MONGODBURI"), serverSelectionTimeoutMS=5000)
    try:
            await client["archit"].command("ping")
            db = client["archit"]
            await init_beanie(database=db, document_models=[Doc])
    
            print("Connected to MongoDB successfully!")
    
    except Exception as e:
        print(f"unexpected error occured : {e}")
        
            
    yield 
    await client.close()