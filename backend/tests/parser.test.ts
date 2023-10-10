import fs from 'fs/promises';
import path from 'path';
import t from 'tap';
import { parse } from '../src/parser';

t.test('file contains empty front matter', async (t) => {
  const filePath = path.join(__dirname, 'fixtures/front-matter-empty.md');
  const fileContents = await fs.readFile(filePath, 'utf8');

  const parsed = parse(fileContents);
  t.equal(parsed.title, null);
  t.equal(parsed.body, 'This is an article about sport!');
  t.end();
});

t.test('file contains front matter with a title', async (t) => {
  const filePath = path.join(__dirname, 'fixtures/front-matter-title.md');
  const fileContents = await fs.readFile(filePath, 'utf8');
  const parsed = parse(fileContents);

  t.equal(parsed.title, 'Sport is good');
  t.equal(parsed.body, 'This is an article about sport!');
  t.end();
});

t.test('file contains front matter with a title & tags', async (t) => {
  const filePath = path.join(__dirname, 'fixtures/front-matter-title-tags.md');
  const fileContents = await fs.readFile(filePath, 'utf8');
  const parsed = parse(fileContents);

  t.equal(parsed.title, 'Sport is good');
  t.has(parsed.tags, ['sport', 'football', 'liverpool fc']);
  t.equal(parsed.body, 'This is an article about sport!');
  t.end();
});

t.test('file contains no front matter, but does have a body', async (t) => {
  const filePath = path.join(__dirname, 'fixtures/body.md');
  const fileContents = await fs.readFile(filePath, 'utf8');

  const parsed = parse(fileContents);
  t.equal(parsed.title, null);
  t.equal(parsed.body, 'This is an article about sport!');
  t.end();
});

t.test('file contains no front matter, but a body with 3 links', async (t) => {
  const filePath = path.join(__dirname, 'fixtures/body-with-links.md');
  const fileContents = await fs.readFile(filePath, 'utf8');
  const parsed = parse(fileContents);

  t.equal(parsed.title, null);
  t.has(parsed.tags, []);
  t.ok(parsed.body?.includes('This is an article about sport!'));
  t.has(parsed.links, [
    'http://www.express.co.uk/sport/football/1816094/Man-Utd-news-Ten-Hag-Burnley-ref-VAR',
    'https://www.express.co.uk/sport/football/1816037/Man-Utd-transfer-news-Liverpool-Arsenal-Ivan-Toney-Brentford',
    'https://www.express.co.uk/sport/football/1816044/Tottenham-transfer-news-Ange-Postecoglou-Celtic-Ivan-Perisic',
  ]);
  t.end();
});
