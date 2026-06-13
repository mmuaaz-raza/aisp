import asyncio
from typing import  Dict , Any
from semantical_search.main import Embbed , initTransformer, initEmbeddings,SemanticSearch
from bm25.main import LexicalSearch,getAvgLen
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




async def main():
    cache:Dict[str,Any] ={}
    try:
        data= await load_data()
        transformer = initTransformer()
        embeddings = initEmbeddings(data,transformer)
        avglen = getAvgLen(data)
        os.system('clear')
    
        while(True) :
            query = await asyncio.to_thread(input, "Query : ")
            st = time.perf_counter()
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
                    
                    results_s = SemanticSearch(embeddings,target_embedding[0],3)
                    results_l = LexicalSearch(query,data,avglen,3)
                    print(results_s)
                    print(results_l)

                    # cache[query.lower()] = results

        return 0
    except Exception as e:
        print(e)
    
    return 0


asyncio.run(main())