from __future__ import annotations

import os
from typing import TYPE_CHECKING

from supabase import create_client

if TYPE_CHECKING:
    from backend.src.domain.node import TextNode
    from src.domain import URL


class DB:
    def __init__(self) -> None:
        self._client = create_client(
            os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY")
        )

    def create_urls(self, urls: list[URL], user_id: str):
        data = [{**url.to_persistence(), "user_id": user_id} for url in urls]
        try:
            return self._client.table("urls_feed").insert(data).execute()
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

    def create_text_nodes(self, nodes: list[TextNode]):
        text_nodes_to_persist = []
        text_node_chunks_to_persist = []
        for node in nodes:
            text_node, text_node_chunks = node.to_persistence()
            text_nodes_to_persist.append(text_node)
            text_node_chunks_to_persist.extend(text_node_chunks)

        self._client.table("text_nodes").insert(text_nodes_to_persist).execute()
        self._client.table("text_node_chunks").insert(
            text_node_chunks_to_persist
        ).execute()
