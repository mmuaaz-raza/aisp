from langgraph.graph import StateGraph,START,END
from langgraph.prebuilt import ToolNode
from langchain_core.tools import tool
from langchain_groq import ChatGroq
from dotenv import load_dotenv
from pydantic import BaseModel ,Field
from typing import Sequence , Annotated
from langchain_core.messages import BaseMessage,SystemMessage,ToolMessage ,HumanMessage,AIMessage
from langgraph.graph.message import add_messages
load_dotenv()

model = ChatGroq(model="llama-3.3-70b-versatile")

class State(BaseModel):
    messages : Annotated[Sequence[BaseMessage],add_messages]
    # def __init__(self,message:HumanMessage):
        # self.messages = 


class MathArgs(BaseModel):
    x: int = Field(description="The first number")
    y: int = Field(description="The second number")

@tool(args_schema=MathArgs)
def add(x:int,y:int)->int:
    """Addition function to add two numbers together (x+y)"""
    return x+y

@tool(args_schema=MathArgs) 
def subtract(x:int,y:int)->int:
    """Subtraction function to subtract two numbers together (x-y)"""
    return x-y

@tool(args_schema=MathArgs) 
def multiply(x:int,y:int)->int:
    """Multiplication function to multiply two numbers together (x*y)"""
    return x*y

tools =[add,subtract,multiply]

model = model.bind_tools(tools)


def resolveToolUsage(state:State):
    last_message = state.messages[-1]
    if isinstance(last_message, AIMessage) and last_message.tool_calls:
        return "tools"
    else:   
        return END

def query_resolver(state:State):
    response = model.invoke(state.messages)
    return {"messages":[response]}

workflow = StateGraph(State)

workflow.add_node("qr",query_resolver)

tool_node = ToolNode(tools)
workflow.add_node("tools",tool_node)

workflow.set_entry_point("qr")
workflow.add_conditional_edges("qr",resolveToolUsage)
workflow.add_edge("tools","qr")

graph = workflow.compile()
system_message = """You are a helpful mathematical assistant with access to tools.
CRITICAL INSTRUCTIONS FOR TOOL USE:
1. NEVER nest function calls (e.g., do not pass a function call as an argument to another function).
2. You must execute tools strictly ONE step at a time.
3. If you need to perform multiple operations, call the first tool, wait for the user to provide the result, and THEN call the next tool with the numeric result."""
result = graph.invoke(State(messages=[SystemMessage(content=system_message),HumanMessage(content="what is 2*2+2*4 ?")]))

print(result["messages"][-1].content)











