import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { Node, NodeFactory } from './node';
import { PrismaNodeRepo } from './repo';
import { parse } from './parser';
import { embed } from './embedder';
import { scrape } from './scraper';
import { generateTitle } from './augmentor';
import OpenAI from 'openai';

import fs from 'fs';

const openai = new OpenAI();

interface GetNodeParams {
  id: number;
}

interface GetSearchParams {
  q: string;
}

interface PostNodeBody {
  raw: string;
}

const app = Fastify({
  logger: false,
});

const prisma = new PrismaClient();
const nodeRepo = new PrismaNodeRepo(prisma);

app.get('/health', async () => {
  return { status: 'OK' };
});

app.post<{ Body: PostNodeBody }>('/nodes', async (req, _) => {
  const { raw } = req.body;
  if (!raw && typeof raw === 'string' && raw.length > 5) {
    throw new Error('400 - Raw must be present as a string of > 5 chars.');
  }
  const parserResult = parse(raw);
  const nodes = NodeFactory.create(parserResult);

  const processNode = async (node: Node) => {
    if (node.type === 'WEB_PAGE') {
      const title = (await scrape(node.raw)).title;
      node.title = title;
    }
    if (node.type === 'NOTE' && !node.title) {
      const title = await generateTitle(node.raw);
      node.title = title;
    }
    const embedding = await embed(node.text);
    node.embedding = embedding;

    if (node.children && node.children.length > 0) {
      for (const childNode of node.children) {
        await processNode(childNode);
      }
    }
  };

  // Process each node recursively
  for (const node of nodes) {
    await processNode(node);
  }

  const persistedNodes = await nodeRepo.createMany(nodes);
  // TODO: add proper error handling
  const isNode = (value: any): value is Node => {
    return value instanceof Node;
  };
  const validNodes = persistedNodes.filter(isNode);
  return validNodes.map((node) => node.toDTO());
});

app.get<{ Params: GetNodeParams }>('/nodes/:id', async (req, res) => {
  const { id } = req.params;
  // TODO: adding fastify checks on inputs I assume
  // would convert the ID to a number.
  const node = await nodeRepo.findbyId(Number(id));
  if (!node) return res.status(404).send();
  return { ...node.toDTO() };
});

app.get('/nodes', async () => {
  const nodes = await nodeRepo.findAll();
  return nodes.map((node) => ({ ...node.toDTO() }));
});

app.get<{ Querystring: GetSearchParams }>('/search', async (req, _) => {
  const { q } = req.query;
  const queryEmbedding = await embed(q);
  const results = await nodeRepo.search(queryEmbedding);
  return results.map((node) => ({ ...node.toDTO() }));
});

app.get<{ Querystring: GetSearchParams }>('/stream', async (req, reply) => {
  try {
    const { q } = req.query;
    const stream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: q }],
      stream: true,
    });

    reply.raw.writeHead(200, { 'Content-Type': 'text/plain' });
    for await (const part of stream) {
      reply.raw.write(part.choices[0]?.delta?.content || '');
    }
    return reply.raw.end();
  } catch (err) {
    console.log(err);
    reply.raw.end('Error sending chat stream.');
  }
});

export { app };
