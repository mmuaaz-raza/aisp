import asyncio
from llm.main import Respond
from crossEncoder.main import initEncoder,CrossEncode
from typing import  List, Dict , Any
from semantical_search.main import Embbed , initTransformer, initEmbeddings,SemanticSearch
from bm25.main import LexicalSearch,getAvgLen,build_df_table
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
    # semantic_results and lexical_results are both unsorted, 
    # indexed 0..n-1 matching corpus order
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
        encoder = initEncoder()
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
            elif query.lower() in cache:
                response = cache[query.lower()]
            else:  
                    target_embedding = Embbed([query],transformer)
                    if target_embedding is None:
                        print("Embedding issue , can't proceed")
                        continue
                    results_s = SemanticSearch(embeddings,target_embedding[0])
                    results_l = LexicalSearch(query,data,avglen,df_table)
                    results = hybridSearch(results_s,results_l,0.2,10)
                    results = CrossEncode(encoder,[(data[i],i) for i,_ in results],query)
                    response = Respond(query,[data[i] for i,_ in results])
                    cache[query.lower()] = response
            print(f"---------RESULT---------\n{response}")
    except Exception as e:
        print(e)
    
    return 0


asyncio.run(main())