import json
from typing import List

from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.encoders import jsonable_encoder
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel, Field, ConfigDict, EmailStr

from app.db import DB
from app.llm import answer_with_context
from app.utils import NodeEmbedder
from app.utils import get_current_user
from app.utils import parse_urls_from_text
from app.domain import URL, URLSource

from app.services import IndexingService


load_dotenv()
app = FastAPI()
db = DB()
indexing_service = IndexingService()


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


@app.get("/api/health")
async def get_health():
    return {"STATUS": "OK"}


@app.get("/api/search")
def get_search_route(q: str, user=Depends(get_current_user)):
    user_id = user.id
    query_emb = NodeEmbedder.embed(q)
    pages = db.search_pages(query_emb, user_id=user_id, threshold=0.4)
    return pages


@app.get("/api/ask")
def get_ask_route(q: str, id: str = None, user=Depends(get_current_user)):
    user_id = user.id
    usage_count = db.increment_usage_counter()
    if usage_count > 1000:
        # TODO: handle this client side!
        raise HTTPException(429)

    query_emb = NodeEmbedder.embed(q)
    if id:
        # TODO: check this node belongs to the user requesting it!
        node = db.get_text_node(id)
        del node["embedding"]
        chunks = [node]
    else:
        chunks = db.search_chunks(query_emb, user_id=user_id)
        # NOTE: this is best moved into the DB query when we find the correct value.
        chunks = [c for c in chunks if c["score"] >= 0.4]

    if len(chunks) == 0:
        raise HTTPException(404)

    def generate_streaming_response():
        yield json.dumps({"context": chunks}) + "<END_OF_CONTEXT>"
        for part in answer_with_context(chunks=chunks, question=q):
            yield part

    return StreamingResponse(generate_streaming_response(), media_type="text/plain")


@app.get("/api/node")
async def get_node_route(id: str, user=Depends(get_current_user)):
    user_id = user.id
    usage_count = db.increment_usage_counter()
    if usage_count > 1000:
        # TODO: handle this client side!
        raise HTTPException(429)

    node = db.get_text_node(id)
    related_nodes = db.search_pages(
        node["embedding"], user_id=user_id, threshold=0.4, top_n=5
    )
    related_nodes = [n for n in related_nodes if n["id"] != id]
    node["related"] = related_nodes
    del node["text"]
    del node["embedding"]
    return node


@app.get("/api/index-feed")
async def get_index_feed_route(user=Depends(get_current_user)):
    user_id = user.id
    urls = db.get_urls_feed(user_id)
    return urls


class IndexPayload(BaseModel):
    urls: List[str]


@app.post("/api/index", status_code=status.HTTP_201_CREATED)
async def post_index_route(payload: IndexPayload, user=Depends(get_current_user)):
    try:
        user_id = user.id
        urls = [URL(url=url, source=URLSource.WEB) for url in payload.urls]
        await indexing_service.index(urls, user_id)
    except Exception as ex:
        raise HTTPException(500) from ex


class IndexEmailPayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    to: EmailStr
    from_: EmailStr = Field(..., alias="from")
    subject: str = None
    text: str = None


@app.post("/api/email", status_code=status.HTTP_201_CREATED)
async def post_index_route(request: Request):
    try:
        form = await request.form()
        parsed_form = jsonable_encoder(form)
        payload = IndexEmailPayload(**parsed_form)

        app_email_alias = payload.to.split("@")[0]
        user_id = db.get_user_id_by_email_alias(app_email_alias)

        raw_urls = parse_urls_from_text(payload.text)
        urls = [URL(url=url, source=URLSource.EMAIL) for url in raw_urls]

        await indexing_service.index(urls, user_id)
    except Exception as ex:
        raise HTTPException(500) from ex
