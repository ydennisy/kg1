from enum import Enum
from typing import TypedDict

from app.utils.uuid import uuid7


class URLStatus(Enum):
    RECEIVED_AWAITING_INDEXING = "RECEIVED_AWAITING_INDEXING"
    INDEXED_SUCCESSFULLY = "INDEXED_SUCCESSFULLY"
    INDEXING_FAILED = "INDEXING_FAILED"
    INDEXING_SKIPPED_AS_DUPLICATE = "INDEXING_SKIPPED_AS_DUPLICATE"


class URLSource(Enum):
    WEB = "WEB"
    EMAIL = "EMAIL"


class URLPersistence(TypedDict):
    id: int
    url: str
    raw_url: str
    status: str


class URL:
    def __init__(self, url: str, source: URLSource) -> None:
        self._id = uuid7()
        self._url = url
        self._raw_url = url
        self._source = source
        # TODO: this needs more thought as currently this cleaning can cause failures
        # self.url = self.clean_url(url)
        self._status: URLStatus = URLStatus.RECEIVED_AWAITING_INDEXING

    @property
    def id(self) -> str:
        return self._id

    @property
    def url(self) -> str:
        return self._url

    @property
    def status(self) -> str:
        return self._status.value

    def clean_url(self, url: str) -> str:
        url = url.rstrip("/")
        url = url.replace("http://", "https://")
        return url

    def set_indexing_success(self):
        self._status = URLStatus.INDEXED_SUCCESSFULLY

    def set_indexing_failure(self):
        self._status = URLStatus.INDEXING_FAILED

    def set_indexing_skipped_due_to_duplicate(self):
        self._status = URLStatus.INDEXING_SKIPPED_AS_DUPLICATE

    def to_persistence(self) -> URLPersistence:
        return {
            "id": self._id,
            "url": self._url,
            "raw_url": self._raw_url,
            "status": self._status.value,
            "source": self._source.value,
        }
