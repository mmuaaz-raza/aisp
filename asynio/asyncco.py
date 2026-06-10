import asyncio
import time
import aiofiles
import requests # This is a blocking, non-async library!

# 1. A standard, blocking function
def fetch_url(url):
    print(f"Starting to fetch: {url}")
    response = requests.get(url) # This normally blocks everything!
    print(f"Finished fetching: {url}")
    return response

async def main():
    urls = [
        "https://www.learncpp.com/cpp-tutorial/configuring-your-compiler-choosing-a-language-standard/",
        "https://velton.org",
    ]
    
    start_time = time.perf_counter()
    
    tasks = [asyncio.to_thread(fetch_url, url) for url in urls]
    
    results = await asyncio.gather(*tasks)
    
    for index,res in enumerate(results):
        filename = f"website_{index}.html"
            
        async with aiofiles.open(filename, "w", encoding="utf-8") as f:
                await f.write(res.text) 
                print(f"Saved {filename}")
                
    print(f"Total time: {time.perf_counter() - start_time:.2f} seconds")

# Run it
asyncio.run(main())