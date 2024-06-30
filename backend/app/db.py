from __future__ import annotations

import os
from typing import TYPE_CHECKING

from supabase import create_client

from app.utils import get_logger

if TYPE_CHECKING:
    from app.domain import TextNode
    from app.domain import URL

log = get_logger(__name__)


class DB:
    def __init__(self) -> None:
        self._client = create_client(
            os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY")
        )

    def increment_usage_counter(self) -> int:
        result = self._client.rpc("update_usage_counter").execute()
        return result.data

    def search_text_nodes(
        self, emb: list[float], user_id: str, threshold: float = 0.5, top_n: int = 10
    ):
        result = self._client.rpc(
            "search_text_nodes",
            {
                "query_embedding": emb,
                "user_id_filter": user_id,
                "threshold": threshold,
                "top_n": top_n,
            },
        ).execute()
        return result.data if result.data else []

    def search_text_node_chunks(
        self, emb: list[float], user_id: str, threshold: float = 0.5, top_n: int = 10
    ):
        result = self._client.rpc(
            "search_text_node_chunks",
            {
                "query_embedding": emb,
                "user_id_filter": user_id,
                "threshold": threshold,
                "top_n": top_n,
            },
        ).execute()
        return result.data if result.data else []

    def hybrid_search_text_nodes(self, text: str, emb: list[float]):
        result = self._client.rpc(
            "hybrid_search_text_nodes",
            {"query_text": text, "query_embedding": emb, "match_count": 10},
        ).execute()
        return result.data if result.data else []

    def get_text_node(self, id: str):
        result = (
            self._client.table("text_nodes")
            .select("id, title, text, summary, url, embedding")
            .eq("id", id)
            .execute()
        )
        return result.data[0]

    def get_similar_text_nodes(self, id: str, top_n: int = 10):
        result = self._client.rpc(
            "get_similar_text_nodes", {"id": id, "top_n": top_n}
        ).execute()
        return result.data

    def create_urls(self, urls: list[URL], user_id: str):
        urls_to_persist = []
        for url in urls:
            url_to_persist = url.to_persistence()
            url_to_persist["user_id"] = user_id
            urls_to_persist.append(url_to_persist)
        try:
            return self._client.table("urls_feed").insert(urls_to_persist).execute()
        except Exception as ex:
            log.exception(ex)

    def update_urls(self, urls: list[URL]):
        for url in urls:
            try:
                (
                    self._client.table("urls_feed")
                    .update({"status": url.status})
                    .eq("id", url.id)
                    .execute()
                )
            except Exception as ex:
                log.exception(f"Failed to update URL with id {url.id}: {ex}")

    def create_text_nodes(self, nodes: list[TextNode], user_id: str):
        text_nodes_to_persist = []
        text_node_chunks_to_persist = []
        for node in nodes:
            text_node, text_node_chunks = node.to_persistence()
            text_node["user_id"] = user_id
            for chunk in text_node_chunks:
                chunk["user_id"] = user_id
            text_nodes_to_persist.append(text_node)
            text_node_chunks_to_persist.extend(text_node_chunks)

        self._client.table("text_nodes").insert(text_nodes_to_persist).execute()
        self._client.table("text_node_chunks").insert(
            text_node_chunks_to_persist
        ).execute()

    def get_urls_feed(self, user_id: str):
        result = (
            self._client.table("urls_feed")
            .select("id, created_at, url, status, source")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(10)
            .execute()
        )
        return result.data

    def get_user_id_by_email_alias(self, app_email_alias: str):
        result = (
            self._client.table("users")
            .select("id")
            .eq("app_email_alias", app_email_alias)
            .execute()
        )
        if len(result.data) != 1:
            return None
        return result.data[0]["id"]

    def get_user_profile_by_id(self, user_id: str):
        result = (
            self._client.table("users")
            .select("id, email, app_email_alias")
            .eq("id", user_id)
            .execute()
        )
        if len(result.data) != 1:
            return None
        return result.data[0]

    def get_text_node_by_url(self, url: str):
        result = (
            self._client.table("text_nodes")
            .select("id")
            .eq("url", url)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None
