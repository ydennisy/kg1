import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { Node, NodeFactory } from './node';
import { PrismaNodeRepo } from './repo';
import { parse } from './parser';
import { embed } from './embedder';
import { scrape } from './scraper';
import { generateTitle } from './augmentor';

interface GetNodeParams {
  id: number;
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

export { app };
