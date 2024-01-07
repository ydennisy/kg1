import t from 'tap';
import { app } from '../src/app';

t.test('Succesfully create a NOTE type node', async (t) => {
  const res = await app.inject({
    method: 'POST',
    url: '/nodes',
    body: { raw: 'hello world!' },
  });
  const { statusCode } = res;
  const nodes = res.json();
  console.log(nodes);
  t.equal(statusCode, 200);
  t.equal(nodes.length, 1);
  t.ok(typeof nodes[0].id === 'string');
  t.end();
});

t.test('Succesfully create a WEB_PAGE type node', async (t) => {
  const raw = 'https://example.com/article';
  const res = await app.inject({
    method: 'POST',
    url: '/nodes',
    body: { raw },
  });
  const { statusCode } = res;
  const nodes = res.json();

  t.equal(statusCode, 200);
  t.equal(nodes.length, 1);
  t.equal(nodes[0].url, raw);
  t.ok(typeof nodes[0].id === 'string');
  t.end();
});

t.test('Succesfully create 2 WEB_PAGE type nodes', async (t) => {
  const articleA = 'https://example.com/article/A';
  const articleB = 'https://example.com/article/B';
  const raw = `${articleA} ${articleB}`;
  const res = await app.inject({
    method: 'POST',
    url: '/nodes',
    body: { raw },
  });
  const { statusCode } = res;
  const nodes = res.json();

  t.equal(statusCode, 200);
  t.equal(nodes.length, 2);
  t.equal(nodes[0].url, articleA);
  t.equal(nodes[1].url, articleB);
  t.end();
});
/* 
t.test('Create a NOTE type node with a WEB_PAGE inside', async (t) => {
  const site = 'https://example.com/article';
  const raw = `A great article about dogs ${site}`;
  const res = await app.inject({
    method: 'POST',
    url: '/nodes',
    body: { raw },
  });

  const { statusCode } = res;
  const nodes = res.json();
  console.log(nodes);

  t.equal(statusCode, 200);
  t.equal(nodes.length, 1);
  t.equal(nodes[0].raw, raw);
  t.equal(nodes[0].type, 'NOTE');
  t.type(nodes[0].title, 'string');
  t.equal(nodes[0].children.length, 1);
  t.equal(nodes[0].children[0].type, 'WEB_PAGE');
  t.equal(nodes[0].children[0].raw, site);
  t.type(nodes[0].children[0].title, 'string');
  t.end();
});

t.test('Create a NOTE type node with a 2x WEB_PAGE nodes inside', async (t) => {
  const articleA = 'https://example.com/article/A';
  const articleB = 'https://example.com/article/B';
  const raw = `A great article about dogs ${articleA} ${articleB}`;
  const res = await app.inject({
    method: 'POST',
    url: '/nodes',
    body: { raw },
  });

  const { statusCode } = res;
  const nodes = res.json();
  console.log(nodes);

  t.equal(statusCode, 200);
  t.equal(nodes.length, 1);
  t.equal(nodes[0].raw, raw);
  t.equal(nodes[0].type, 'NOTE');
  t.equal(nodes[0].children.length, 2);
  t.equal(nodes[0].children[0].type, 'WEB_PAGE');
  t.equal(nodes[0].children[0].raw, articleA);
  t.equal(nodes[0].children[1].type, 'WEB_PAGE');
  t.equal(nodes[0].children[1].raw, articleB);
  t.end();
});
 */
t.teardown(async () => {
  await app.close();
});
