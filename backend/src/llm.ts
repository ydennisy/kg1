import OpenAI from 'openai';
import { Node } from './node';
const openai = new OpenAI();

const generateTitle = async (text: string): Promise<string> => {
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
        description:
          'Given some text content and URLs, create a short concise title.',
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
    throw new Error(
      `Failed to generate title (no function arguments) for node text: ${text}`,
    );
  }
  const title = JSON.parse(funcArgs).title;
  if (!title) {
    throw new Error(`Failed to generate title for node text: ${text}`);
  }
  return title;
};

const summariseOrAnswerFromDocuments = async (nodes: Node[], query: string) => {
  const titles = nodes.map((node) => `- ${node.toDTO().title}`).join('\n');
  const input = `
  Given the following list of documents, and query, you must
  answer the question, or summarise the docs depending on the tone.
  ----
  DOCUMENTS:
  ${titles}
  ----
  QUERY:
  ${query}
  `;
  const stream = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: input }],
    stream: true,
  });
  return stream;
};

export { generateTitle, summariseOrAnswerFromDocuments };
