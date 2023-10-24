import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { Node } from './node';
import { PrismaNodeRepo } from './repo';
import { parse } from './parser';
import { embed } from './embedder';

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
  const { title, body, links } = parse(raw);
  let node;
  if (links.length === 1 && body === links[0]) {
    node = Node.create({ raw, title, type: 'WEB_PAGE' });
  } else if (body) {
    node = Node.create({ raw, title, links, type: 'NOTE' });
  } else {
    throw new Error('Node format not supported.');
  }
  //const embedding = await embed(parsed.raw);
  //const node = Node.create({ raw, title: null, type: 'NOTE' });
  const persistedNode = await nodeRepo.create(node);
  return { ...persistedNode.toDTO() };
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
