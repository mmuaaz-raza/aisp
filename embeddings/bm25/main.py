from typing import Dict,List
import re
import math
dummy = "Machine Learning"
corpus = [
    "Python is a popular programming language used for data science machine learning web development and automation tasks.",
    
    "Machine learning algorithms learn patterns from data and are widely applied in prediction classification and recommendation systems.",
    
    "Deep learning is a subset of machine learning that uses neural networks with many layers to process complex data.learning loves the way to learning",
    
    "Relational databases store structured information in tables and support SQL queries for efficient data retrieval.",
    
    "Vector databases are designed for similarity search and are commonly used in retrieval augmented generation systems.",
    
    "Hybrid search combines keyword search and vector search to improve retrieval quality and relevance in information systems.",
    
    "Natural language processing focuses on understanding text documents extracting meaning and generating human like responses.",
    
    "The football team won the championship after a strong defensive performance and consistent attacking strategy throughout the season.",
    
    "Renewable energy sources including solar power and wind energy help reduce carbon emissions and support sustainability goals.",
    
    "Cloud computing platforms provide scalable infrastructure storage networking and managed services for modern applications."
]

def Tf(text:str,targetWord:str):
    frequencies:Dict[str,int] = {}
    frequencies[targetWord] =0
    pattern = re.compile(r'[^\w\s]')
    words = pattern.sub(' ',text)
    for word in  words.split(" "):
        if word == targetWord :
            frequencies[word]+=1

    return frequencies[targetWord]

def avgLen(docs:List[str]):
    total_len = 0
    for doc in  docs:
        total_len += len(doc.split(" "))
    return total_len/len(docs)
avglen =  avgLen(corpus)

def score(text:str,targetWord:str,k:float,b:float):
    freq = Tf(text,targetWord=targetWord)
    return (freq * (k+1))/(freq+k*(1-b+b*(len(text.split(" "))/avglen)))

def df(text:str,corpus:List[str]):
    count = 0
    for doc in corpus:
        if(doc.lower().split(" ").count(text)):
            count +=1
    return count

def idf(text:str,corpus:List[str]):
    return math.log(1+( (len(corpus)-df(text,corpus)+0.5) / (df(text,corpus)+0.5)))

print(score(corpus[2],"learning",0.1,1),Tf(corpus[2],"learning"))
print(score(corpus[2],"learning",0.1,0.9),Tf(corpus[2],"learning"))

def main():
    target = str(input())
    target = target.split(" ")
    for word in target:
        word = word.lower()
        idf_value = idf(word,corpus)
        for i,doc in enumerate(corpus):
            doc = doc.lower()
            print(f"bm25 score ({word}) in {i} doc : {score(doc,word,1.1,0.75)*idf_value} ")


# main()