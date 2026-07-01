from langgraph.graph import StateGraph,  START, END 
from pydantic import BaseModel


class State(BaseModel):
    query:str
    ans : str
    retries:int 


def resolveQuery(state:State):
    state.ans = state.query + "resolved!"
    state.retries+=1
    print(state.ans,state.retries)
    return state


def Validate(state:State):
    if state.retries < 3:
        return "resolve_query"
    else :
        return END
    


workflow = StateGraph(State)
workflow.add_node("resolve_query",resolveQuery)

workflow.add_edge(START,"resolve_query")
workflow.add_conditional_edges("resolve_query",Validate)

graph = workflow.compile()
graph.invoke(State(query="what is me?",ans="",retries=0))


