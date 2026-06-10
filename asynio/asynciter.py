import asyncio



async def func():
    await asyncio.sleep(0.5)
    results = [x async for x in fun(["list","banana","top"])]
    print(results)
    
    # results = (x async for x in fun(["list","banana","top"]))
    # async for i in results:
    #     print(i)


async def fun(keys):
    for key in keys:
        await asyncio.sleep(1)
        yield key



async def main():
    await func()

asyncio.run(main())