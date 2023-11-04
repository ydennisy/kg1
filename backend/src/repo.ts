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
      await this.updateEmbedding(parentResult.id, node.embedding);
      const childResults = [];
      if (children) {
        for (const child of children) {
          const { children: _, ...rest } = child.toPersistence();
          const childResult = await this.prisma.node.create({
            data: { ...rest },
          });
          await this.updateEmbedding(childResult.id, child.embedding);
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
    const result = await this.prisma.node.findMany();
    return result.map((node) => Node.create(node));
  }

  private async updateEmbedding(
    id: number,
    embedding: number[],
  ): Promise<void> {
    const embeddingSql = pgvector.toSql(embedding);
    await this.prisma
      .$executeRaw`UPDATE nodes SET embedding = ${embeddingSql}::vector WHERE id = ${id}`;
  }
}
