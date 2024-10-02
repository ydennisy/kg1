import asyncio

from openai import AsyncOpenAI, APIError

from app.utils import get_logger
from app.config import config

log = get_logger(__name__)
client = AsyncOpenAI(api_key=config.OPENAI_API_KEY)


class NodeEmbedder:
    @staticmethod
    async def embed(texts: str | list[str]) -> list[float]:
        is_input_single_text = False
        if isinstance(texts, str):
            texts = [texts]
            is_input_single_text = True

        tasks = [NodeEmbedder._embed(text) for text in texts]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        embeddings = []
        for result in results:
            if isinstance(result, Exception):
                ex = result
                log.exception(ex)
                raise ex
            embeddings.append(result)

        if is_input_single_text:
            return embeddings[0]

        return embeddings

    @staticmethod
    async def _embed(text: str) -> list[float]:
        MAX_RETRIES = 3

        for attempt in range(MAX_RETRIES):
            try:
                # TODO: need a better more global way to handle overly long input documents.
                words = text.split(" ")
                if len(words) > 1024:
                    text = " ".join(words[:1024])

                response = await client.embeddings.create(
                    input=text, model="text-embedding-3-small", dimensions=256
                )
                return response.data[0].embedding
            except APIError as ex:
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(2**attempt)
                else:
                    raise ex
