
from models.document import Doc

class GutenBurg:
     def cleanHeaderFooter(self,doc:str):
        start = doc.find("START OF THE PROJECT GUTENBERG EBOOK")
        end = doc.find("END OF THE PROJECT GUTENBERG EBOOK")
        for i in range(start,start+120,1):
            if(doc[i] == '\n') :
                start = i 
                break
        for i in range(end,0,-1):
            if(doc[i] == '\n') :
                end = i 
                break
    
        return  doc[start if start != -1 else 0:end if end != -1 else len(doc)]