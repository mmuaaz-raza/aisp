from enum import Enum
import time
from typing import List
from pydantic import BaseModel
class Status(Enum):
    PENDING =1
    PAYMENT_PROCESSING =2
    PAID =3
    PREPARING=4
    SHIPPED = 5
    PAYMENT_FAILED = 9
    DELIVERED =6
    CANCELLED = 7
    REFUNDED = 8


class Order(BaseModel):
    id :str
    code :int
    items : int
    current_state : Status
    model_config = {"frozen": False}

class dfa:
    init_state=Status.PENDING
    terminal_states = [Status.CANCELLED,Status.DELIVERED,Status.REFUNDED,Status.PAYMENT_FAILED]
    transitions = {
        Status.PENDING.name: [Status.PAYMENT_PROCESSING],
        Status.PAYMENT_PROCESSING.name:[Status.PAID,Status.CANCELLED,Status.PAYMENT_FAILED],
        Status.PAID.name:[Status.PREPARING],
        Status.PREPARING.name:[Status.SHIPPED],
        Status.SHIPPED.name:[Status.DELIVERED],
        Status.DELIVERED.name:[Status.REFUNDED],
        Status.CANCELLED.name  :[],
        Status.REFUNDED.name  :[],
        Status.PAYMENT_FAILED.name:[]

    }
    retries= 0;
    logs:List[str] = []
    def __init__(self):
        self.retries = 0
        self.logs = []
    def Transition(self,order:Order,next_state:Status)->Order:
        if not next_state in self.transitions[order.current_state.name]:
            raise ValueError("invalid state transition")
        
        if order.current_state == Status.PAYMENT_PROCESSING:
            if order.code == 19:
                if self.retries == 3:
                    order.current_state = Status.CANCELLED
                    raise ValueError("paymeny failed, Your order has been cancelled")
                self.retries+=1
                self.logs.append(f"{order.current_state.name}->{next_state.name} : {time.time()} [Payment failed , retry attempted , available retires:{self.retries-2}]")
                return order
                
        if order.items == "":
                raise ValueError("Can't proceed with empty order")

        self.logs.append(f"{order.current_state.name}->{next_state} : {time.time()}")
        order.current_state  = next_state        
        return order
    
    def validate(self):
        states = {state.name:False for state in Status}
        queue:List[Status] =[self.init_state]
        while queue:
            x = queue.pop(0)
            if states[x.name] :
                continue
            states[x.name] = True
            queue.extend(self.transitions[x.name])
            if len(self.transitions[x.name]) ==0 and  not x in self.terminal_states:
                raise ValueError("invalid transitions")
            
        for x,value in states.items():
            if not value:
                raise ValueError("invalid transitions")
            
        return True

d = dfa()
print(d.validate())