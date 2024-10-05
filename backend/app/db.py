from __future__ import annotations

import json
from typing import TYPE_CHECKING

from supabase import acreate_client, Client

from app.utils import get_logger
from app.config import config

if TYPE_CHECKING:
    from app.domain import TextNode
    from app.domain import URL

log = get_logger(__name__)


class DB:
    def __init__(self) -> None:
        self._client: Client | None = None

    async def initialize(self) -> None:
        self._client = await acreate_client(
            supabase_url=config.SUPABASE_URL, supabase_key=config.SUPABASE_KEY
        )

    async def increment_usage_counter(self) -> int:
        if not self._client:
            await self.initialize()
        result = await self._client.rpc("update_usage_counter").execute()
        return result.data

    async def search_text_nodes(
        self, emb: list[float], user_id: str, threshold: float = 0.5, top_n: int = 10
    ):
        if not self._client:
            await self.initialize()
        result = await self._client.rpc(
            "search_text_nodes",
            {
                "query_embedding": emb,
                "user_id_filter": user_id,
                "threshold": threshold,
                "top_n": top_n,
            },
        ).execute()
        return result.data if result.data else []

    async def search_text_node_chunks(
        self, emb: list[float], user_id: str, threshold: float = 0.5, top_n: int = 10
    ):
        if not self._client:
            await self.initialize()
        result = await self._client.rpc(
            "search_text_node_chunks",
            {
                "query_embedding": emb,
                "user_id_filter": user_id,
                "threshold": threshold,
                "top_n": top_n,
            },
        ).execute()
        return result.data if result.data else []

    async def hybrid_search_text_nodes(self, text: str, emb: list[float]):
        if not self._client:
            await self.initialize()
        result = await self._client.rpc(
            "hybrid_search_text_nodes",
            {"query_text": text, "query_embedding": emb, "match_count": 10},
        ).execute()
        return result.data if result.data else []

    async def get_text_node(self, id: str):
        if not self._client:
            await self.initialize()
        result = (
            await self._client.table("text_nodes")
            .select("id, title, text, summary, url, embedding")
            .eq("id", id)
            .execute()
        )
        return result.data[0]

    async def get_text_nodes(self, user_id: str):
        if not self._client:
            await self.initialize()
        result = (
            await self._client.table("text_nodes")
            .select("id, title, text, summary, url")
            .eq("user_id", user_id)
            .execute()
        )
        return result.data

    async def get_similar_text_nodes(self, id: str, top_n: int = 10):
        if not self._client:
            await self.initialize()
        result = await self._client.rpc(
            "get_similar_text_nodes", {"id": id, "top_n": top_n}
        ).execute()
        return result.data

    async def create_urls(self, urls: list[URL], user_id: str):
        if not self._client:
            await self.initialize()
        urls_to_persist = []
        for url in urls:
            url_to_persist = url.to_persistence()
            url_to_persist["user_id"] = user_id
            urls_to_persist.append(url_to_persist)
        try:
            return (
                await self._client.table("urls_feed").insert(urls_to_persist).execute()
            )
        except Exception as ex:
            log.exception(ex)

    async def update_urls(self, urls: list[URL]):
        if not self._client:
            await self.initialize()
        for url in urls:
            try:
                (
                    await self._client.table("urls_feed")
                    .update({"status": url.status})
                    .eq("id", url.id)
                    .execute()
                )
            except Exception as ex:
                log.exception(f"Failed to update URL with id {url.id}: {ex}")

    async def create_text_nodes(self, nodes: list[TextNode], user_id: str):
        if not self._client:
            await self.initialize()
        text_nodes_to_persist = []
        text_node_chunks_to_persist = []
        for node in nodes:
            text_node, text_node_chunks = node.to_persistence()
            text_node["user_id"] = user_id
            for chunk in text_node_chunks:
                chunk["user_id"] = user_id
            text_nodes_to_persist.append(text_node)
            text_node_chunks_to_persist.extend(text_node_chunks)

        await self._client.table("text_nodes").insert(text_nodes_to_persist).execute()
        await (
            self._client.table("text_node_chunks")
            .insert(text_node_chunks_to_persist)
            .execute()
        )

    async def get_urls_feed(self, user_id: str):
        if not self._client:
            await self.initialize()
        result = (
            await self._client.table("urls_feed")
            .select("id, created_at, url, status, source")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(10)
            .execute()
        )
        return result.data

    async def get_user_id_by_email_alias(self, app_email_alias: str):
        if not self._client:
            await self.initialize()
        result = (
            await self._client.table("users")
            .select("id")
            .eq("app_email_alias", app_email_alias)
            .execute()
        )
        if len(result.data) != 1:
            return None
        return result.data[0]["id"]

    async def get_user_profile_by_id(self, user_id: str):
        if not self._client:
            await self.initialize()
        result = (
            await self._client.table("users")
            .select("id, email, app_email_alias")
            .eq("id", user_id)
            .execute()
        )
        if len(result.data) != 1:
            return None
        return result.data[0]

    async def get_text_node_by_url(self, url: str):
        if not self._client:
            await self.initialize()
        result = (
            await self._client.table("text_nodes")
            .select("id")
            .eq("url", url)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    async def get_text_node_embeddings(self, user_id: str):
        if not self._client:
            await self.initialize()
        result = (
            await self._client.table("text_nodes")
            .select("id,title,embedding")
            .eq("user_id", user_id)
            .limit(1000)
            .execute()
        )
        # NOTE: this is temporary as we should make 2d values on /index
        if result.data:
            for item in result.data:
                if isinstance(item["embedding"], str):
                    item["embedding"] = json.loads(item["embedding"])
        return result.data if result.data else []
