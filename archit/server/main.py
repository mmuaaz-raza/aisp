from fastapi import FastAPI 
from init import setup
import asyncio

app = FastAPI(lifespan=setup)

