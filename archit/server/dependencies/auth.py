

from fastapi import Request , responses, status 
import jwt
import os
from pydantic import BaseModel
import asyncio

class TokenPayload(BaseModel):
    id:str
    name:str
    exp : int


async def authenticateUser(req:Request):
    token = req.cookies.get("archit_auth")
    if not token:
        return responses.JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED,content={"message":"invalid credentials"})
    try:
        payload_dict= await asyncio.to_thread(
            jwt.decode, token,os.getenv("JWT_SECRET"), algorithm="HS256"
        )

        decoded_payload: TokenPayload = TokenPayload(**payload_dict)
        return decoded_payload
    except jwt.ExpiredSignatureError:
        return responses.JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED,content={"message":"credentials expired"})
    except jwt.InvalidTokenError:
        return responses.JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED,content={"message":"invalid credentials"})

