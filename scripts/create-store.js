const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // First, create an organization
    const org = await prisma.organization.upsert({
      where: { slug: 'demo-org' },
      update: {},
      create: {
        name: 'Demo Organization',
        slug: 'demo-org',
      },
    });
    
    console.log('Organization ready:', org);
    
    // Then create the store
    const store = await prisma.store.upsert({
      where: { slug: 'demo-store' },
      update: {},
      create: {
        id: 'store-1',
        name: 'Demo Store',
        slug: 'demo-store',
        email: 'demo@example.com',
        organizationId: org.id,
      },
    });
    
    console.log('Store created successfully:', store);
  } catch (error) {
    console.error('Error creating store:', error.message);
    console.error(error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
