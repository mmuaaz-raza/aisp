from typing import Dict,List
import re
import math


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
        if text in processText(doc).split(" "):
            count +=1
    return count

def idf(text:str,df_table,corpuslen):
    df_val = df_table.get(text,0)
    return math.log(1+( (corpuslen-df_val+0.5) / (df_val+0.5)))

def getAvgLen(corpus):
    total_len = 0
    for doc in  corpus:
        total_len += len(doc.split(" "))
    return total_len/len(corpus)



def build_df_table(corpus):
    df_table = {}
    for doc in corpus:                              
        unique_words = set(processText(doc).split())  
        for word in unique_words:
            df_table[word] = df_table.get(word, 0) + 1
    return df_table

def LexicalSearch(query,corpus,avglen,df_table):
    query = processText(query)
    response: List[tuple[int,float]] = [(0, 0) for _ in range(len(corpus))]
    corpuslen = len(corpus)
    for i,doc in enumerate(corpus):
        doc = processText(doc)
        temp = 0
        for word in query.split(" "):
            temp += score(doc,word,1.1,0.75,avglen)*idf(word,df_table,corpuslen)
        response[i] = (i,temp)       

    maxi = max(response,key=lambda item: item[1])[1]
    mini = min(response,key=lambda item: item[1])[1]
    # log scaling
    if mini == maxi:
        return [(i,math.log(1+res)) for i,res in response ]
    
    # min max scaling
    return [(i, (value - mini)/(maxi-mini)) for i,value in response]

