import re
from urllib.parse import urlparse, parse_qs

import requests
import pandas as pd
from tqdm import tqdm
from bs4 import BeautifulSoup

df = pd.read_csv("input.csv")


def validate_row(row):
    if "subject" in row and "body" in row and "attachments" in row:
        pass
    else:
        raise Exception("Invalid row")


def extract_urls(row):
    validate_row(row)
    text = f"{row['subject']} {row['body']}"
    text = text.replace("\n", " ")
    text = re.sub(" +", " ", text)
    url_pattern = r"http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+"
    urls = re.findall(url_pattern, text)
    urls = [u.rstrip("/").strip() for u in urls]
    return urls


df["urls"] = df.apply(extract_urls, axis=1)
df["url_count"] = df.urls.apply(lambda x: len(x))
df.to_csv("output.csv", index=False)
df[df.url_count < 1].to_csv("output_no_urls.csv", index=False)

urls = df["urls"].explode().dropna().drop_duplicates()
urls.to_csv("urls.csv", index=False)


def is_url_pdf(url) -> bool:
    try:
        response = requests.head(url, allow_redirects=True, timeout=5)
        content_type = response.headers.get("Content-Type", "")
        return content_type.lower() == "application/pdf"
    except Exception as e:
        return False, f"Exception occurred: {str(e)}"


def is_url_hn(url: str) -> bool:
    return "news.ycombinator.com/" in url


def is_url_twitter(url: str) -> bool:
    return "x.com/" in url or "twitter.com/" in url


def fetch_url(url):
    r = requests.get(url)
    soup = BeautifulSoup(r.content, "html.parser")
    title = soup.find("title").string
    description = ""
    for meta_tag in soup.find_all("meta"):
        if "name" in meta_tag.attrs and meta_tag.attrs["name"].lower() == "description":
            description = meta_tag.attrs["content"]
        elif (
            "property" in meta_tag.attrs
            and meta_tag.attrs["property"].lower() == "og:description"
        ):
            description = meta_tag.attrs["content"]
    return title, description


def process_hn_url(url):
    parsed = urlparse(url)
    query = parse_qs(parsed.query)
    api_url = f"https://hacker-news.firebaseio.com/v0/item/{query['id'][0]}.json"
    r = requests.get(api_url)
    r = r.json()
    if "url" in r:
        is_pdf = is_url_pdf(r["url"])
        is_twitter = is_url_twitter(r["url"])
        if is_pdf or is_twitter:
            return {
                "url": r["url"],
                "title": None,
                "description": None,
                "is_pdf": is_pdf,
                "is_twitter": is_twitter,
            }
        title, description = fetch_url(r["url"])
        return {
            "url": r["url"],
            "title": title,
            "description": description,
            "is_pdf": is_pdf,
            "is_twitter": is_twitter,
        }
    else:
        return {
            "url": url,
            "title": r["title"],
            "description": r["text"],
            "is_pdf": False,
            "is_twitter": False,
        }


def process_url(url):
    if "news.ycombinator.com" in url:
        return process_hn_url(url)
    is_pdf = is_url_pdf(url)
    is_twitter = is_url_twitter(url)
    if is_pdf or is_twitter:
        return {
            "url": url,
            "title": None,
            "description": None,
            "is_pdf": is_pdf,
            "is_twitter": is_twitter,
        }
    title, description = fetch_url(url)
    return {
        "url": url,
        "title": title,
        "description": description,
        "is_pdf": is_pdf,
        "is_twitter": is_twitter,
    }


pages = []

for url in tqdm(urls.to_list()[:100]):
    try:
        result = process_url(url)
        result["title"] = (
            result["title"].strip()
            if isinstance(result["title"], str)
            else result["title"]
        )
        result["description"] = (
            result["description"].strip()
            if isinstance(result["description"], str)
            else result["description"]
        )
        pages.append(result)
    except Exception as ex:
        print("EXCEPTION  --->   ", url, ex)

pd.DataFrame(pages).to_csv("pages.csv", index=False)
