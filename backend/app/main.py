import json
from typing import List, Any

from fastapi import FastAPI, HTTPException, Depends, Body, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel, Field, ConfigDict, EmailStr

from app.db import DB
from app.llm import summarise_text
from app.llm import answer_with_context
from app.utils import URLProcessor
from app.utils import URLProcessingResult
from app.utils import NodeChunker
from app.utils import NodeEmbedder
from app.utils import get_current_user
from app.domain import TextNode
from app.domain import URL


load_dotenv()
app = FastAPI()
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


@app.post("/api/index")
async def post_index_route(payload: PageCreate, user=Depends(get_current_user)):
    try:
        user_id = user.id
        urls = [URL(url=url) for url in payload.urls]
        db.create_urls(urls=urls, user_id=user_id)
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
                        summary=summarise_text(processed_url.text),
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

        db.create_text_nodes(nodes=nodes, user_id=user_id)
        db.update_urls(urls=urls)
        return {"is_success": True}
    except Exception as ex:
        print(ex)
        # raise HTTPException(500)
        # TODO: update client to handle HTTP status codes
        return {"is_success": False}


class Email(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    to: EmailStr = Form(...)
    # from_: EmailStr = Form(..., alias="from")
    # subject: str = Form(...)
    # text: str = Form(...)
    # html: str = Form(...)
    # attachments: int = Form(...)
    # attachment_info: Any = Form(..., alias="attachment-info")
    # spam_score: Any = Form(...)
    # spam_report: Any = Form(...)


@app.post("/api/email")
async def post_index_route(
    to: EmailStr = Form(...),
    from_: EmailStr = Form(..., alias="from"),
    subject: str = Form(...),
    text: str = Form(...),
    html: str = Form(...),
    attachments: int = Form(...),
    attachment_info: Any = Form(..., alias="attachment-info"),
):
    print(to)
    print(from_)
    print(subject)
    print(text)
    print(html)
    print(attachments)
    print(attachment_info)
    return "OK"
