from typing import Dict,List
import re
import math

corpus = ["machine learning is going to be really amazing ","by the idea that everything can be automated","this is the new horizon/world for the new world"]

def processText(text):
    pattern = re.compile(r'[^\w\s]')
    words = pattern.sub(' ',text)
    
    return words.lower()

def Tf(text:str,targetWord:str):
    frequencies:Dict[str,int] = {}
    frequencies[targetWord.lower()] =0
    for word in  processText(text).split(" "):
        if word == targetWord :
            frequencies[word]+=1
    return frequencies[targetWord]

    


def score(text:str,targetWord:str,k:float,b:float,avglen):
    freq = Tf(text,targetWord=targetWord)
    return (freq * (k+1))/(freq+k*(1-b+b*(len(text.split(" "))/avglen)))

def df(text:str,corpus:List[str]):
    count = 0
    for doc in corpus:
        if(processText(doc).split(" ").count(text)):
            count +=1
    return count

def idf(text:str,corpus:List[str]):
    df_val = df(text,corpus)
    return math.log(1+( (len(corpus)-df_val+0.5) / (df_val+0.5)))

def getAvgLen(corpus):
    total_len = 0
    for doc in  corpus:
        total_len += len(doc.split(" "))
    return total_len/len(corpus)

def LexicalSearch(query,corpus,avglen):
    query = processText(query)
    response: List[tuple[int,float]] = [(0, 0) for _ in range(len(corpus))]
    idf_values = {word: idf(word, corpus) for word in query.split(" ")}
    mini = 1e4 
    maxi = 0
    for i,doc in enumerate(corpus):
        doc = processText(doc)
        temp = 0
        for word in query.split(" "):
            idf_value = idf_values[word]
            temp += score(doc,word,1.1,0.75,avglen)*idf_value
        maxi = max(temp,maxi)
        mini = min(mini,temp)
        response[i] = (i,temp)       

    # log scaling
    if(mini == maxi) :
        return [(i,math.log(1+res)) for i,res in response ]
    
    # min max scaling
    return [(i, (value - mini)/(maxi-mini)) for i,value in response]

