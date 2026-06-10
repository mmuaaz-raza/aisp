from contextlib import  asynccontextmanager, contextmanager
import time 
import asyncio
@contextmanager
def File(filename,type='r'):
    file = open(filename,type)
    try :
        print("Enter")
        yield file
    except Exception as e:
        print(f"Exception : {e}")
    finally:
        print("Exit")
        file.close()

async def back(n):
    await asyncio.sleep(1)
    return n

@asynccontextmanager
async def Fun(n):
    x = await back(n)
    print("opening")
    yield x
    print("closing")

async def handlefun(n):
    async with Fun(n) as f:
        await asyncio.sleep(2)
        print(f)
async def main():
    t = time.perf_counter()
    await asyncio.gather(handlefun(3),handlefun(3345))
    print(f"it should work in {time.perf_counter()-t}")


asyncio.run(main())