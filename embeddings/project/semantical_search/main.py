from datasets.search import os
from sentence_transformers import SentenceTransformer
import numpy as np
import json 
# from math import sqrt


        





def ProduceEmbeddings(docs,transformer):
        try :
            print("Embedding starting...")
            encoded_docs = transformer.encode(docs)
            print("Embedding done...")
            with open("media/data_en.json","w") as f:
                f.write(json.dumps(encoded_docs.tolist()))
            return encoded_docs
        except Exception as e:
            print(f"error : {e}")
        

def Embbed(query,transformer):
    try :
        encoded_query = transformer.encode(query)
        return encoded_query
    except Exception as e:
        print(f"error : {e}")


def loadEmbeddings() :
    try : 
        with open("media/data_en.json","r") as f:
            content = f.read()
            result = np.array(json.loads(content))
        return result
    except FileNotFoundError as e:
        raise e
    except Exception as e:
        print(f"loading embeddings error : {e}")  


    
    
def SemanticSearch(embeddings, target_embedding,):
    scores =  np.dot(embeddings,target_embedding) / (np.linalg.norm(embeddings,axis=1) * np.linalg.norm(target_embedding,axis=None))
    return [(i, score) for i,score in enumerate(scores)]

# def searchManual(embeddings, target_embedding):
#     dots = len(embeddings) * [0]
#     mg = len(embeddings) * [0]
#     tmg =0
    
#     for i in target_embedding:
#         tmg += i*i

#     for index ,doc in enumerate(embeddings) : 
#         for i,d in enumerate(doc):
#             mg[index] += d*d
#             dots[index] += d *target_embedding[i]
#     final = [(i,val/(sqrt(mg[i])*sqrt(tmg))) for i,val in enumerate(dots)]
#     final.sort(key= lambda x:x[1],reverse=True)
#     return final[:5]

def searchbytreshold(embeddings, target_embedding,treshold):
    scores =  np.dot(embeddings,target_embedding) / (np.linalg.norm(embeddings,axis=1) * np.linalg.norm(target_embedding))
    top_k = np.argsort(scores)[::-1]
    return [(i, scores[i]) for i in top_k if scores[i] >= treshold ][:5]

def negativesearch(embeddings, target_embedding):
    pos_scores =  np.dot(embeddings,target_embedding[0]) / (np.linalg.norm(embeddings,axis=1) * np.linalg.norm(target_embedding[0]))
    neg_scores =  np.dot(embeddings,target_embedding[1]) / (np.linalg.norm(embeddings,axis=1) * np.linalg.norm(target_embedding[1]))
    scores = pos_scores - neg_scores
    top_k = np.argsort(scores)[::-1]
    return [(i, scores[i]) for i in top_k ][:5]

def fuseQueries(embedding1,embedding2):
    return (embedding1+embedding2) /2


def initTransformer():
    try :
        transformer = SentenceTransformer("all-MiniLM-L6-v2")
        print("Model has been loaded")
    except Exception:
        print("error occured while loading the embedder model")

    return transformer

def initEmbeddings(rawData,transformer):
    embeddings = None   
    try :
        embeddings = loadEmbeddings()
    except FileNotFoundError :
        try :
            embeddings = ProduceEmbeddings(rawData,transformer)
        except Exception as e:
            raise e
    except Exception as e:
        raise e
    return embeddings



    
    
    

    # os.system('clear')
    
    # while(True) :
    #     print("[1]Single Query ")
    #     print("[2]Double Query ")
    #     print("Your choice : ",end="")
    #     queryType = str(input())
    #     st = time.perf_counter()
    #     results = None
    #     if(queryType == 'x'):
    #         break
    #     elif(queryType == '1'):
    #         print("Your Query  : ",end="")
    #         query = str(input())
    #         if(query == "x"):
    #             break
    #         st = time.perf_counter()
    #         if query.lower() in cache:
    #             results = cache[query.lower()]
    #         else:  
    #             parts = query.split("NOT")
    #             if len(parts) == 2:
    #                 pos_query, neg_query = parts[0].strip(), parts[1].strip()
    #                 target_embedding = Embbed([pos_query,neg_query],transformer)
    #                 results = negativesearch(embeddings,target_embedding)
    #             else :
    #                 target_embedding = Embbed([query],transformer)
    #                 sti = time.perf_counter()
    #                 results = search(embeddings,target_embedding[0])
    #                 print(f"numpy search time: {time.perf_counter() - sti}")
    #                 sti = time.perf_counter()
    #                 results = searchManual(embeddings,target_embedding[0])
    #                 print(f"manual search time: {time.perf_counter() - sti}")
    #             cache[query.lower()] = results
    #     else :
    #         print("Your Query  1: ",end="")
    #         query1 = str(input())
    #         print("Your Query  2: ",end="")
    #         query2 = str(input())

    #         if(query1 == 'x' or query2 == "x"):
    #             break
    #         st = time.perf_counter()
    #         if ((query1+query2).lower()) in cache:
    #             results = cache[(query1+query2).lower()]
    #         else :
    #             target_embedding = Embbed([query1,query2],transformer)
    #             target_embedding = fuseQueries(target_embedding[0],target_embedding[1])
    #             results = search(embeddings,target_embedding)
    #             cache[(query1+query2).lower()] = results
            

    #     if results:
    #         print(f"total results found : {len(results or [])}")
    #         for i,_ in results:
    #             if content is not None:
    #                 print(f"score : ({_}) | {content[i]} ")
    #     print(f"time taken : {time.perf_counter()-st}")    

# asyncio.run(main())