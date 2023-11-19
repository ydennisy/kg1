"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaNodeRepo = void 0;
const utils_1 = __importDefault(require("pgvector/utils"));
const node_1 = require("./node");
class PrismaNodeRepo {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(node) {
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
            return node_1.Node.create({
                ...parentResult,
                children: childResults.map((node) => node_1.Node.create(node)),
            });
        }
        catch (err) {
            console.error(err);
            throw new Error('Failed to persist node to database');
        }
    }
    async createMany(nodes) {
        const creationPromises = nodes.map((node) => this.create(node)
            .then((result) => result)
            .catch((error) => error));
        const results = await Promise.allSettled(creationPromises);
        return results.map((result) => {
            if (result.status === 'fulfilled') {
                return result.value;
            }
            else {
                return new Error(`Failed to create node: ${result.reason}`);
            }
        });
    }
    async findbyId(id) {
        const result = await this.prisma.node.findUnique({
            where: { id },
        });
        return result ? node_1.Node.create(result) : null;
    }
    async findAll() {
        const results = await this.prisma.node.findMany();
        return results.map((node) => node_1.Node.create(node));
    }
    async search(queryEmbedding) {
        const queryEmbeddingSql = utils_1.default.toSql(queryEmbedding);
        const results = await this.prisma.$queryRaw `
        SELECT id, type, title, 1 - (embedding <=> ${queryEmbeddingSql}::vector) AS similarity 
        FROM nodes 
        WHERE embedding IS NOT NULL
        ORDER BY similarity DESC LIMIT 5`;
        //@ts-ignore
        return results.map((node) => node_1.Node.create(node));
    }
    async incrementOpenAiCounter() {
        const updatedCounter = await this.prisma.counter.update({
            where: {
                id: 1,
            },
            data: { value: { increment: 1 } },
        });
        return updatedCounter.value;
    }
    async getNodesCount() {
        const count = await this.prisma.node.count();
        return count;
    }
    async setEmbedding(id, embedding) {
        if (!embedding) {
            throw new Error('When setting embedding it cannot be undefined.');
        }
        const embeddingSql = utils_1.default.toSql(embedding);
        await this.prisma
            .$executeRaw `UPDATE nodes SET embedding = ${embeddingSql}::vector WHERE id = ${id}`;
    }
}
exports.PrismaNodeRepo = PrismaNodeRepo;
