import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: [] });

async function main() {
  const order = await prisma.order.findFirst({
    where: { orderNumber: 'ORD-20251205-4175' },
    select: { 
      id: true, 
      orderNumber: true,
      shippingAddress: true,
      billingAddress: true
    }
  });
  
  console.log('Order:', JSON.stringify(order, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
