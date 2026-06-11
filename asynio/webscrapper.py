
import os
import time
from urllib.parse import urlparse
from typing import List
import aiofiles
import asyncio
import aiohttp
async def fetchPage(url,session:aiohttp.ClientSession):
    try :
        async with session.get(url,allow_redirects=False) as response:
            html  = await response.text()
            return {"url": url, "ok": True, "html": html}
    except Exception as e:
        return {"url": url,"ok":False , "error":str(e)}
        
async def FetchAll(urls:List[str]):
    connector = aiohttp.TCPConnector(limit=100)
    timeout = aiohttp.ClientTimeout(total=5)
    failed = []
    os.makedirs("media",exist_ok=True)
    print("Fetching ...")
    async with aiohttp.ClientSession(
            connector=connector,
            timeout=timeout,
            headers={"User-Agent": "Mozilla/5.0"}
        ) as session:
            tasks = [fetchPage(url, session) for url in urls]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            count = 0
            print("Storing to files ...")
            for result in results : 
                count +=1
                if isinstance(result,BaseException):
                    failed.append("NULL")
                    continue
                if not result["ok"]:
                    failed.append(result["url"])
                    continue
                hostname = urlparse(result["url"]).hostname or f"unknown_{count}" 
                domain = hostname.removeprefix("www.").split(".")[0]
                async with aiofiles.open(f"media/{domain}.html","w",encoding="utf-8") as f:
                    await f.write(result["html"])
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