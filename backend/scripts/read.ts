const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();


const getNode = async () => {

  const node1 = await prisma.node.findUnique({
    where: { id: 1 },
    include: {
      nodeParents : { include: { parent: true }},
      nodeChildren : { include: { child: true }}
    }
  })

  const node2 = await prisma.node.findUnique({
    where: { id: 2 },
    include: {
      nodeParents : true,
      nodeChildren : true
    }
  })
  const node3 = await prisma.node.findUnique({
    where: { id: 3 },
    include: {
      nodeParents : true,
      nodeChildren : true
    }
  })

  const node4 = await prisma.node.findUnique({
    where: { id: 4 },
    include: {
      nodeParents : true,
      nodeChildren : true
    }
  })
  console.log(node1);
  console.log();
  console.log(node2);
  console.log();
  console.log(node3);
  console.log();
  console.log(node4);
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