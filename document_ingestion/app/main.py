import os
from fastapi import FastAPI, Request
import dotenv
from slowapi.middleware import SlowAPIMiddleware
from routes.crudDoc import router as CrudDocRouter
from fastapi.responses import HTMLResponse
from .db import  lifespan
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

dotenv.load_dotenv()


    

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(lifespan=lifespan)
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return HTMLResponse(
        status_code=429,
        content="<h1>429 - Too Many Requests</h1><p>Please slow down and try again later.</p>"
    )
    

app.add_middleware(SlowAPIMiddleware) 



@app.get("/",response_class=HTMLResponse)
@limiter.limit("5/minute")
def landing(request:Request):
    current_directory = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(current_directory,"index.html")
    
    with open(file_path,"r",encoding="utf-8") as file:
        html_content = file.read()
        if not html_content : 
            return {"details":"Internal server error!"}
        
    return HTMLResponse(content=html_content)
    
app.include_router(
    CrudDocRouter,
    prefix="/v1/documents",
)
    


