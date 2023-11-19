"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tap_1 = __importDefault(require("tap"));
const scraper_1 = require("../src/scraper");
tap_1.default.test('scrapes a site and fetches title', async (t) => {
    const URL = 'https://apify.com';
    const scraped = await (0, scraper_1.scrape)(URL);
    t.equal(scraped.title, 'Apify: Full-stack web scraping and data extraction platform');
    t.end();
});
