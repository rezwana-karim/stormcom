import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const stores = await prisma.store.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
    }
  });

  console.log('\n=== ALL STORES IN DATABASE ===\n');
  stores.forEach(s => {
    console.log(`Name: ${s.name}`);
    console.log(`  Slug: ${s.slug}`);
    console.log(`  ID: ${s.id}`);
    console.log('');
  });

  console.log(`Total stores: ${stores.length}`);
  
  // Also get products
  const products = await prisma.product.findMany({
    take: 10,
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      inventoryQty: true,
      store: { select: { slug: true } }
    }
  });
  
  console.log('\n=== SAMPLE PRODUCTS ===\n');
  products.forEach(p => {
    console.log(`Product: ${p.name}`);
    console.log(`  Slug: ${p.slug}`);
    console.log(`  Price: $${p.price}`);
    console.log(`  Stock: ${p.inventoryQty}`);
    console.log(`  Store: ${p.store?.slug}`);
    console.log('');
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
