// TODO: node has fetch in v18, but TS does not believe me!
import fetch from 'node-fetch';

const ENDPOINT = 'http://0.0.0.0:3000/tags';
const TAGS: Tag[] = [{ name: 'math', description: '...' }];

interface Tag {
  name: string;
  description: string;
}

const seedTag = async ({ name, description }: Tag) => {
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({ name, description }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      console.error(
        `Failed to seed tag (${name}) -> ${response.status} ${response.statusText}`,
      );
    }
  } catch (err) {
    console.error(`Failed to seed tag (${name}) -> ${err}`);
  }
};

(async () => {
  for (const tag of TAGS) {
    await seedTag(tag);
  }
})();
