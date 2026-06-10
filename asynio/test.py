import asyncio
import time


async def main():
    st = time.perf_counter()
    print(f"Hello world {time.ctime()}")
    await asyncio.sleep(1.0)
    elapsed = time.perf_counter() - st
    print(f"Good night world {time.ctime()}")
    print(f"time taken : {elapsed:0.2f}")


asyncio.run(main())
