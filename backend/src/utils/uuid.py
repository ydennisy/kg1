import secrets
import time
import uuid


_LAST_V7_TIMESTAMP = None


def uuid7() -> str:
    r"""UUID version 7 features a time-ordered value field derived from the
    widely implemented and well known Unix Epoch timestamp source, the
    number of milliseconds since midnight 1 Jan 1970 UTC, leap seconds
    excluded. As well as improved entropy characteristics over versions
    1 or 6.

    Reference: https://github.com/oittaa/uuid6-python
    """

    UUID_VERSION = 7
    global _LAST_V7_TIMESTAMP

    nanoseconds = time.time_ns()
    timestamp_ms = nanoseconds // 10**6
    if _LAST_V7_TIMESTAMP is not None and timestamp_ms <= _LAST_V7_TIMESTAMP:
        timestamp_ms = _LAST_V7_TIMESTAMP + 1
    _LAST_V7_TIMESTAMP = timestamp_ms
    uuid_int = (timestamp_ms & 0xFFFFFFFFFFFF) << 80
    uuid_int |= secrets.randbits(76)
    if not 0 <= uuid_int < 1 << 128:
        raise ValueError("int is out of range (need a 128-bit value)")
    # Set the variant to RFC 4122.
    uuid_int &= ~(0xC000 << 48)
    uuid_int |= 0x8000 << 48
    # Set the version number.
    uuid_int &= ~(0xF000 << 64)
    uuid_int |= UUID_VERSION << 76
    return str(uuid.UUID(int=uuid_int))
