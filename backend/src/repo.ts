import { PrismaClient } from '@prisma/client';
import pgvector from 'pgvector/utils';
import { Node } from './node';

export interface NodeRepo {
  create(node: Node): Promise<Node>;
  createMany(nodes: Node[]): Promise<(Node | Error)[]>;
  findbyId(id: number): Promise<Node | null>;
  findAll(): Promise<Node[]>;
}

export class PrismaNodeRepo implements NodeRepo {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async create(node: Node): Promise<Node> {
    try {
      const { children, ...rest } = node.toPersistence();
      const parentResult = await this.prisma.node.create({ data: { ...rest } });
      await this.setEmbedding(parentResult.id, node.embedding);
      const childResults = [];
      if (children) {
        for (const child of children) {
          const { children: _, ...rest } = child.toPersistence();
          const childResult = await this.prisma.node.create({
            data: { ...rest },
          });
          await this.setEmbedding(childResult.id, child.embedding);
          childResults.push(childResult);
          await this.prisma.edge.create({
            data: {
              parent: {
                connect: {
                  id: parentResult.id,
                },
              },
              child: {
                connect: {
                  id: childResult.id,
                },
              },
            },
          });
        }
      }

      return Node.create({
        ...parentResult,
        children: childResults.map((node) => Node.create(node)),
      });
    } catch (err) {
      console.error(err);
      throw new Error('Failed to persist node to database');
    }
  }

  public async createMany(nodes: Node[]): Promise<(Node | Error)[]> {
    const creationPromises = nodes.map((node) =>
      this.create(node)
        .then((result) => result)
        .catch((error) => error),
    );

    const results = await Promise.allSettled(creationPromises);

    return results.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return new Error(`Failed to create node: ${result.reason}`);
      }
    });
  }

  public async findbyId(id: number): Promise<Node | null> {
    const result = await this.prisma.node.findUnique({
      where: { id },
    });

    return result ? Node.create(result) : null;
  }

  public async findAll(): Promise<Node[]> {
    const results = await this.prisma.node.findMany();
    return results.map((node) => Node.create(node));
  }

  public async search(queryEmbedding: number[]): Promise<Node[]> {
    const queryEmbeddingSql = pgvector.toSql(queryEmbedding);
    const results = await this.prisma.$queryRaw`
        SELECT id, type, title, 1 - (embedding <=> ${queryEmbeddingSql}::vector) AS similarity 
        FROM nodes 
        WHERE embedding IS NOT NULL
        ORDER BY similarity DESC LIMIT 5`;
    //@ts-ignore
    return results.map((node) => Node.create(node));
  }

  public async incrementOpenAiCounter(): Promise<number> {
    const updatedCounter = await this.prisma.counter.update({
      where: {
        id: 1,
      },
      data: { value: { increment: 1 } },
    });
    return updatedCounter.value;
  }

  public async getNodesCount(): Promise<number> {
    const count = await this.prisma.node.count();
    return count;
  }

  private async setEmbedding(id: number, embedding: number[]): Promise<void> {
    if (!embedding) {
      throw new Error('When setting embedding it cannot be undefined.');
    }
    const embeddingSql = pgvector.toSql(embedding);
    await this.prisma
      .$executeRaw`UPDATE nodes SET embedding = ${embeddingSql}::vector WHERE id = ${id}`;
  }
}
