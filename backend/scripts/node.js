"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// TODO: node has fetch in v18, but TS does not believe me!
const node_fetch_1 = __importDefault(require("node-fetch"));
const ENDPOINT = 'http://0.0.0.0:3000/nodes';
const NODES = [
    { raw: 'this is a note node' },
    { raw: 'this is a note node, with a link inside https://hackernews.com/cool-article-inside' },
    { raw: 'https://hackernews.com/cool-article' }
];
const seedNode = async ({ raw }) => {
    try {
        const response = await (0, node_fetch_1.default)(ENDPOINT, {
            method: 'POST',
            body: JSON.stringify({ raw }),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            console.error(response.status, response.statusText);
        }
        console.log(await response.json());
    }
    catch (err) {
        console.error(err);
    }
};
const getNodes = async () => {
    try {
        const response = await (0, node_fetch_1.default)(ENDPOINT, {
            method: 'GET',
        });
        if (!response.ok) {
            console.error(response.status, response.statusText);
        }
        return await response.json();
    }
    catch (err) {
        console.error(err);
    }
};
(async () => {
    console.log('Creating nodes:');
    for (const tag of NODES) {
        await seedNode(tag);
    }
    console.log();
    //const nodes = await getNodes();
    //console.log('Fetched nodes:')
    //console.log()
    //console.log(nodes)
})();
