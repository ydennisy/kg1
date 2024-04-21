from __future__ import annotations

import os
from typing import TYPE_CHECKING

from supabase import create_client

if TYPE_CHECKING:
    from app.domain import TextNode
    from app.domain import URL


class DB:
    def __init__(self) -> None:
        self._client = create_client(
            os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY")
        )

    def increment_usage_counter(self) -> int:
        result = self._client.rpc("update_usage_counter").execute()
        return result.data

    def search_pages(
        self, emb: list[float], user_id: str, threshold: float = 0.5, top_n: int = 10
    ):
        data = self._client.rpc(
            "search_pages",
            {
                "query_embedding": emb,
                "user_id_filter": user_id,
                "threshold": threshold,
                "top_n": top_n,
            },
        ).execute()
        return data.data

    def search_chunks(
        self, emb: list[float], user_id: str, threshold: float = 0.5, top_n: int = 10
    ):
        data = self._client.rpc(
            "search_chunks",
            {
                "query_embedding": emb,
                "user_id_filter": user_id,
                "threshold": threshold,
                "top_n": top_n,
            },
        ).execute()
        return data.data

    def get_text_node(self, id: str):
        data = (
            self._client.table("text_nodes")
            .select("id, title, text, summary, url, embedding")
            .eq("id", id)
            .execute()
        )
        return data.data[0]

    def get_similar_text_nodes(self, id: str, top_n: int = 10):
        data = self._client.rpc(
            "get_similar_text_nodes", {"id": id, "top_n": top_n}
        ).execute()
        return data.data

    def create_urls(self, urls: list[URL], user_id: str):
        urls_to_persist = []
        for url in urls:
            url_to_persist = url.to_persistence()
            url_to_persist["user_id"] = user_id
            urls_to_persist.append(url_to_persist)
        try:
            return self._client.table("urls_feed").insert(urls_to_persist).execute()
        except Exception as ex:
            print(ex)

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
                print(f"Failed to update URL with id {url.id}: {ex}")

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
