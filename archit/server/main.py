from fastapi import FastAPI 
from init import setup
from routes import docs
from routes import query
app = FastAPI(lifespan=setup)


app.include_router(query.router)
app.include_router(docs.router)


