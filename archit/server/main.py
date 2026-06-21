from fastapi import FastAPI 
from init import setup,models
from routes import docs
from routes import query
from routes import chat
from routes import auth
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(lifespan=setup)
origins = [ "https://ai-archit.vercel.app","http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/ping")
async def ping():
    if "startup_error" in models:
        return {"status": "degraded", "error": models["startup_error"]}
    return {"status": "alive"}

app.include_router(query.router,prefix="/api/v1")
app.include_router(docs.router ,prefix="/api/v1")
app.include_router(auth.router ,prefix="/api/v1")
app.include_router(chat.router ,prefix="/api/v1")


