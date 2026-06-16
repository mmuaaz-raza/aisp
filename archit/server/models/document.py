from beanie import Document 
from pydantic import Field
from typing import List
class Doc(Document):
    title:str = Field(...,max_length=100,min_length=10)
    content : str 
    index : str
    size : float|int 
    is_embedded:bool =False 
    tags :List[str] = []
    thumbnail :str = ""


    class Settings:
        name = "Documents"
    