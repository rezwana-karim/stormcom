import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const stores = await prisma.store.findMany({
    select: { id: true, name: true, slug: true },
    take: 5
  });
  console.log('Stores:', JSON.stringify(stores, null, 2));
  
  // Also check products
  const products = await prisma.product.findMany({
    select: { id: true, name: true, slug: true, storeId: true, price: true },
    take: 10
  });
  console.log('Products:', JSON.stringify(products, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
