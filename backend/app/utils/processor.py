from __future__ import annotations

import asyncio
from typing import Union
from pathlib import Path
from tempfile import NamedTemporaryFile
from dataclasses import dataclass
from urllib.parse import parse_qs
from urllib.parse import urlparse
from typing import TYPE_CHECKING

import fitz
import httpx
import trafilatura
from llama_index.readers.file import PyMuPDFReader

from app.utils import get_logger

if TYPE_CHECKING:
    from app.domain import URL

log = get_logger(__name__)
pdf_loader = PyMuPDFReader()


@dataclass
class URLProcessingResult:
    url: str
    title: str
    text: str


@dataclass
class URLProcessingFailure:
    url: str


""" def is_url_pdf(url) -> bool:
    try:
        response = requests.head(url, allow_redirects=True, timeout=5)
        content_type = response.headers.get("Content-Type", "")
        return content_type.lower() == "application/pdf"
    except Exception as e:
        return False, f"Exception occurred: {str(e)}"


def is_url_hn(url: str) -> bool:
    return "news.ycombinator.com/" in url


def is_url_twitter(url: str) -> bool:
    return "x.com/" in url or "twitter.com/" in url """


class BaseProcessor:
    async def _crawl_url(self, url: str) -> str:
        async with httpx.AsyncClient() as aclient:
            r = await aclient.get(url, follow_redirects=True)
            r.raise_for_status()
            html = r.text
            return html

    async def _download_pdf(self, url: str) -> bytes:
        async with httpx.AsyncClient() as aclient:
            r = await aclient.get(url)
            r.raise_for_status()
            content = r.content
            return content

    async def _fetch_json(self, url) -> dict:
        async with httpx.AsyncClient() as aclient:
            r = await aclient.get(url)
            r.raise_for_status()
            json = r.json()
            return json

    def _extract_content_from_html(self, html):
        extracted = trafilatura.bare_extraction(html)
        return extracted

    async def process(self, url: str) -> URLProcessingResult:
        raise NotImplementedError


class DefaultProcessor(BaseProcessor):
    async def process(
        self, url: str
    ) -> Union[URLProcessingResult, URLProcessingFailure]:
        try:
            html = await self._crawl_url(url)
            extracted = self._extract_content_from_html(html)
            return URLProcessingResult(
                url=url,
                title=extracted["title"],
                text=extracted["text"],
            )
        except Exception as ex:
            log.exception(ex)
            return URLProcessingFailure(url)


class PDFProcessor(BaseProcessor):
    async def process(
        self, url: str
    ) -> Union[URLProcessingResult, URLProcessingFailure]:
        try:
            content = await self._download_pdf(url)
            with NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
                temp_pdf.write(content)
                temp_pdf_path = Path(temp_pdf.name)
            pdf_pages = pdf_loader.load_data(file_path=temp_pdf_path, metadata=True)
            title = fitz.open(temp_pdf_path).metadata.get("title")
            temp_pdf_path.unlink()
            pdf_pages_texts = [p.text for p in pdf_pages]
            text = "\n\n".join(pdf_pages_texts)
            return URLProcessingResult(url=url, title=title, text=text)
        except Exception as ex:
            log.exception(ex)
            return URLProcessingFailure(url)


class HNProcessor(BaseProcessor):
    async def process(
        self, url: str
    ) -> Union[URLProcessingResult, URLProcessingFailure]:
        try:
            parsed = urlparse(url)
            query = parse_qs(parsed.query)
            api_url = (
                f"https://hacker-news.firebaseio.com/v0/item/{query['id'][0]}.json"
            )
            result = await self._fetch_json(api_url)
            if "url" in result:
                html = await self._crawl_url(result["url"])
                extracted = self._extract_content_from_html(html)
                return URLProcessingResult(
                    url=result["url"],
                    title=extracted["title"],
                    text=extracted["text"],
                )
            else:
                # TODO: improve the handling of HN links to child comments.
                title = result.get("title")
                text = result.get("text")
                return URLProcessingResult(
                    url=url,
                    title=title if title else text[:128],
                    text=text,
                )
        except Exception as ex:
            log.exception(ex)
            return URLProcessingFailure(url)


class URLProcessor:
    def __init__(self):
        self.processors = {
            "pdf": PDFProcessor(),
            "hn": HNProcessor(),
        }
        self.default_processor = DefaultProcessor()

    def _get_processor(self, url: str) -> BaseProcessor:
        if "news.ycombinator.com/" in url:
            return self.processors["hn"]
        # TODO: need a proper fix here, by checking the mime type.
        elif url.endswith(".pdf") or "/pdf/" in url:
            return self.processors["pdf"]
        else:
            return self.default_processor

    async def _process_url(
        self, url: str
    ) -> Union[URLProcessingResult, URLProcessingFailure]:
        processor = self._get_processor(url)
        try:
            processed_url = await processor.process(url)
            return processed_url
        except Exception as ex:
            log.exception(ex)
            return URLProcessingFailure(url)

    async def process_urls(
        self, urls: list[URL]
    ) -> list[Union[URLProcessingResult, URLProcessingFailure]]:
        tasks = [self._process_url(url.url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return results
