import re


def parse_urls_from_text(text: str) -> list[str]:
    url_pattern = r"https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+"
    urls = re.findall(url_pattern, text)
    return urls
