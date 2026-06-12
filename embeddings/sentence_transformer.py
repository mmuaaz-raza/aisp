from sentence_transformers import SentenceTransformer
import numpy as np

transformer = SentenceTransformer("all-MiniLM-L6-v2")
words = ["cat","dog","puppy","cub","pet"]

encoding = transformer.encode(words)

def getcosinesimilarity(v1,v2):
    return np.dot(v1,v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
    
pairs = [(i,j) for i in range(0,5) for j in range(i+1,5)]

for i,j in pairs:
    print(f"{words[i]} and {words[j]} : {getcosinesimilarity(encoding[i],encoding[j])}")
