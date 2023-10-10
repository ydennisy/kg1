interface ParserResult {
  raw: string;
  title: string | null;
  body: string | null;
  tags: string[];
  links: string[];
}

// Function to extract YAML front matter
const extractFrontMatter = (
  raw: string,
): { frontMatter: string; bodyStartIndex: number } => {
  const pattern = /---(.*?)---/gs;
  const matches = raw.match(pattern);
  let bodyStartIndex = 0;
  let frontMatter = '';

  if (matches) {
    const match = matches[0];
    bodyStartIndex = raw.indexOf(match) + match.length;
    frontMatter = match.replace(/---/g, '').trim();
  }
  return { frontMatter, bodyStartIndex };
};

// Function to parse YAML front matter
const parseFrontMatter = (
  frontMatter: string,
): { title: string | null; tags: string[] } => {
  let title = null;
  let tags: string[] = [];

  if (frontMatter !== '') {
    const items = frontMatter.split('\n');
    items.forEach((item) => {
      if (item.startsWith('title:')) title = item.replace('title:', '').trim();
      if (item.startsWith('tags:'))
        tags = item
          .replace('tags:', '')
          .split(',')
          .map((t) => t.trim());
    });
  }
  return { title, tags };
};

const extractLinks = (body: string): string[] => {
  const links = [];
  const urlPattern =
    /\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|]/gi;
  const matches = body.match(urlPattern);
  if (matches) links.push(...matches);
  return links;
};

// Main parse function
const parse = (raw: string): ParserResult => {
  const result: ParserResult = {
    raw,
    title: null,
    body: null,
    tags: [],
    links: [],
  };

  const { frontMatter, bodyStartIndex } = extractFrontMatter(raw);
  const { title, tags } = parseFrontMatter(frontMatter);

  result.title = title;
  result.tags = tags;
  result.body = raw.substring(bodyStartIndex).trim();
  result.links = extractLinks(result.body);

  return result;
};

export { parse };
