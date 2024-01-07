import re
from urllib.parse import urlparse, parse_qs

import requests
import pandas as pd
from bs4 import BeautifulSoup

df = pd.read_csv("input.csv")


def validate_row(row):
    if "subject" in row and "body" in row and "attachments" in row:
        pass
    else:
        raise Exception("Invalid row")


def process_hn_urls(urls):
    for url in urls:
        if "news.ycombinator.com" in url:
            parsed = urlparse(url)
            query = parse_qs(parsed.query)
            api_url = f"https://hacker-news.firebaseio.com/v0/item/{query['id'][0]}.json"
            r = requests.get(api_url)
            r = r.json()
            try:
                print(url, r["type"], r["url"])
            except:
                print(url)
                print(r)


def extract_urls(row):
    validate_row(row)
    text = f"{row['subject']} {row['body']}"
    text = text.replace("\n", " ")
    text = re.sub(" +", " ", text)
    url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
    urls = re.findall(url_pattern, text)
    #process_hn_urls(urls)
    return urls


df["urls"] = df.apply(extract_urls, axis=1)
df["url_count"] = df.urls.apply(lambda x: len(x))
df.to_csv("output.csv", index=False)
df[df.url_count<1].to_csv("output_no_urls.csv", index=False)

urls = df["urls"].explode().dropna().drop_duplicates()
urls.to_csv("urls.csv", index=False)


def is_url_pdf(url):
    try:
        response = requests.head(url, allow_redirects=True, timeout=5)
        content_type = response.headers.get('Content-Type', '')
        return content_type.lower() == 'application/pdf'
    except Exception as e:
        return False, f"Exception occurred: {str(e)}"


def fetch_url(url):
    r = requests.get(url)
    soup = BeautifulSoup(r.content, "html.parser")
    title = soup.find("title").string
    description = None
    for meta_tag in soup.find_all("meta"):
        if "name" in meta_tag.attrs and meta_tag.attrs["name"].lower() == "description":
            description = meta_tag.attrs["content"]
        elif "property" in meta_tag.attrs and meta_tag.attrs["property"].lower() == "og:description":
            description = meta_tag.attrs["content"]
    return title, description


def process_hn_url(url):
    parsed = urlparse(url)
    query = parse_qs(parsed.query)
    api_url = f"https://hacker-news.firebaseio.com/v0/item/{query['id'][0]}.json"
    r = requests.get(api_url)
    r = r.json()
    if "url" in r:
        title, description = fetch_url(r["url"])
        return {
            "url": r["url"],
            "title": title,
            "description": description
        }
        #return 'HN skipped!'
    else:
        return {
            "url": url,
            "title": r["title"],
            "description": r["text"]
        }





def process_url(url):
    if "news.ycombinator.com" in url:
        return process_hn_url(url)
    title, description = fetch_url(url)
    return {
        "url": url,
        "title": title,
        "description": description
    }

for url in urls.to_list():
    try:
        print(process_url(url))
    except Exception as ex:
        print("EXCEPTION  --->   ", url, ex)