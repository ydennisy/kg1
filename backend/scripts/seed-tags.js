"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// TODO: node has fetch in v18, but TS does not believe me!
const node_fetch_1 = __importDefault(require("node-fetch"));
const ENDPOINT = 'http://0.0.0.0:3000/tags';
const TAGS = [{ name: 'math', description: '...' }];
const seedTag = async ({ name, description }) => {
    try {
        const response = await (0, node_fetch_1.default)(ENDPOINT, {
            method: 'POST',
            body: JSON.stringify({ name, description }),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            console.error(`Failed to seed tag (${name}) -> ${response.status} ${response.statusText}`);
        }
    }
    catch (err) {
        console.error(`Failed to seed tag (${name}) -> ${err}`);
    }
};
(async () => {
    for (const tag of TAGS) {
        await seedTag(tag);
    }
})();
