import t from 'tap';
import { scrape } from '../src/scraper';

t.test('scrapes a site and fetches title', async (t) => {
  const URL = 'https://apify.com';

  const scraped = await scrape(URL);
  t.equal(
    scraped.title,
    'Apify: Full-stack web scraping and data extraction platform',
  );
  t.end();
});
