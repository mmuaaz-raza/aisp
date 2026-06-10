from datetime import  datetime

from beanie import Document

class Doc (Document):
    filename : str 
    size :int 
    type: str
    dateofupload:datetime
    path : str
    embedding : None =None

    class Settings:
        name ="docs"
        indexes =["path"]