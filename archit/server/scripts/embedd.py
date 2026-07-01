import os
import httpx
import numpy as np
from dotenv import load_dotenv
load_dotenv()
HF_API_URL = "https://router.huggingface.co/hf-inference/models/BAAI/bge-small-en-v1.5/pipeline/feature-extraction"
HF_TOKEN = os.getenv("HF_TOKEN")

async def embed_text(text: str) -> list[float]:
    async with httpx.AsyncClient() as client:
        res = await client.post(
            HF_API_URL,
            headers={"Authorization": f"Bearer {HF_TOKEN}"},
            json={"inputs": text, "options": {"wait_for_model": True}},
            timeout=30,
        )
        res.raise_for_status()
        result = res.json()
        if isinstance(result[0], list):
            return np.mean(result, axis=0).tolist()
        return result