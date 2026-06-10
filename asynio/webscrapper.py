
import os
import time
from urllib.parse import urlparse
from typing import List
import aiofiles
import requests as req
import asyncio

async def fetchPage(url):
    loop = asyncio.get_running_loop()
    response = await loop.run_in_executor(None,req.get,url)
    return response
        
async def FetchAll(urls:List[str]):
    requests = [fetchPage(x) for x in urls ]
    
    print(f"Fetcing requests {len(requests)}...")
    responses = await asyncio.gather(*requests,return_exceptions=True)
    i = 0
    os.makedirs("media", exist_ok=True)
    failed =[]
    for res in responses:
        if isinstance(res, BaseException):
                failed.append(res)
                continue
        i+=1
        if not res.ok:
            failed.append(res.url)
            continue
            
        hostname = urlparse(res.url).hostname or f"unknown_{i}" 
        domain = hostname.removeprefix("www.").split(".")[0]
        async with aiofiles.open(f"media/{domain}.html","w",encoding="utf-8") as f:
            await f.write(res.text)
    return failed


async def main():
    urls = [
        "https://www.google.com",
        "https://www.youtube.com",
        "https://www.wikipedia.org",
        "https://www.github.com",
        "https://www.reddit.com",
        "https://www.stackoverflow.com",
        "https://www.linkedin.com",
        "https://www.twitter.com",
        "https://www.instagram.com",
        "https://www.facebook.com",
        "https://www.amazon.com",
        "https://www.netflix.com",
        "https://www.microsoft.com",
        "https://www.apple.com",
        "https://www.cloudflare.com",
        "https://www.mozilla.org",
        "https://www.python.org",
        "https://www.npmjs.com",
        "https://www.docker.com",
        "https://www.medium.com",
        "https://www.dev.to",
        "https://www.hashnode.com",
        "https://www.digitalocean.com",
        "https://www.vercel.com",
        "https://www.netlify.com",
        "https://www.heroku.com",
        "https://www.stripe.com",
        "https://www.twilio.com",
        "https://www.openai.com",
        "https://www.anthropic.com",
        "https://www.huggingface.co",
        "https://www.kaggle.com",
        "https://www.arxiv.org",
        "https://www.nasa.gov",
        "https://www.bbc.com",
        "https://www.cnn.com",
        "https://www.reuters.com",
        "https://www.nytimes.com",
        "https://www.theguardian.com",
        "https://www.espn.com",
        "https://www.weather.com",
        "https://www.imdb.com",
        "https://www.spotify.com",
        "https://www.twitch.tv",
        "https://www.discord.com",
        "https://www.notion.so",
        "https://www.figma.com",
        "https://www.canva.com",
        "https://www.dropbox.com",
        "https://www.adobe.com",
    ]
    st = time.perf_counter()
    failed =await FetchAll(urls)
    
    print(f"Failed requests : {failed}")
    print(f"time taken: {time.perf_counter()-st}")

asyncio.run(main())