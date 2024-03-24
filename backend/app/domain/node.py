from __future__ import annotations
from typing import TYPE_CHECKING

from app.utils.uuid import uuid7

if TYPE_CHECKING:
    from app.utils.chunker import NodeChunker
    from app.utils.embedder import NodeEmbedder


class TextNodeChunk:
    def __init__(self, text: str, text_node_id: str) -> None:
        self.id = uuid7()
        self.text_node_id = text_node_id
        self.text = text
        self.embedding = None


class TextNode:
    def __init__(self, url_feed_id: str, url: str, title: str, text: str) -> None:
        self.id = uuid7()
        self.url_feed_id = url_feed_id
        self.url = url
        self.title = title
        self.text = text
        self.embedding = None
        self.chunks: list[TextNodeChunk] = []

    def create_chunks(self, chunker: NodeChunker) -> None:
        self.chunks = chunker.chunk(self.id, self.text)

    def create_embeddings(self, embedder: NodeEmbedder) -> None:
        texts = [self.url + self.title + self.text] + [
            chunk.text for chunk in self.chunks
        ]
        embeddings = embedder.embed(texts)
        self.embedding = embeddings[0].tolist()
        for chunk, embedding in zip(self.chunks, embeddings[1:]):
            chunk.embedding = embedding.tolist()

    def to_persistence(self):
        text_node = {
            "id": self.id,
            "url_feed_id": self.url_feed_id,
            "url": self.url,
            "title": self.title,
            "text": self.text,
            "embedding": self.embedding,
        }

        text_node_chunks = []
        for chunk in self.chunks:
            text_node_chunks.append(
                {
                    "id": chunk.id,
                    "text": chunk.text,
                    "embedding": chunk.embedding,
                    "text_node_id": self.id,
                }
            )
        return text_node, text_node_chunks
