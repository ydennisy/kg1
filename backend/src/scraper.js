"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrape = void 0;
const entities_1 = require("entities");
const got_scraping_1 = require("got-scraping");
const node_html_parser_1 = require("node-html-parser");
// NOTE: need some time to decide on a good node lib for parsing
// html and extracting just the text, tags, links etc.
const scrape = async (url) => {
    const { body } = await got_scraping_1.gotScraping.get(url);
    const root = (0, node_html_parser_1.parse)(body);
    const title = root.getElementsByTagName('title')[0].innerText;
    if (!title) {
        throw new Error(`Failed to scrape and get title from: ${url}`);
    }
    return { title: (0, entities_1.decodeHTML)(title) };
};
exports.scrape = scrape;
