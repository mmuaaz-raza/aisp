from groq import Groq
import os
from typing import List 
def Respond(query,docs:List[str]):

    prompt = f"""You are a formal and professional question-answering assistant. Your task is to answer the user's query using only the provided context documents.

Base your answer primarily on the provided documents. If the documents do not fully address the question, you may supplement with general knowledge — but clearly distinguish between what comes from the documents and what does not.


Respond in plain text only. No markdown formatting — no ** bold **, no # headers, no bullet dashes. Use clear section labels like 'SUMMARY:' and 'SECTION 1:' in uppercase instead.
---

<documents>
{docs}
</documents>

<query>
{query}
</query>

Answer:"""
    
    client = Groq(api_key=os.getenv("GROQ_API_KEY") )
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": "You are a meticulous academic assistant specializing in philosophical analysis. You strictly follow instructions and rely only on provided texts."},
            {"role": "user", "content": prompt}
            ],
        temperature=0.3
    )
    return response.choices[0].message.content