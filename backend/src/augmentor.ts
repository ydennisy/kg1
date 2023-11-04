import OpenAI from 'openai';

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

export { generateTitle };
