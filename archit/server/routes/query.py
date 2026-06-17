from fastapi import APIRouter,Query,status
from fastapi.responses import JSONResponse
from beanie import PydanticObjectId
from typing import List,Annotated
from models.document import Doc
from pydantic import BaseModel
from init import models
from beanie import PydanticObjectId
from qdrant_client import models as mod

router = APIRouter()

class SearchRequest(BaseModel):
    ids : List[PydanticObjectId] = []
    query : str

class RelevantDocumets(BaseModel):
    token : int
    text: str
    title : str


def generatePrompt(query:str,documents:List[RelevantDocumets]):
    context_text = ""
    for idx,e in enumerate(documents) :
        context_text += f"\n--- Excerpt {idx + 1} ---\n"
        context_text += f"Source BOOK TITLE: {e.title}\n"
        context_text += f"Content: {e.text}\n"
        context_text += f"Tokens (current chunk): {str(e.token)}\n"

    prompt = f"""
    You are a philosophical research assistant. Answer the user's query using the excerpts below as your primary source material.

    <context>
    {context_text}
    </context>

    Query: {query}

    Rules:
    - Answer the query directly and substantively in your own words, drawing on the provided excerpts
    - Synthesize information across sources into a coherent argument — do not summarize each source separately
    - Paraphrase all source material; never reproduce direct quotes from the text
    - Ground your answer strictly in the provided context; do not introduce outside claims, theories, or figures unless explicitly mentioned in the excerpts
    - Cite every major claim inline as [Source: title of book/document]
    - Use clear Markdown headings to organize the response; keep each section focused and non-redundant
    - Each section must add new insight — do not restate what a previous section already covered
    - End your response when the answer is complete; do not add a summary or conclusion that repeats prior content
    - If the excerpts contain no information relevant to the query, state exactly: "The provided excerpts do not contain sufficient information to answer this query."

    ANSWER:
    """

    return prompt
@router.post("/")
async def SearchBook(req:SearchRequest):
    filters = {}
    docs_v = {}
    if req.ids:
        filters["_id"]= {"$in":req.ids}
    docs =await Doc.find(Doc.is_embedded==True,filters).to_list()
    if not docs:
        return JSONResponse(status_code=status.HTTP_404_NOT_FOUND,content={"message":"no document to find"})
    
    extracted_ids = []
    for doc in docs:
        extracted_ids.append(str(doc.id))
        docs_v[str(doc.id)] = doc.title
        
    embedded_query = models["embedder"].encode(req.query)
    if not models["qd_client"]:
        print(models["qd_client"])
        return JSONResponse(status_code=status.HTTP_501_NOT_IMPLEMENTED,content={"message":"internal server error"})
    
    search_results =await models["qd_client"].query_points(
        collection_name= "books",
        query=embedded_query,
        using="dense",
        with_payload=True,
        query_filter=mod.Filter(
        must=[
            mod.FieldCondition(
                key="m_id", 
                match=mod.MatchAny(any=extracted_ids) 
            )
        ]
    ),limit=5)
    matched_documents = search_results.points
    Response = []

    for point in matched_documents:
        m_id = str(point.payload.get("m_id", "N/A"))
        Response.append(RelevantDocumets(text=point.payload["text"],title=docs_v.get(m_id,"Unknown"),token=point.payload["token_count"]))

    
    
    response = models["llm"].chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You are a meticulous academic assistant specializing in philosophical analysis. You strictly follow instructions and rely only on provided texts."},
            {"role": "user", "content": generatePrompt(req.query,Response)}
            ],
        temperature=0.3
    )

    return JSONResponse(status_code=status.HTTP_200_OK,content={"response":response.choices[0].message.content})

