type NodeType = 'WEB_PAGE' | 'NOTE' | 'PAPER';

export interface ParserResult {
  raw: string;
  title?: string;
  type: NodeType;
}

const extractLinks = (body: string): string[] => {
  const links = [];
  const urlPattern =
    /\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|]/gi;
  const matches = body.match(urlPattern);
  if (matches) links.push(...matches);
  return links;
};

const isNote = (raw: string, links: string[]): boolean => {
  let bodyWithoutLinks = raw;
  links.forEach((link) => {
    bodyWithoutLinks = bodyWithoutLinks.replace(link, '').trim();
  });
  return bodyWithoutLinks.length > 0;
};

const parse = (raw: string): ParserResult[] => {
  const nodesToCreate: ParserResult[] = [];
  const links = extractLinks(raw);
  if (isNote(raw, links)) {
    nodesToCreate.push({ type: 'NOTE', raw });
  }
  for (const link of links) {
    nodesToCreate.push({ type: 'WEB_PAGE', raw: link });
  }
  return nodesToCreate;
};

export { parse };
