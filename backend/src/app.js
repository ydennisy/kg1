"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const fastify_1 = __importDefault(require("fastify"));
const client_1 = require("@prisma/client");
const node_1 = require("./node");
const repo_1 = require("./repo");
const parser_1 = require("./parser");
const embedder_1 = require("./embedder");
const scraper_1 = require("./scraper");
const augmentor_1 = require("./augmentor");
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default();
const app = (0, fastify_1.default)({
    logger: false,
});
exports.app = app;
const OPENAI_API_CALL_LIMIT = Number(process.env.OPENAI_API_CALL_LIMIT);
const NODE_COUNT_LIMIT = Number(process.env.NODE_COUNT_LIMIT);
const prisma = new client_1.PrismaClient();
const nodeRepo = new repo_1.PrismaNodeRepo(prisma);
app.get('/health', async () => {
    return { status: 'OK' };
});
app.post('/nodes', async (req, res) => {
    const nodesInDb = await nodeRepo.getNodesCount();
    if (nodesInDb >= NODE_COUNT_LIMIT) {
        return res.status(429).send({
            message: `The Node limit of ${NODE_COUNT_LIMIT} has been exhausted.`,
        });
    }
    const { raw } = req.body;
    if (!raw && typeof raw === 'string' && raw.length > 5) {
        throw new Error('400 - Raw must be present as a string of > 5 chars.');
    }
    const parserResult = (0, parser_1.parse)(raw);
    const nodes = node_1.NodeFactory.create(parserResult);
    const processNode = async (node) => {
        if (node.type === 'WEB_PAGE') {
            const title = (await (0, scraper_1.scrape)(node.raw)).title;
            node.title = title;
        }
        if (node.type === 'NOTE' && !node.title) {
            const title = await (0, augmentor_1.generateTitle)(node.raw);
            node.title = title;
        }
        const embedding = await (0, embedder_1.embed)(node.text);
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
    const isNode = (value) => {
        return value instanceof node_1.Node;
    };
    const validNodes = persistedNodes.filter(isNode);
    return validNodes.map((node) => node.toDTO());
});
app.get('/nodes/:id', async (req, res) => {
    const { id } = req.params;
    // TODO: adding fastify checks on inputs I assume
    // would convert the ID to a number.
    const node = await nodeRepo.findbyId(Number(id));
    if (!node)
        return res.status(404).send();
    return { ...node.toDTO() };
});
app.get('/nodes', async () => {
    const nodes = await nodeRepo.findAll();
    return nodes.map((node) => ({ ...node.toDTO() }));
});
app.get('/search', async (req, res) => {
    const counter = await nodeRepo.incrementOpenAiCounter();
    if (counter >= OPENAI_API_CALL_LIMIT) {
        return res.status(429).send({
            message: `The API call limit of ${OPENAI_API_CALL_LIMIT} has been exhausted.`,
        });
    }
    const { q } = req.query;
    const queryEmbedding = await (0, embedder_1.embed)(q);
    const results = await nodeRepo.search(queryEmbedding);
    return results.map((node) => ({ ...node.toDTO() }));
});
app.get('/chat', async (req, res) => {
    try {
        const counter = await nodeRepo.incrementOpenAiCounter();
        if (counter >= OPENAI_API_CALL_LIMIT) {
            return res.status(429).send({
                message: `The API call limit of ${OPENAI_API_CALL_LIMIT} has been exhausted.`,
            });
        }
        const { q } = req.query;
        const queryEmbedding = await (0, embedder_1.embed)(q);
        const results = await nodeRepo.search(queryEmbedding);
        const titles = results.map((node) => `- ${node.toDTO().title}`).join('\n');
        const input = `
    Given the following list of documents, and query, you must
    answer the question, or summarise the docs depending on the tone.
    ----
    DOCUMENTS:
    ${titles}
    ----
    QUERY:
    ${q}
    `;
        console.log(input);
        const stream = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: input }],
            stream: true,
        });
        res.raw.writeHead(200, { 'Content-Type': 'text/plain' });
        for await (const part of stream) {
            res.raw.write(part.choices[0]?.delta?.content || '');
        }
        return res.raw.end();
    }
    catch (err) {
        console.log(err);
        res.raw.end('Error sending chat stream.');
    }
});
