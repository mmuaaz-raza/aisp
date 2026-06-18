from fastapi import APIRouter,Depends,Request , responses,HTTPException, status ,Body
from datetime import datetime, timedelta, timezone
from beanie import PydanticObjectId
import jwt
from pymongo.errors import DuplicateKeyError
from typing import Annotated
from models.user import User
import bcrypt
import os
from pydantic import BaseModel,Field,EmailStr,ConfigDict
import asyncio
from dependencies.auth import authenticateUser,TokenPayload

router = APIRouter(prefix="/auth")



@router.get("/")
async def getMe(user=[dict,Depends(authenticateUser)]):
    if isinstance(user,responses.Response):
        return user
    user =await User.get(PydanticObjectId(user.id))
    if not user:
        return responses.JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED,content={"message":"invalid credentials"})
    return responses.JSONResponse(status_code=status.HTTP_200_OK,content=user.model_dump(mode="json",exclude={"id","password"}))




@router.post("/logout")
def logOut():
    response = responses.JSONResponse(content={"message": "Logged out"})

    response.set_cookie(
        key="archit_auth", value="", max_age=0, httponly=True, samesite="lax"
    )

    return response


class RegisterPayload(BaseModel):
    model_config = ConfigDict(regex_engine="python-re")
    name:str =Field(...,min_length=3,max_length=16,pattern=r"^[a-zA-Z0-9_]+$",description="Username must be alphanumeric or contain underscores.",)
    password :str =  Field(...,min_length=8,
        max_length=32,
        pattern=r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$",
        description="Password must contain at least one uppercase letter, one lowercase letter, and one number.",)
    email : EmailStr

async def GenerateAuthToken(user,message="Registered successfully"):
    token :TokenPayload = TokenPayload(id=str(user["id"]),name=user["name"],exp=int((datetime.now(timezone.utc) + timedelta(days=7)).timestamp()))
    jwt_token =await asyncio.to_thread(jwt.encode,token.model_dump(mode="python"),os.getenv("JWT_SECRET"),algorithm="HS256")

    response_obj = responses.JSONResponse(
    content={"message": message},
    status_code=status.HTTP_201_CREATED,
    )
    response_obj.set_cookie(
        key="archit_auth",
        value=jwt_token,
        max_age=60 * 60 * 24 * 7,
        httponly=True,
        secure=False,
        samesite="lax"
    )
    return response_obj

@router.post("/register")
async def Register(user:Annotated[dict,Depends(authenticateUser)],register:Annotated[RegisterPayload,Body()]):
    if isinstance(user,TokenPayload):
        return responses.JSONResponse(status_code=status.HTTP_403_FORBIDDEN,content={"message":"signed in already"})
    password_bytes = register.password.encode("utf-8")
    salt = bcrypt.gensalt(18)
    encrpyted_pass = bcrypt.hashpw(password=password_bytes,salt=salt)
    encrpyted_pass = encrpyted_pass.decode("utf-8")
    try :

        new_user = User(name=register.name,password=encrpyted_pass,email=register.email)
        await new_user.save()
    except DuplicateKeyError as e:
            # Check which field violated the unique constraint
            error_msg = "Username or Email already exists"
            if "email" in str(e):
                error_msg = "Email is already registered"
            elif "name" in str(e):
                error_msg = "Username is already taken"
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg
            )

    return await GenerateAuthToken(new_user.model_dump())


class LoginPayload(BaseModel):
    model_config = ConfigDict(regex_engine="python-re")
    name:str 
    password :str =  Field(...,min_length=8,
        max_length=32,
        pattern=r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$",
        description="Password must contain at least one uppercase letter, one lowercase letter, and one number.",)

@router.post("/login")
async def Login(dtoken:Annotated[dict,Depends(authenticateUser)],loginp:Annotated[LoginPayload,Body()]):
    if isinstance(dtoken,TokenPayload):
        return responses.JSONResponse(status_code=status.HTTP_202_ACCEPTED,content={"message":"signed in already"})
    
    filters = {
        "$or": [
        {"name": loginp.name},
        {"email": loginp.name}
    ]
    }

    user = await User.find_one(filters)
    if not user:
        return responses.JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED,content={"message":"Password or Username/Email is not correct"})
    
    encoded_pass = user.password.encode("utf-8")
    is_valid = bcrypt.checkpw(hashed_password=encoded_pass,password=loginp.password.encode("utf-8"))

    if not is_valid:
        return responses.JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED,content={"message":"Password or Username/Email is not correct"})
    
      
    return await GenerateAuthToken(user.model_dump(),"Logined successfully")