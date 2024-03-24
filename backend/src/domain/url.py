from enum import Enum
from typing import TypedDict

from src.utils.uuid import uuid7


class URLStatus(Enum):
    RECEIVED_AWAITING_INDEXING = "RECEIVED_AWAITING_INDEXING"
    INDEXING_SKIPED_AS_RECENT_DUPLICATE = "INDEXING_SKIPED_AS_RECENT_DUPLICATE"
    INDEXED_SUCCESSFULLY = "INDEXED_SUCCESSFULLY"
    INDEXING_FAILED = "INDEXING_FAILED"


class URLPersistence(TypedDict):
    id: int
    url: str
    raw_url: str
    status: str


class URL:
    def __init__(self, url: str) -> None:
        self._id = uuid7()
        self._url = url
        self._raw_url = url
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

    def to_persistence(self) -> URLPersistence:
        return {
            "id": self._id,
            "url": self._url,
            "raw_url": self._raw_url,
            "status": self._status.value,
        }
