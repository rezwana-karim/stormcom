const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const stores = await prisma.store.findMany({
      select: {
        id: true,
        slug: true,
        subdomain: true,
        customDomain: true,
        name: true
      }
    });
    console.log(JSON.stringify(stores, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
