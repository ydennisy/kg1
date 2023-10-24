import { PrismaClient } from '@prisma/client';
import pgvector from 'pgvector/utils';
import { Node } from './node';

export interface NodeRepo {
  create(node: Node): Promise<Node>;
  find(id: number): Promise<Node | null>;
  findAll(): Promise<Node[]>;
}

export class PrismaNodeRepo implements NodeRepo {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async create(node: Node): Promise<Node> {
    try {
      const { tags, links, embedding, ...rest } = node.toPersistence();
      const foundTags = tags ? await this.findManyTagsByName(tags) : [];
      const foundOrCreatedLinks = links
        ? await this.findOrCreateManyLinksByRaw(links)
        : [];

      const result = await this.prisma.node.create({
        data: {
          ...rest,
          tags: { connect: foundTags.map(({ id }) => ({ id })) },
          links: { connect: foundOrCreatedLinks.map(({ id }) => ({ id })) },
        },
        include: { tags: true, links: true },
      });

      // TODO: I am not a fan of this - but it works for now.
      // We need to insert the whole object as a single transaction.
      if (embedding) {
        const embeddingSql = pgvector.toSql(embedding);
        await this.prisma
          .$executeRaw`UPDATE nodes SET embedding = ${embeddingSql}::vector WHERE id = ${result.id}`;
      }

      return Node.create({ ...result, embedding });
    } catch (err) {
      console.error(err);
      throw new Error('Failed to persist node to database');
    }
  }

  public async find(id: number): Promise<Node | null> {
    const result = await this.prisma.node.findUnique({
      where: { id },
      include: { tags: true },
    });

    return result ? Node.create(result) : null;
  }

  public async findAll(): Promise<Node[]> {
    const result = await this.prisma.node.findMany();
    return result.map((node) => Node.create(node));
  }

  private async findManyTagsByName(tags: string[]) {
    const foundTags = await this.prisma.tag.findMany({
      where: { name: { in: tags } },
    });
    return foundTags;
  }

  private async findOrCreateManyLinksByRaw(links: string[]) {
    const foundLinks = await this.prisma.link.findMany({
      where: { raw: { in: links } },
    });
    const foundRawValues = foundLinks.map((link) => link.raw);
    const toCreate = links.filter((link) => !foundRawValues.includes(link));

    // NOTE: we cannot use `createMany` as it does not return the created values.
    // it is probably possible to use connectOrCreate to avoid this loop.
    // https://github.com/prisma/prisma/issues/8131
    const createdLinks = [];
    for (const raw of toCreate) {
      const createdLink = await this.prisma.link.create({
        data: { raw, title: '', cleaned: '' },
      });
      createdLinks.push(createdLink);
    }

    return [...foundLinks, ...createdLinks];
  }
}
