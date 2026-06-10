from datetime import datetime, time, timedelta

from fastapi import HTTPException, Request
from starlette import status


limit_time =None
limit_requests = -1
limit_period = "" # m , s , h 
users= {}

def reset_time():
    global limit_period,limit_time
    if(limit_period =="s") :
        limit_time = datetime.now() + timedelta(seconds=2)
    if(limit_period=="m") :
        limit_time = datetime.now() + timedelta(minutes=1)
    if(limit_period=="h") :
        limit_time = datetime.now() + timedelta(hours=1)

def rate_limit(lr :int ,lp :str):
    async def func(request:Request):
        if request.client is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="suspecious request, can't proceed further")
        ip = request.client.host
        global limit_requests,limit_period,limit_time
        if limit_time is None:
            limit_requests = lr
            limit_period = lp
            reset_time()
        
        window_exceeded = time.monotonic() > limit_time #type:ignore
        if window_exceeded :
            reset_time()
            users[ip] = 1
        else :
            if users.get(ip) :
                if users[ip] < limit_requests:
                    users[ip] += 1
                else : 
                    raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS,detail="Server is overwhelmed right now , try again later")
            else :
                    users[ip] = 1
        return True
    return func