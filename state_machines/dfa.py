from typing import Callable ,Any
class DFA:
    def __init__(self,states:set[str],alphabets:set[str],transition_func:Callable[[str,str,dict[str,int]],Any],init:str,final_states:set[str]) -> None:
        self.states = states
        self.alphabets = alphabets
        self.transition_func = transition_func
        self.init = init
        self.final_states = final_states
        self.context:dict[str,int] = {"cycles":0}

    def run(self,input_str:str)->bool:
        self.context["cycles"] = 0
        prev_state = "-1"
        if input_str[0] != self.init:
            return False
        
        for alphabet in input_str:
            if not alphabet in self.alphabets :
                return False
            try :
                prev_state = self.transition_func(prev_state,alphabet,self.context)
            except ValueError as e:
                print(e)
                return False
        if prev_state in self.final_states:
            return True
        else :
            return False
        
def guard_func(current_state:int,alphabet:int):
    if current_state == -1:
        return 0
    if current_state ==1 and alphabet ==2:
        return 1
    if current_state ==2 and alphabet ==0:
        return 0
    
    if  int(current_state) >= int(alphabet):
        raise ValueError("invalid light sequence.")
    
    return 0

def Transition(current_state:str,alphabet:str,context:dict[str,int]) :
        val =  guard_func(int(current_state),int(alphabet))
        context["cycles"] +=  val
        return alphabet
    


dfa = DFA({"0","1","2"},{"0","1","2"},Transition,"0",{"2","1","0"})
print(dfa.run("0120120120"))
print(dfa.context["cycles"])