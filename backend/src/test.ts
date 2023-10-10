import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

const getNode = async () => {
  const parent = await prisma.node.findUnique({
    where: { id: 1 },
    include: {
      nodeParents : true,
      nodeChildren : true
    }
  })
  const child = await prisma.node.findUnique({
    where: { id: 2 },
    include: {
      nodeParents : true,
      nodeChildren : true
    }
  })
  console.log(parent);
  console.log();
  console.log(child);
}

getNode()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });