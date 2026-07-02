from groq import Groq
import os
from typing import List
from dotenv import load_dotenv
from bm25 import LexicalSearch,build_df_table,getAvgLen

load_dotenv()
models = Groq(api_key=os.getenv("GROQ_API_KEY"))


def GetChunks(fileName:str)->List[str]:
    try :
        with open(fileName,"r") as f:
            content = f.read()
            return content.split("\n\n")
    except Exception as e:
        print(e)
        return []   
      
chunks = GetChunks("gen.txt")
df_table = build_df_table(chunks)
avg_len = getAvgLen(chunks)

def getRelevantDocs(query:str,limit:int=1):
    results = LexicalSearch(query,chunks,avg_len,df_table)
    results.sort(key=lambda x:x[1],reverse=True)
    return [chunks[i] for i,_ in results[:min(10,limit)]]


class AI():
    def __init__(self):
        self.messages = [{"role":"system","content":"""
You run in a loop of Thought, Action, Observation.
At the end of the loop you output a Final Answer.

Use Thought to describe your reasoning about the question, including
what information you still need and why.

Use Action to run one of the actions available to you, then return PAUSE.
You will then be given an Observation, which is the result of that action.

Your available actions are:

search:
e.g. search: causes of the French Revolution
Searches the book's text using lexical (BM25) search and returns the
most relevant passages. Only returns what is actually in the book —
it will not find information the book doesn't contain.

Rules:
- Only use information from Observations to answer. Do not use outside
  knowledge, even if you know the answer.
- If a search returns irrelevant or empty results, try rephrasing the
  query rather than giving up immediately.
- If after a few searches you still cannot find the answer in the book,
  say so honestly in your Final Answer instead of guessing.
- Always end with "Final Answer:" once you have enough information,
  or once you've determined the book doesn't contain the answer.

Example session:

Question: What motivated the character to leave home?
Thought: I need to find the part of the book describing why this
character left home.
Action: search: reasons character left home
PAUSE

You will be called again with:
Observation: [relevant passage text]

Thought: This passage explains the motivation clearly. I can now answer.
Final Answer: [answer based on the passage]
"""}]
    def assistant_response(self):
        response = models.chat.completions.create(model="llama-3.3-70b-versatile",messages=self.messages,temperature=0.1)
        self.messages.append({"role":"assistant","content":response.choices[0].message.content})
        return self.messages[-1]["content"]
    def user_message(self,message):
        self.messages.append({"role":"user","content":f"Question : {message}"})
    def tool_message(self,message):
        self.messages.append({"role":"user","content":f"Observation : {message}"})


def AskAnything(query:str):
    model = AI()
    model.user_message(query)
    for i in range(7):
        response = model.assistant_response()
        if len(response.split("Action:")) ==1:
            return response.split("Final Answer:")[1].strip()
        raw = response.split("Action:")[1].split("\n")[0]
        print(raw)
        action_name, query = raw.split(":", 1)
        query = query.strip()
        docs = getRelevantDocs(query,3)
        model.tool_message("\n\n".join(docs))
    return "coudn't be able to get to answer"


query = input("Anything : ")
while query != "x":
    print(AskAnything(query))
    query = input("Anything : ")

