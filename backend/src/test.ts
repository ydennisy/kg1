import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();


async function main() {
  // Create the first node
  const node1 = await prisma.node.create({
    data: {
      title: 'Node 1',
    },
  })

  // Create the second node
  const node2 = await prisma.node.create({
    data: {
      title: 'Node 2',
    },
  })

  // Create edge from node1 to node2
  await prisma.edge.create({
    data: {
      parent: {
        connect: { id: node1.id },
      },
      child: {
        connect: { id: node2.id },
      },
    },
  })

  // Create the third node
  const node3 = await prisma.node.create({
    data: {
      title: 'Node 3',
    },
  })

  // Create edges from node1 and node2 to node3
  await prisma.edge.create({
    data: {
      parent: {
        connect: { id: node1.id },
      },
      child: {
        connect: { id: node3.id },
      },
    },
  })

  await prisma.edge.create({
    data: {
      parent: {
        connect: { id: node2.id },
      },
      child: {
        connect: { id: node3.id },
      },
    },
  })

  // Create a fourth node
  const node4 = await prisma.node.create({
    data: {
      title: 'Node 4',
    },
  })

  // Create edge from node3 to node4
  await prisma.edge.create({
    data: {
      parent: {
        connect: { id: node3.id },
      },
      child: {
        connect: { id: node4.id },
      },
    },
  })
}

main()
  .catch(e => {
    throw e
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


/* main()
  .catch(e => {
    throw e
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) */

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