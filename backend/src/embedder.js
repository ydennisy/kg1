"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.embed = void 0;
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default();
const embed = async (text) => {
    const result = await openai.embeddings.create({
        input: text,
        model: 'text-embedding-ada-002',
    });
    return result.data[0].embedding;
};
exports.embed = embed;
