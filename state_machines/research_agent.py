from langgraph.graph import StateGraph,  START, END 
from langgraph.types import Send
from langchain_groq import ChatGroq
import operator
from pydantic import BaseModel , Field 
from typing import List ,Annotated
from dotenv import load_dotenv
load_dotenv()

model = ChatGroq(
    model="llama-3.3-70b-versatile", # Groq's fast, powerful Llama 3 model
    temperature=0.7,
)

class State(BaseModel):
    query :str
    is_multi_query:bool = Field(description="identify and label 'True' if the given query requires multi_query division for better answer generation")
    multiple_queries : List[str]  = Field(description="A list of multiple queries by breaking down the given query to answer it in a better way")
    final_answer:str
    results: Annotated[list[str], operator.add]

class multiQueryClassification(BaseModel):
    is_multi_query:bool = Field(description="identify and label 'True' if the given query requires multi_query division for better answer generation")
class multiQueryGeneration(BaseModel):
    multiple_queries : List[str]  = Field(description="A list of multiple queries by breaking down the given query to answer it in a better way")


def MultiQueryClassification(state:State):
    structured_model = model.with_structured_output(multiQueryClassification) 
    query = input("Query : ")
    prompt = f"""
    User Query : '{query}' . Classify the given query as is_multi_query required (True) or not (False), based on the abstractness and complexity of query!
    """
    result  = structured_model.invoke(prompt)
    response = {**state.model_dump()}
    if isinstance(result,multiQueryClassification) : 
        response["is_multi_query"] = result.is_multi_query
        response["multiple_queries"] = [query]
        response["query"] = query
    return response


def generateMultiQueries(state:State):
    structured_model = model.with_structured_output(multiQueryGeneration) 
    prompt = f"""
    User Query : '{state.query}' . Generate multiple related queries by breaking down the current one (max : 5), based on the abstractness and complexity of query!
    """
    response  = structured_model.invoke(prompt)
    return {**state.model_dump(),"multiple_queries":response.multiple_queries if isinstance(response,multiQueryGeneration) else []}

class WorkerState(BaseModel):
    query:str

def generateAnswer(state:WorkerState):
    prompt = f"""
    User Query : '{state.query}' .Generate the answer of the query after rigorous reasoning and produce the exact relevant answer
    """
    response = model.invoke(prompt)

    return {"results":[response.content]}

def FinalReducer(state:State):

    prompt = f"""
<Query> 
'{state.query}'
</Query> 

<Provided Information>
{"\n-".join([result for result in state.results])}
</Provided Information>

*Generate an exact and relevant answer to the query by synthesizing the information from the provided texts. Apply rigorous reasoning, but keep your final response concise and to the point. Do not make the answer unnecessarily long.*
"""
    print(prompt,end="\n\n\n")
    
    response = model.invoke(prompt)
    print(response.content)
    return {"final_answer":response.content}



def route_to_dynamic_workers(state: State):
    return [Send("generateAnswer", WorkerState(query= q)) for q in state.multiple_queries]



def checkPoint(state:State):
    print(state)
    return state

def routing(state:State):
    if state.is_multi_query:
        return "generateMultiQuery"
    else :
        return "checkpoint"


graph = StateGraph(State)

graph.add_node("multiqueryclassifier",MultiQueryClassification)
graph.add_node("generateMultiQuery",generateMultiQueries)
graph.add_node("checkpoint",checkPoint)
graph.add_node("generateAnswer",generateAnswer)
graph.add_node("finalReducer",FinalReducer)


graph.add_edge(START,"multiqueryclassifier")
graph.add_conditional_edges("multiqueryclassifier",routing)
graph.add_edge("generateMultiQuery","checkpoint")
graph.add_conditional_edges("checkpoint",route_to_dynamic_workers,["generateAnswer"])
graph.add_edge("generateAnswer","finalReducer")
graph.add_edge("finalReducer",END)





graph = graph.compile()

graph.invoke(input=State(is_multi_query=False,multiple_queries=[],query="",final_answer="",results=[]))



