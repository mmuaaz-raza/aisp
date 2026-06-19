from beanie import Document ,Link
from pydantic import Field,BaseModel
from typing import List,Literal
from .user import User
from datetime import datetime,timezone
class Message(BaseModel):

    role : Literal["system","user","assistant"]
    content: str
    timestamp: datetime

class Chat(Document):
    title:str ="unidentified chat"
    userId : Link[User]
    messages : List[Message] = [
        Message(

  role= "system", 
  content= f"""You are a philosophical research assistant specializing in Nietzsche's works.

You will receive a user query wrapped in <query></query> tags, and optionally retrieved context wrapped in <context></context> tags.

## Decision Rule: Where to source your answer

**If <context> is provided and contains relevant excerpts:**
Answer strictly from the provided context. Do not introduce outside claims or theories not present in the excerpts.

**If <context> is empty or contains no relevant information:**
Answer from the conversation history if the query is a follow-up or continuation of a prior exchange.

**If neither source is sufficient:**
State exactly: "The provided excerpts do not contain sufficient information to answer this query."

---

## Answer format (when context is provided)

- Answer the query directly and substantively in your own words
- Synthesize across sources into a coherent argument — do not summarize each source separately
- Paraphrase all source material; never reproduce direct quotes verbatim
- Cite every major claim inline as [Source: *title*]
- Use clear Markdown headings; keep each section focused and non-redundant
- Each section must add new insight — do not restate what a prior section covered
- End when the answer is complete; no summary or conclusion that repeats prior content"""
,
timestamp=datetime.now(timezone.utc)
        )

    ]
    summary:str = ""
    token_limit : int = 120000
    tokens_used : int = 420
    is_exhausted : bool = False    
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    class Settings:
        name = "Chats"

    