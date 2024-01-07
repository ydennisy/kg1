import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { WebPage, Note } from './domain/entities';
import { PrismaRepo } from './repo';
import { parse } from './parser';
import { embed } from './embedder';
import { scrape } from './scraper';
import { generateTitle, summariseOrAnswerFromDocuments } from './llm';

/* interface GetNodeParams {
  id: number;
} */

interface GetSearchParams {
  q: string;
}

interface PostNodeBody {
  raw: string;
}

const app = Fastify({
  logger: true,
});

const OPENAI_API_CALL_LIMIT = Number(process.env.OPENAI_API_CALL_LIMIT);
const NODE_COUNT_LIMIT = Number(process.env.NODE_COUNT_LIMIT);

const prisma = new PrismaClient();
const repo = new PrismaRepo(prisma);

app.get('/health', async () => {
  return { status: 'OK' };
});

app.post<{ Body: PostNodeBody }>('/nodes', async (req, res) => {
  try {
    /*   const nodesInDb = await repo.getNodesCount();
    if (nodesInDb >= NODE_COUNT_LIMIT) {
      return res.status(429).send({
        message: `The Node limit of ${NODE_COUNT_LIMIT} has been exhausted.`,
      });
    } */

    const { raw } = req.body;
    if (!raw && typeof raw === 'string' && raw.length > 5) {
      throw new Error('400 - Raw must be present as a string of > 5 chars.');
    }
    const parsed = parse(raw);
    const created = [];
    for (const elem of parsed) {
      if (elem.type === 'WEB_PAGE') {
        const { raw: url } = elem;
        const { title, content } = await scrape(url);
        const embedding = await embed(title + ' ' + content);
        const webPage = WebPage.create({ url, title, content, embedding });
        created.push((await repo.createWebPage(webPage)).toDTO());
      } else if (elem.type === 'NOTE') {
        const { raw: content, title } = elem;
        const titleOrGeneratedTitle = title ?? (await generateTitle(content));
        const embedding = await embed(titleOrGeneratedTitle + ' ' + content);
        const note = Note.create({
          title: titleOrGeneratedTitle,
          content,
          embedding,
        });
        created.push((await repo.createNote(note)).toDTO());
      } else {
        throw new Error(`Unsupported input type: ${elem.type}`);
      }
    }
    return created;
  } catch (err) {
    app.log.error(err);
    res.status(500).send();
  }
});

app.get<{ Querystring: GetSearchParams }>('/search', async (req, res) => {
  try {
    /*     const counter = await repo.incrementOpenAiCounter();
    if (counter >= OPENAI_API_CALL_LIMIT) {
      return res.status(429).send({
        message: `The API call limit of ${OPENAI_API_CALL_LIMIT} has been exhausted.`,
      });
    } */
    const { q } = req.query;
    const queryEmbedding = await embed(q);
    const results = await repo.search(queryEmbedding);
    return results;
  } catch (err) {
    app.log.error(err);
    res.status(500).send();
  }
});

app.get<{ Querystring: GetSearchParams }>('/chat', async (req, res) => {
  try {
    const counter = await repo.incrementOpenAiCounter();
    if (counter >= OPENAI_API_CALL_LIMIT) {
      return res.status(429).send({
        message: `The API call limit of ${OPENAI_API_CALL_LIMIT} has been exhausted.`,
      });
    }
    const { q } = req.query;
    const queryEmbedding = await embed(q);
    const results = await repo.search(queryEmbedding);
    const stream = await summariseOrAnswerFromDocuments(results, q);
    res.raw.writeHead(200, { 'Content-Type': 'text/plain' });
    for await (const part of stream) {
      res.raw.write(part.choices[0]?.delta?.content || '');
    }
    return res.raw.end();
  } catch (err) {
    app.log.error(err);
    res.raw.end('Error sending chat stream.');
  }
});

export { app };
