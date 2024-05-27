import asyncio
import logging
from typing import List
from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

client = OpenAI()
log = logging.getLogger(__name__)

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
async def embed_with_retry(text: str) -> List[float]:
    try:
        words = text.split(" ")
        if len(words) > 1024:
            text = " ".join(words[:1024])
        response = await client.embeddings.acreate(
            input=text, model="text-embedding-3-small", dimensions=256
        )
        return response.data[0].embedding
    except Exception as e:
        log.exception(f"Error embedding text: {e}")
        raise

class NodeEmbedder:
    @staticmethod
    async def embed(texts: str | list[str]) -> list[float]:
        is_input_single_text = False
        if isinstance(texts, str):
            texts = [texts]
            is_input_single_text = True

        embeddings = await asyncio.gather(*[embed_with_retry(text) for text in texts])

        if is_input_single_text:
            return embeddings[0]

        return embeddings
