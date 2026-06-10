from contextlib import asynccontextmanager
import asyncio
import time

@asynccontextmanager
async def File(filename):
    loop = asyncio.get_running_loop()
    file = await loop.run_in_executor(None,open,filename,'w')
    try :
        yield file  
    finally:
        await loop.run_in_executor(None,file.close)
        print("end")

async def writeToFile(filename,content):
    async with File(filename=filename) as f:
        loop = asyncio.get_running_loop()
        print("in between")
        await loop.run_in_executor(None,f.write,content)
        

async def main():
    t = time.perf_counter()
    await asyncio.gather(writeToFile("munna.html","gold"),writeToFile("mvc.html","chutiya miss"))
    print(f"completed  in {time.perf_counter()-t}")


asyncio.run(main())