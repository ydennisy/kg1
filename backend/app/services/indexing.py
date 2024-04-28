from app.db import DB
from app.llm import summarise_text
from app.utils import URLProcessor
from app.utils import URLProcessingResult
from app.utils import NodeChunker
from app.utils import NodeEmbedder
from app.domain import URL
from app.domain import TextNode

db = DB()


class IndexingService:
    async def index(self, urls: list[URL], user_id: str):
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
