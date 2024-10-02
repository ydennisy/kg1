import os
import json
from typing import List, Literal, Annotated

import umap
import numpy as np
from fastapi import (
    FastAPI,
    HTTPException,
    Depends,
    status,
    Request,
    BackgroundTasks,
    Query,
    Header,
)
from fastapi.encoders import jsonable_encoder
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel, Field, ConfigDict, EmailStr

from app.db import DB
from app.llm import answer_with_context, expand_search_query
from app.utils import (
    NodeEmbedder,
    get_current_user,
    parse_urls_from_text,
    get_user_by_id,
)
from app.domain import URL, URLSource
from app.services import IndexingService, ConceptsService


load_dotenv()
app = FastAPI()
db = DB()
indexing_service = IndexingService()
concepts_service = ConceptsService()


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


@app.get("/api/explore")
async def get_explore_route(user=Depends(get_current_user)):
    user_id = user.id
    nodes = await db.get_text_node_embeddings(user_id)
    embeddings = [node["embedding"] for node in nodes]
    reducer = umap.UMAP(random_state=42, min_dist=0.0, metric="cosine")
    embeddings_2d = reducer.fit_transform(embeddings)

    # Calculate means
    mean_x = np.mean(embeddings_2d[:, 0])
    mean_y = np.mean(embeddings_2d[:, 1])

    # Center the data
    embeddings_2d[:, 0] -= mean_x
    embeddings_2d[:, 1] -= mean_y

    # Scale to a specific range (e.g., -1 to 1)
    max_abs = np.max(np.abs(embeddings_2d))
    embeddings_2d /= max_abs

    for idx, node in enumerate(nodes):
        del node["embedding"]
        node["x"] = float(embeddings_2d[idx][0])
        node["y"] = float(embeddings_2d[idx][1])
        node["cluster"] = 0
    return nodes


@app.get("/api/search")
async def get_search_route(
    q: str, mode: Literal["hybrid", "dense", "llm"], user=Depends(get_current_user)
):
    user_id = user.id
    query_emb = await NodeEmbedder.embed(q)
    if mode == "hybrid":
        pages = await db.hybrid_search_text_nodes(q, query_emb)
        return pages
    elif mode == "dense":
        pages = await db.search_text_nodes(query_emb, user_id=user_id, threshold=0.1)
        return pages
    elif mode == "llm":
        results = []
        pages = await db.search_text_nodes(query_emb, user_id=user_id, threshold=0.1)
        results.extend(pages)

        queries = expand_search_query(q)
        for query in queries:
            query_emb = await NodeEmbedder.embed(query)
            pages = await db.search_text_nodes(
                query_emb, user_id=user_id, threshold=0.1
            )
            results.extend(pages)
        results = list({v["id"]: v for v in results}.values())
        # rank results by score key
        results.sort(key=lambda x: x["score"], reverse=True)
        print(results)
        return results
    else:
        raise HTTPException(400)


@app.get("/api/ask")
async def get_ask_route(
    q: str,
    id: Annotated[list[str] | None, Query()] = None,
    user=Depends(get_current_user),
):
    node_ids = id
    user_id = user.id
    usage_count = await db.increment_usage_counter()
    if usage_count > 1000:
        # TODO: handle this client side!
        raise HTTPException(429)

    query_emb = await NodeEmbedder.embed(q)
    if node_ids:
        # TODO: check this node belongs to the user requesting it!
        # TODO: add a method to fetch multiple items in one query!
        chunks = []
        for id in node_ids:
            node = await db.get_text_node(id)
            del node["embedding"]
            chunks.append(node)
    else:
        chunks = await db.search_text_node_chunks(query_emb, user_id=user_id)
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
    usage_count = await db.increment_usage_counter()
    if usage_count > 1000:
        # TODO: handle this client side!
        raise HTTPException(429)

    node = await db.get_text_node(id)
    related_nodes = await db.search_text_nodes(
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
    urls = await db.get_urls_feed(user_id)
    return urls


class IndexPayload(BaseModel):
    urls: List[str]


@app.post("/api/index", status_code=status.HTTP_202_ACCEPTED)
async def post_index_route(
    payload: IndexPayload,
    background_tasks: BackgroundTasks,
    user=Depends(get_current_user),
):
    try:
        user_id = user.id
        urls = [URL(url=url, source=URLSource.WEB) for url in payload.urls]
        background_tasks.add_task(indexing_service.index, urls, user_id)
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
        user_id = await db.get_user_id_by_email_alias(app_email_alias)

        raw_urls = parse_urls_from_text(payload.text)
        urls = [URL(url=url, source=URLSource.EMAIL) for url in raw_urls]

        await indexing_service.index(urls, user_id)
    except Exception as ex:
        raise HTTPException(500) from ex


@app.get("/api/me")
async def get_profile_route(user=Depends(get_current_user)):
    user_id = user.id
    profile = await db.get_user_profile_by_id(user_id)
    if not profile:
        raise HTTPException(404)
    return profile


@app.post("/api/admin/index", status_code=status.HTTP_202_ACCEPTED)
async def admin_index_route(
    payload: IndexPayload,
    user_id: str,
    x_admin_api_key: str = Header(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    if x_admin_api_key != os.getenv("ADMIN_API_KEY"):
        raise HTTPException(status_code=401, detail="Invalid admin key")

    try:
        get_user_by_id(user_id)
    except Exception:
        raise HTTPException(status_code=404, detail="User not found")

    urls = [URL(url=url, source=URLSource.WEB) for url in payload.urls]
    background_tasks.add_task(indexing_service.index, urls, user_id)


@app.post("/api/admin/create-concepts", status_code=status.HTTP_202_ACCEPTED)
async def admin_index_route(
    user_id: str,
    x_admin_api_key: str = Header(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    if x_admin_api_key != os.getenv("ADMIN_API_KEY"):
        raise HTTPException(status_code=401, detail="Invalid admin key")

    try:
        get_user_by_id(user_id)
    except Exception:
        raise HTTPException(status_code=404, detail="User not found")

    background_tasks.add_task(concepts_service.create_concepts, user_id)
