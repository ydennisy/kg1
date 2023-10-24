const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Create two notes
  const note1 = await prisma.node.create({
    data: {
      title: 'Note 1',
      type: 'NOTE',
      note: {
        create: {
          title: 'Note 1',
          raw: 'Raw content of Note 1',
          body: 'Body of Note 1',
        },
      },
    },
  });

  const note2 = await prisma.node.create({
    data: {
      title: 'Note 2',
      type: 'NOTE',
      note: {
        create: {
          title: 'Note 2',
          raw: 'Raw content of Note 2',
          body: 'Body of Note 2',
        },
      },
    },
  });

  // Create two web pages
  const webPage1 = await prisma.node.create({
    data: {
      title: 'Web Page 1',
      type: 'WEB_PAGE',
      webPage: {
        create: {
          url: 'https://example.com/page1',
          title: 'Web Page 1',
        },
      },
    },
  });

  const webPage2 = await prisma.node.create({
    data: {
      title: 'Web Page 2',
      type: 'WEB_PAGE',
      webPage: {
        create: {
          url: 'https://example.com/page2',
          title: 'Web Page 2',
        },
      },
    },
  });

  // Connect notes to web pages via edges
  await prisma.edge.create({
    data: {
      parent: {
        connect: {
          id: note1.id,
        },
      },
      child: {
        connect: {
          id: webPage1.id,
        },
      },
    },
  });

  await prisma.edge.create({
    data: {
      parent: {
        connect: {
          id: note2.id,
        },
      },
      child: {
        connect: {
          id: webPage2.id,
        },
      },
    },
  });
}

main()
  .catch(e => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
