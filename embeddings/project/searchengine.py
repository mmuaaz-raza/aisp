import asyncio
from typing import  List, Dict , Any
from semantical_search.main import Embbed , initTransformer, initEmbeddings,SemanticSearch
from bm25.main import LexicalSearch,getAvgLen,build_df_table
import time
import os
import aiofiles
import json 
from datasets import load_dataset 

async def load_data():
    try :
        async with aiofiles.open("media/data.json","r") as f:
            json_string = await f.read()
        content = json.loads(json_string)
        return content    
    except FileNotFoundError:
        ds = load_dataset("fancyzhx/ag_news",split="train[:5000]")
        corpus = [item["text"] for item in ds] #type:ignore
        content = json.dumps(corpus,indent=2)
        async with aiofiles.open("media/data.json","w") as f:
            await f.write(content)
        return corpus    


def hybridSearch(semantic_results,lexical_results,alpha=0.5,k=5):
    results: List[tuple[int,float]] = [(0, 0) for _ in range(len(semantic_results))]

    for i , lr in lexical_results :
        results[i] = (i,alpha*lr+ (1-alpha)*semantic_results[i][1])

    results.sort(key=lambda x:x[1],reverse=True)

    return results[:k]

def pureSearch(result:List[tuple[int,float]],k=3):
    result.sort(key=lambda x:x[1],reverse=True)
    return result[:k]

async def main():
    cache:Dict[str,Any] ={}
    try:
        data= await load_data()
        transformer = initTransformer()
        embeddings = initEmbeddings(data,transformer)
        avglen = getAvgLen(data)
        df_table = build_df_table(data)
        os.system('clear')
    
        while(True) :
            query = await asyncio.to_thread(input, "Query : ")
            results = None
            if(query.strip() == 'x'):
                break
            if query.lower() in cache:
                results = cache[query.lower()]

            else:  
                    target_embedding = Embbed([query],transformer)
                    if target_embedding is None:
                        print("Embedding issue , can't proceed")
                        continue
                    sti = time.perf_counter()
                    results_s = SemanticSearch(embeddings,target_embedding[0])
                    for i,res in pureSearch(results_s):
                        print(i, "|",res ,"|",data[i])
                    print({f"time taken by semantic search : {time.perf_counter()-sti}"})
                    sti2 = time.perf_counter()
                    results_l = LexicalSearch(query,data,avglen,df_table)
                    for i,res in pureSearch(results_l):
                        print(i, "|",res ,"|",data[i])
                    print({f"time taken by Lexical search : {time.perf_counter()-sti2}"})
                    results = hybridSearch(results_s,results_l,0.5,3)
                    for i,res in results:
                        print(i, "|",res ,"|",data[i])

                    print({f"time taken by Hybrid search : {time.perf_counter()-sti}"})
                    cache[query.lower()] = results
                                

        return 0
    except Exception as e:
        print(e)
    
    return 0


asyncio.run(main())