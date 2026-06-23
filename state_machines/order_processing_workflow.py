from typing import Callable ,Any
class DFA:
    def __init__(self,states:set[str],alphabets:set[str],init:str,) -> None:
        self.states = states
        self.alphabets = states
        self.init = init
        self.context:dict[str,Any] = {"tasks":[]}
    
    def __guardAction(self,task:str):
        if not task in self.alphabets :
            raise ValueError("The given task is not registered")
        if not len(self.context["tasks"]) and task != self.init :
            raise ValueError("invalid sequence ")
        if task == 'payment_failure' and not "submit_payment" in self.context["tasks"]:
                raise ValueError("no submit payment has fired ")
        if task == 'retry' and not "payment_failure" in self.context["tasks"]:
                raise ValueError("no payment faliure has fired ")
        if task == 'payment_success' and not "submit_payment" in self.context["tasks"]:
                raise ValueError("no submit payment has fired ")
        if task == 'ship_order' and not "payment_success" in self.context["tasks"]:
                raise ValueError("no submit payment has fired ")
        print(f"task : {task} done")
        self.context["tasks"].append(task)
        return True
    def send(self,task:str):
        try : 
            self.__guardAction(task)
        except BaseException as e:
            raise e


        



dfa = DFA({"submit_payment","payment_failure","retry","payment_success","ship_order"},{"0","1","2"},"submit_payment")
dfa.send("submit_payment")
dfa.send("payment_failure")
dfa.send("retry")
# dfa.send("ship_order")
dfa.send("payment_success")
dfa.send("ship_order")