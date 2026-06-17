from beanie import Document 
from pydantic import Field,BaseModel
from typing import List,Literal
from beanie import PydanticObjectId
class Message(BaseModel):
    role : Literal["system","user"]
    content: str

class Chat(Document):
    title:str = Field(...,max_length=100,min_length=10)
    userId : PydanticObjectId 
    messages : List[Message] = []
    is_exhausted : bool = False    


    class Settings:
        name = "Chats"
    