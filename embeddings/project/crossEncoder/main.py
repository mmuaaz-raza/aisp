
from sentence_transformers import CrossEncoder
from typing import List
def initEncoder():
    try:
        encoder = CrossEncoder("cross-encoder/ms-marco-MiniLM-L6-v2")   
        return encoder
    except Exception as e:
        raise e

def CrossEncode(model , docs:List[tuple[str,int]],query:str,k=3):
    queries = [(query,doc[0]) for doc in docs]
    scores = [(docs[i][1],score)for i,score in enumerate(model.predict(queries))]
    scores.sort(reverse=True,key=lambda x:x[1])
    return scores[:k]
