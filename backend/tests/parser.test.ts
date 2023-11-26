import fs from 'fs/promises';
import path from 'path';
import t from 'tap';
import { parse } from '../src/parser';

t.test('File with a single link', async (t) => {
  const filePath = path.join(__dirname, 'fixtures/single-link.md');
  const fileContents = await fs.readFile(filePath, 'utf8');
  const parsed = parse(fileContents);

  t.equal(parsed.length, 1);
  t.equal(parsed[0].raw, 'https://github.com/mozilla/readability');
  t.end();
});

t.test('File with 2 links, each on a new line', async (t) => {
  const filePath = path.join(__dirname, 'fixtures/multiple-links.md');
  const fileContents = await fs.readFile(filePath, 'utf8');
  const parsed = parse(fileContents);

  t.equal(parsed.length, 2);
  t.equal(parsed[0].raw, 'https://github.com/mozilla/readability');
  t.equal(
    parsed[1].raw,
    'https://takelessons.com/blog/derivative-in-math-an-introduction-with-examples',
  );
  t.end();
});

t.test('File with 2 links, on the same line', async (t) => {
  const filePath = path.join(__dirname, 'fixtures/multiple-links-same-line.md');
  const fileContents = await fs.readFile(filePath, 'utf8');
  const parsed = parse(fileContents);

  t.equal(parsed.length, 2);
  t.equal(parsed[0].raw, 'https://github.com/mozilla/readability');
  t.equal(
    parsed[1].raw,
    'https://takelessons.com/blog/derivative-in-math-an-introduction-with-examples',
  );
  t.end();
});

t.test('File with a note and 1 link, on the same line', async (t) => {
  const filePath = path.join(__dirname, 'fixtures/note-with-link-same-line.md');
  const fileContents = await fs.readFile(filePath, 'utf8');
  const parsed = parse(fileContents);

  t.equal(parsed.length, 2);
  t.equal(parsed[0].type, 'NOTE');
  t.equal(parsed[0].raw, fileContents);
  t.equal(parsed[1].type, 'WEB_PAGE');
  t.equal(
    parsed[1].raw,
    'http://www.express.co.uk/sport/football/1816094/Man-Utd-news-Ten-Hag-Burnley-ref-VAR',
  );
  t.end();
});

t.test('File with a note and 3 links, on multiple lines', async (t) => {
  const filePath = path.join(__dirname, 'fixtures/note-with-multiple-links.md');
  const fileContents = await fs.readFile(filePath, 'utf8');
  const parsed = parse(fileContents);

  t.equal(parsed.length, 4);
  t.equal(parsed[0].type, 'NOTE');
  t.equal(parsed[0].raw, fileContents);
  t.equal(parsed[1].type, 'WEB_PAGE');
  t.equal(
    parsed[1].raw,
    'http://www.express.co.uk/sport/football/1816094/Man-Utd-news-Ten-Hag-Burnley-ref-VAR',
  );
  t.equal(parsed[2].type, 'WEB_PAGE');
  t.equal(
    parsed[2].raw,
    'https://www.express.co.uk/sport/football/1816037/Man-Utd-transfer-news-Liverpool-Arsenal-Ivan-Toney-Brentford',
  );
  t.equal(parsed[3].type, 'WEB_PAGE');
  t.equal(
    parsed[3].raw,
    'https://www.express.co.uk/sport/football/1816044/Tottenham-transfer-news-Ange-Postecoglou-Celtic-Ivan-Perisic',
  );
  t.end();
});
