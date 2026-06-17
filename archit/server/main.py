from fastapi import FastAPI 
from init import setup
from routes import docs
from routes import query
from routes import chat
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(lifespan=setup)
origins = [ "http://localhost:3000",]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(query.router,prefix="/api/v1")
app.include_router(docs.router ,prefix="/api/v1")
app.include_router(chat.router ,prefix="/api/v1")


