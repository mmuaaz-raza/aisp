from fastapi import FastAPI ,status
from init import setup
import os
from fastapi.responses import JSONResponse
import aiohttp
from models.document import Doc
from pydantic import BaseModel,Field,HttpUrl
from routes.ingest import ingestion

app = FastAPI(lifespan=setup)


@app.get("/")
def start():
    return {"message","Hello world",os.getcwd()}


app.include_router(ingestion.app ,prefix="/ingest")