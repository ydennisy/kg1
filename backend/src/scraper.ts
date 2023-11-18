import { decodeHTML } from 'entities';
import { gotScraping as got } from 'got-scraping';
import { parse } from 'node-html-parser';

interface ScraperResult {
  title: string;
}

// NOTE: need some time to decide on a good node lib for parsing
// html and extracting just the text, tags, links etc.

const scrape = async (url: string): Promise<ScraperResult> => {
  const { body } = await got.get(url);
  const root = parse(body);
  const title = root.getElementsByTagName('title')[0].innerText;
  if (!title) {
    throw new Error(`Failed to scrape and get title from: ${url}`);
  }
  return { title: decodeHTML(title) };
};

export { scrape };
