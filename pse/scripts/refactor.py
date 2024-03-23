import re
import requests
import pandas as pd
from tqdm import tqdm
from bs4 import BeautifulSoup
from urllib.parse import urlparse, parse_qs

# Constants
INPUT_CSV = "input.csv"
OUTPUT_CSV = "output.csv"
OUTPUT_NO_URLS_CSV = "output_no_urls.csv"
URLS_CSV = "urls.csv"
PAGES_CSV = "pages.csv"
URL_PATTERN = (
    r"http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+"
)


# Functions
def validate_row(row):
    """
    Validates if the necessary keys are present in a row.
    """
    if not all(key in row for key in ["subject", "body", "attachments"]):
        raise ValueError("Invalid row")


def extract_urls(text):
    """
    Extracts URLs from a given text.
    """
    text = re.sub(r"\s+", " ", text.replace("\n", " "))
    urls = re.findall(URL_PATTERN, text)
    return [url.rstrip("/").strip() for url in urls]


def is_url_pdf(url):
    """
    Checks if a URL points to a PDF.
    """
    try:
        response = requests.head(url, allow_redirects=True, timeout=5)
        return response.headers.get("Content-Type", "").lower() == "application/pdf"
    except requests.RequestException:
        return False


def fetch_url_metadata(url):
    """
    Fetches the title and description of a URL.
    """
    try:
        with requests.get(url) as r:
            soup = BeautifulSoup(r.content, "html.parser")
            title = soup.find("title").string.strip() if soup.find("title") else None
            description = None
            for meta_tag in soup.find_all("meta"):
                if (
                    meta_tag.get("name") == "description"
                    or meta_tag.get("property") == "og:description"
                ):
                    description = meta_tag.get("content").strip()
                    break
            return title, description
    except requests.RequestException:
        return None, None


def process_url(url):
    """
    Processes a URL and returns its metadata.
    """
    is_pdf = is_url_pdf(url)
    if is_pdf:
        return {"url": url, "title": None, "description": None, "is_pdf": True}

    title, description = fetch_url_metadata(url)
    return {"url": url, "title": title, "description": description, "is_pdf": False}


def main():
    # Read input CSV
    df = pd.read_csv(INPUT_CSV)
    df["urls"] = df.apply(
        lambda row: extract_urls(f"{row['subject']} {row['body']}"), axis=1
    )
    df["url_count"] = df["urls"].apply(len)
    df.to_csv(OUTPUT_CSV, index=False)
    df[df.url_count < 1].to_csv(OUTPUT_NO_URLS_CSV, index=False)

    # Process URLs
    urls = df["urls"].explode().dropna().drop_duplicates()
    urls.to_csv(URLS_CSV, index=False)

    pages = []
    for url in tqdm(urls.to_list()[:100]):
        try:
            pages.append(process_url(url))
        except Exception as ex:
            print(f"Exception for {url}: {ex}")

    pd.DataFrame(pages).to_csv(PAGES_CSV, index=False)


if __name__ == "__main__":
    main()
