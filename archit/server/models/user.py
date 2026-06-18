from beanie import Document 
from pymongo import IndexModel 


class User(Document):
    name :str
    email :str
    password:str

    class Settings:
        name = "Users"
        indexes = [
            IndexModel("name", unique=True),
            IndexModel("email", unique=True),
        ]
    