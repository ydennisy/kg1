import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const tags = [
  {
    name: 'AI',
    description:
      'Artificial Intelligence is the simulation of human intelligence in machines that are programmed to think and learn.',
  },
  {
    name: 'ML',
    description:
      'Machine Learning is a subset of AI that involves the use of algorithms and statistical models to enable machines to improve their performance on a specific task.',
  },
  {
    name: 'maths',
    description:
      'Mathematics is the abstract science of number, quantity, and space, either as abstract concepts (pure mathematics), or as applied to other disciplines such as physics and engineering (applied mathematics).',
  },
  {
    name: 'physics',
    description:
      'Physics is the natural science that studies matter, its motion and behavior through space and time, and the related entities of energy and force.',
  },
  {
    name: 'philosophy',
    description:
      'Philosophy is the study of fundamental questions about existence, knowledge, values, reason, mind, and ethics.',
  },
];

async function main() {
  try {
    await prisma.tag.createMany({ data: tags });
    console.info(`✅ Succesfully seeded ${tags.length} tags.`);
  } catch (err) {
    console.error(`❌ Failed to seed tags.`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
