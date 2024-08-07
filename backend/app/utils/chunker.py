from __future__ import annotations

from langchain.text_splitter import RecursiveCharacterTextSplitter

from app.domain import TextNodeChunk

CHUNK_SIZE = 2048
CHUNK_OVERLAP = 256

text_splitter = RecursiveCharacterTextSplitter(
    separators=["\n\n", "\n", " ", ""],
    chunk_size=CHUNK_SIZE,
    chunk_overlap=CHUNK_OVERLAP,
    length_function=len,
)


# TODO: not sure if this needs to return TextNodeChunks
# it could just return a plain list and allow the TextNode
# to hold more "domain" logic.
class NodeChunker:
    @staticmethod
    def chunk(node_id: str, node_text: str) -> list[TextNodeChunk]:
        chunks = text_splitter.create_documents(texts=[node_text])
        chunks = [c.page_content for c in chunks]
        return [TextNodeChunk(text=chunk, text_node_id=node_id) for chunk in chunks]
