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

class RelevantDocumets():
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

    prompt = f"""You are an expert philosophical researcher and analytical thinker. Your task is to analyze excerpts from a philosophy book to identify, extract, and synthesize complex and abstract philosophical questions related to the user's query.

    <context>
    {context_text}
    </context>

    User Query: {query}

    Instructions:
    1. Deep Analysis: Read the <context> to find both explicit questions and implicit philosophical dilemmas, paradoxes, or core abstract inquiries (e.g., questions regarding existence, ethics, knowledge, consciousness, or meaning).
    2. Synthesis & Explanation: Do not just list quotes. Summarize the underlying philosophical questions the text is wrestling with. Explain *why* these questions are complex and what abstract concepts they touch upon.
    3. Strict Grounding: Base your analysis purely on the provided <context>. Do not introduce outside philosophical theories or authors unless they are explicitly mentioned in the text.
    4. Mandatory Citation: You must cite the specific text supporting your analysis using the inline format [Source ID: abc]. Every major claim or extracted question must be cited.
    5. Missing Context: If the provided excerpts do not contain complex or abstract philosophical questions related to the user's query, you must explicitly state: "The provided text excerpts do not contain abstract philosophical questions relevant to this query." Do not invent or hallucinate philosophical depth that is not present in the text.
    

    ANSWER : 
    """

@router.post("/")
async def SearchBook(req:SearchRequest):
    filters = {}
    if req.ids:
        filters["_id"]= {"$in":req.ids}
    docs =await Doc.find(Doc.is_embedded==True,filters).to_list()
    if not docs:
        return JSONResponse(status_code=status.HTTP_404_NOT_FOUND,content={"message":"no document to find"})
    
    extracted_ids = [str(doc.id) for doc in docs]
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
    docs_v = {}
    for point in matched_documents:
        doc_id = point.id
        similarity_score = point.score
    
        metadata = point.payload 
    
        m_id = metadata.get("m_id", "N/A")
        if m_id not in docs_v:
            doc = await Doc.get(PydanticObjectId)
            if not doc :
                docs_v[m_id] = ""    
            else:
                docs_v[m_id] = doc.title 
        
        Response.append({"text":point.text,"title":docs_v[m_id],"token":point.token_count})

    
    
    response = models["llm"].chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": "You are a meticulous academic assistant specializing in philosophical analysis. You strictly follow instructions and rely only on provided texts."},
            {"role": "user", "content": generatePrompt(req.query,Response)}
            ],
        temperature=0.3
    )

    return JSONResponse(status_code=status.HTTP_200_OK,content=response.choices[0].message.content)
