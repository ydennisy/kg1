// TODO: node has fetch in v18, but TS does not believe me!
import fetch from 'node-fetch';

const ENDPOINT = 'http://0.0.0.0:3000/nodes';
const NODES: Node[] = [
  { raw: 'this is a note node' },
  { raw: 'this is a note node, with a link inside https://hackernews.com/cool-article-inside' },
  { raw: 'https://hackernews.com/cool-article' }
];

interface Node {
  raw: string;
}

const seedNode = async ({ raw }: Node) => {
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({ raw }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      console.error(response.status, response.statusText);
    }
    console.log(await response.json());
  } catch (err) {
    console.error(err);
  }
};

const getNodes = async () => {
  try {
    const response = await fetch(ENDPOINT, {
      method: 'GET',
    });
    if (!response.ok) {
      console.error(response.status, response.statusText);
    }
    return await response.json();
  } catch (err) {
    console.error(err);
  }
}

(async () => {
  console.log('Creating nodes:')
  for (const tag of NODES) {
    await seedNode(tag);
  }
  console.log()
  //const nodes = await getNodes();
  //console.log('Fetched nodes:')
  //console.log()
  //console.log(nodes)
})();
