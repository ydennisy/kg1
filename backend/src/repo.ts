import pgvector from 'pgvector/utils';
import { PrismaClient } from '@prisma/client';
import { Note, WebPage } from './domain/entities';

export type SearchResultRow = {
  id: string;
  title: string;
  similarity: number;
  data: { [key: string]: string };
};

export interface Repo {
  search(embedding: number[]): Promise<SearchResultRow[]>;
  createNote(input: Note): Promise<Note>;
  createWebPage(input: WebPage): Promise<WebPage>;
  //createMany(nodes: Node[]): Promise<(Node | Error)[]>;
  //findbyId(id: number): Promise<Node | null>;
  //findAll(): Promise<Node[]>;
}

export class PrismaRepo implements Repo {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async createNote(note: Note): Promise<Note> {
    try {
      const { embedding, ...rest } = note.toPersistence();
      const result = await this.prisma.note.create({
        data: { ...rest },
      });
      await this.setEmbedding(result.id, 'notes', embedding);
      return Note.create(result);
    } catch (err) {
      console.error(err);
      throw new Error('Failed to persist Note to the database.');
    }
  }

  public async createWebPage(webPage: WebPage): Promise<WebPage> {
    try {
      const { embedding, ...rest } = webPage.toPersistence();
      const result = await this.prisma.webPage.create({
        data: { ...rest },
      });
      await this.setEmbedding(result.id, 'web_pages', embedding);
      return WebPage.create(result);
    } catch (err) {
      console.error(err);
      throw new Error('Failed to persist WebPage to the database.');
    }
  }

  public async search(queryEmbedding: number[]): Promise<SearchResultRow[]> {
    const queryEmbeddingSql = pgvector.toSql(queryEmbedding);
    return await this.prisma.$queryRaw<SearchResultRow[]>`
      SELECT * FROM (
        SELECT 
          id, 
          'web_page' as type, 
          jsonb_build_object('title', title, 'url', url) as data,
          1 - (embedding <=> ${queryEmbeddingSql}::vector) AS similarity 
        FROM web_pages 
        WHERE embedding IS NOT NULL

        UNION

        SELECT 
          id, 
          'note' as type, 
          jsonb_build_object('title', title, 'content', content) as data,
          1 - (embedding <=> ${queryEmbeddingSql}::vector) AS similarity 
        FROM notes 
        WHERE embedding IS NOT NULL

        UNION

        SELECT 
          id, 
          'paper' as type, 
          jsonb_build_object('title', title, 'content', content) as data,
          1 - (embedding <=> ${queryEmbeddingSql}::vector) AS similarity 
        FROM papers 
        WHERE embedding IS NOT NULL
      ) AS combined_results
      ORDER BY similarity DESC LIMIT 10`;
  }

  public async incrementOpenAiCounter(): Promise<number> {
    try {
      const updatedCounter = await this.prisma.counter.update({
        where: {
          id: 1,
        },
        data: { value: { increment: 1 } },
      });
      return updatedCounter.value;
    } catch (err) {
      const counter = await this.prisma.counter.create({
        data: { name: 'open-ai-api-call', value: 1 },
      });
      return counter.value;
    }
  }

  /*   public async getNodesCount(): Promise<number> {
    const count = await this.prisma.node.count();
    return count;
  } */

  private async setEmbedding(
    id: string,
    table: string,
    embedding?: number[],
  ): Promise<void> {
    // TODO: move this check higher up in the call chain.
    // Prisma forces us to even consider this to be undefined...
    if (!embedding) {
      throw new Error('When setting embedding it cannot be undefined.');
    }
    const embeddingSql = pgvector.toSql(embedding);
    // TODO: check table is one of allowed tables.
    const query = `UPDATE ${table} SET embedding = $1::vector WHERE id = $2`;
    await this.prisma.$executeRawUnsafe(query, embeddingSql, id);
  }
}
