

from fastapi import Request , responses, status 
import jwt
import os
from pydantic import BaseModel

class TokenPayload(BaseModel):
    id:str
    name:str
    exp : int


async def authenticateUser(req:Request):
    token = req.cookies.get("archit_auth")
    if not token:
        return responses.JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED,content={"message":"finvalid credentials."})
    try:
        payload_dict= jwt.decode(token,os.getenv("JWT_SECRET"), algorithms=["HS256"])
        decoded_payload: TokenPayload = TokenPayload(**payload_dict)
        return decoded_payload
    except jwt.ExpiredSignatureError:
        return responses.JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED,content={"message":"credentials expired"})
    except jwt.InvalidTokenError:
        return responses.JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED,content={"message":"invalid credentials.."})
    except jwt.PyJWTError as e:
        print(e)
        return responses.JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED,content={"message":"invalid credentials..."})


