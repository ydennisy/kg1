"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTitle = void 0;
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default();
const generateTitle = async (text) => {
    const result = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
            {
                role: 'user',
                content: `Given the following content, which may have both text and web page URLs, please provide a concise and descriptive title: /n ${text}`,
            },
        ],
        functions: [
            {
                name: 'generateContentTitle',
                description: 'Given some text content and URLs, create a short concise title.',
                parameters: {
                    type: 'object',
                    properties: {
                        title: {
                            type: 'string',
                            description: 'The title of the content.',
                        },
                    },
                    required: ['title'],
                },
            },
        ],
        function_call: { name: 'generateContentTitle' },
    });
    const funcArgs = result.choices[0].message.function_call?.arguments;
    if (!funcArgs) {
        throw new Error(`Failed to generate title (no function arguments) for node text: ${text}`);
    }
    const title = JSON.parse(funcArgs).title;
    if (!title) {
        throw new Error(`Failed to generate title for node text: ${text}`);
    }
    return title;
};
exports.generateTitle = generateTitle;
