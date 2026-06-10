def grep():
    print("start execution")
    mylist = ["goyem ","nagir","gotram","mahesh"]
    while True:
        curr = yield
        if curr in mylist:
            return curr



mysearcher = grep()
mysearcher.send(None)
mysearchlist = ["kutta","gadha","sanda","mahesh"]
try : 
    for i in mysearchlist :
        mysearcher.send(i)
except StopIteration as e:
    print(f"Found : {e.value}")