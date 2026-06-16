from beanie import Document 
from pydantic import Field

class Doc(Document):
    title:str = Field(...,max_length=100,min_length=10)
    content : str 
    index : str
    size : float|int 
    is_embedded:bool =False 

    class Settings:
        name = "Documents"
    