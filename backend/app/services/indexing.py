from app.db import DB
from app.llm import summarise_text
from app.utils import get_logger
from app.utils import URLProcessor
from app.utils import URLProcessingResult
from app.utils import NodeChunker
from app.utils import NodeEmbedder
from app.domain import URL
from app.domain import TextNode


db = DB()
log = get_logger(__name__)


class IndexingService:
    async def index(self, urls: list[URL], user_id: str):
        log.info(f"Started to index {len(urls)} nodes, submitted by {user_id}")
        await db.create_urls(urls=urls, user_id=user_id)
        processor = URLProcessor()
        processed_urls = await processor.process_urls(urls)

        nodes = []
        for idx, processed_url in enumerate(processed_urls):
            try:
                if isinstance(processed_url, URLProcessingResult):
                    existing_node = await db.get_text_node_by_url(processed_url.url)
                    if existing_node:
                        log.info(
                            f"URL already indexed (duplicate), will be skipped: {processed_url.url}"
                        )
                        urls[idx].set_indexing_skipped_due_to_duplicate()
                        continue

                    text_node = TextNode(
                        url=processed_url.url,
                        url_feed_id=urls[idx].id,
                        title=processed_url.title,
                        text=processed_url.text,
                        summary=summarise_text(processed_url.text),
                    )
                    text_node.create_chunks(NodeChunker)
                    await text_node.create_embeddings(NodeEmbedder)
                    nodes.append(text_node)
                    urls[idx].set_indexing_success()
                else:
                    urls[idx].set_indexing_failure()
            except Exception as ex:
                log.exception(ex)
                urls[idx].set_indexing_failure()

        if len(nodes) > 0:
            # TODO: an issue can happen here if a dupe is submitted quickly,
            # or in the same request, it will pass the exists check in the loop
            # but the DB will throw and we will not even set it to failed correctly.

            # A good solution is to implement UPSERT vs duplicate detection...
            await db.create_text_nodes(nodes=nodes, user_id=user_id)

        await db.update_urls(urls=urls)
        log.info(f"Finished indexing {len(urls)} nodes, submitted by {user_id}")
