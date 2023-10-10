import OpenAI from 'openai';

const openai = new OpenAI();

const embed = async (text: string) => {
  const result = await openai.embeddings.create({
    input: text,
    model: 'text-embedding-ada-002',
  });
  return result.data[0].embedding;
};

export { embed };
