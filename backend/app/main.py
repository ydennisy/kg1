import os
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from supabase import create_client
from pydantic import BaseModel

from app.llm import answer_with_context
from app.db import DB
from app.utils import URLProcessor
from app.utils import URLProcessingResult
from app.utils import NodeChunker
from app.utils import NodeEmbedder
from app.domain import TextNode
from app.domain import URL

load_dotenv()
app = FastAPI()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
db = DB()


allowed_origins = [
    "https://kg1.io",
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PageCreate(BaseModel):
    urls: List[str]


@app.get("/api/health")
async def get_health():
    return {"STATUS": "OK"}


@app.get("/api/search")
async def get_search_route(q: str):
    query_emb = NodeEmbedder.embed(q, return_type="list")
    pages = supabase.rpc(
        "search_pages", {"query_embedding": query_emb, "top_n": 10}
    ).execute()
    return pages.data


@app.get("/api/ask")
def get_ask_route(q: str):
    usage_count = db.increment_usage_counter()
    if usage_count > 1000:
        return "Sorry, we have had to stop usage of the /ask endpoint due to API cost restrictions."
    query_emb = NodeEmbedder.embed(q, return_type="list")
    chunks = supabase.rpc(
        "search_chunks", {"query_embedding": query_emb, "top_n": 10}
    ).execute()
    chunks = chunks.data
    return StreamingResponse(
        answer_with_context(chunks=chunks, question=q), media_type="text/plain"
    )


@app.post("/api/index")
async def post_index_route(payload: PageCreate):
    try:
        urls = [URL(url=url) for url in payload.urls]
        db.create_urls(urls=urls, user_id="public")
        processor = URLProcessor()
        processed_urls = await processor.process_urls(urls)

        nodes = []
        for idx, processed_url in enumerate(processed_urls):
            try:
                if isinstance(processed_url, URLProcessingResult):
                    text_node = TextNode(
                        url=processed_url.url,
                        url_feed_id=urls[idx].id,
                        title=processed_url.title,
                        text=processed_url.text,
                    )
                    text_node.create_chunks(NodeChunker)
                    text_node.create_embeddings(NodeEmbedder)
                    nodes.append(text_node)
                    urls[idx].set_indexing_success()
                else:
                    urls[idx].set_indexing_failure()
            except Exception as ex:
                print(ex)
                urls[idx].set_indexing_failure()

        db.create_text_nodes(nodes)
        db.update_urls(urls=urls)
        return {"is_success": True}
    except Exception as ex:
        print(ex)
        # raise HTTPException(500)
        # TODO: update client to handle HTTP status codes
        return {"is_success": False}
