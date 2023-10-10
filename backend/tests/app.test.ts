import t from 'tap';
import { app } from '../src/app';

t.test('Check app health endpoint', async (t) => {
  const res = await app.inject({
    method: 'GET',
    url: '/health',
  });
  const { statusCode } = res;
  const status = res.json();

  t.equal(statusCode, 200);
  t.equal(status.status, 'OK');
  t.end();
});

t.test('Create a node', async (t) => {
  const res = await app.inject({
    method: 'POST',
    url: '/nodes',
    body: { raw: 'hello world!' },
  });
  const { statusCode } = res;
  const node = res.json();

  t.equal(statusCode, 200);
  t.equal(node.body, 'hello world!');
  t.end();
});

t.test('Create a node with tags', async (t) => {
  const res = await app.inject({
    method: 'POST',
    url: '/nodes',
    body: { raw: '---\n tags: AI,ML \n---\n hello world!' },
  });
  const { statusCode } = res;
  const node = res.json();
  const { tags } = node;
  const rawTags = tags.map((tag: any) => tag.name);

  t.equal(statusCode, 200);
  t.equal(node.body, 'hello world!');
  t.ok(rawTags.includes('AI'));
  t.ok(rawTags.includes('ML'));
  t.end();
});

t.test('Create a node with links', async (t) => {
  const res = await app.inject({
    method: 'POST',
    url: '/nodes',
    body: { raw: 'hello world! https://hello.world' },
  });
  const { statusCode } = res;
  const node = res.json();
  const { links } = node;
  const rawLinks = links.map((link: any) => link.raw);

  t.equal(statusCode, 200);
  t.equal(node.body, 'hello world! https://hello.world');
  t.ok(rawLinks.includes('https://hello.world'));
  t.end();
});

t.test('Fetch all nodes', async (t) => {
  const res = await app.inject({
    method: 'GET',
    url: '/nodes',
  });
  const { statusCode } = res;
  const nodes = res.json();
  const allNodesContainIds = nodes.every((node: any) => node.id !== undefined);
  const allNodesContainBodies = nodes.every(
    (node: any) => node.body !== undefined,
  );

  t.equal(statusCode, 200);
  t.ok(allNodesContainIds);
  t.ok(allNodesContainBodies);
  t.end();
});

t.test('Fetch a node by ID (1)', async (t) => {
  const res = await app.inject({
    method: 'GET',
    url: '/nodes/1',
  });
  const { statusCode } = res;
  const node = res.json();

  t.equal(statusCode, 200);
  t.equal(node.id, 1);
  t.end();
});

t.test('Fetch a node by ID (999999) a non exising node', async (t) => {
  const res = await app.inject({
    method: 'GET',
    url: '/nodes/999999',
  });
  const { statusCode } = res;

  t.equal(statusCode, 404);
  t.end();
});
