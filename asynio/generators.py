def fib(n):
    last =0 
    last2= 1
    for i in range(1,n+1,1):
        result =last+last2
        yield result
        last2 = last
        last = result

g = fib(7)

print(list(g))

