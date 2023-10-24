import t from 'tap';
import { app } from '../src/app';

t.test('Create a node', async (t) => {
  const res = await app.inject({
    method: 'POST',
    url: '/nodes',
    body: { raw: 'hello world!' }, 
  });

  const { statusCode } = res;
  const node = res.json();

  t.equal(statusCode, 200);
  t.equal(node.body, 'hello world11');
  t.end();
});