import re


def parse_urls_from_text(text: str) -> list[str]:
    url_pattern = r"https?://[\w.-]+(?:\:[0-9]+)?(?:/[^ \n]*)?"
    urls = re.findall(url_pattern, text)
    return urls
