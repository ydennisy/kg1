import { decodeHTML } from 'entities';
import { gotScraping as got } from 'got-scraping';
import { parse } from 'node-html-parser';

interface ScraperResult {
  isError: boolean;
  title: string | null;
  body: string | null;
}

// NOTE: need some time to decide on a good node lib for parsing
// html and extracting just the text, tags, links etc.

const scrape = async (url: string): Promise<ScraperResult> => {
  const result: ScraperResult = {
    isError: true,
    title: null,
    body: null,
  };

  const { body } = await got.get(url);
  const root = parse(body);
  const title = root.getElementsByTagName('title')[0].innerText;
  result.title = decodeHTML(title);
  return result;
};

export { scrape };
