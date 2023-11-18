import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    //await prisma.tag.createMany({ data: tags });
    //console.info(`✅ Succesfully seeded ${tags.length} tags.`);
    console.info(`✅ Succesfully seeded nothing!`);
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
