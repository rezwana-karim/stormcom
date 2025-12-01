const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUser() {
  const email = 'susmoy4061@gmail.com';
  
  const user = await prisma.user.findUnique({
    where: { email },
    include: { memberships: true, storeStaff: true }
  });
  
  if (!user) {
    console.log('User not found');
    return;
  }
  
  console.log('Found user:', user.name, user.email);
  
  // Check if user already has memberships
  if (user.memberships.length > 0 || user.storeStaff.length > 0) {
    console.log('User already has roles assigned');
    return;
  }
  
  // Create organization for this user
  const orgSlug = `susmoy-org-${Date.now()}`;
  const organization = await prisma.organization.create({
    data: {
      name: `${user.name || 'Susmoy'}'s Organization`,
      slug: orgSlug,
    }
  });
  console.log('Created organization:', organization.name);
  
  // Create OWNER membership
  const membership = await prisma.membership.create({
    data: {
      userId: user.id,
      organizationId: organization.id,
      role: 'OWNER',
    }
  });
  console.log('Created OWNER membership');
  
  // Create store for this organization
  const storeSlug = `susmoy-store-${Date.now()}`;
  const store = await prisma.store.create({
    data: {
      organizationId: organization.id,
      name: `${user.name || 'Susmoy'}'s Store`,
      slug: storeSlug,
      email: email,
      currency: 'USD',
      timezone: 'UTC',
      locale: 'en',
      subscriptionPlan: 'FREE',
      subscriptionStatus: 'ACTIVE',
    }
  });
  console.log('Created store:', store.name);
  
  // Create STORE_ADMIN staff role
  const storeStaff = await prisma.storeStaff.create({
    data: {
      userId: user.id,
      storeId: store.id,
      role: 'STORE_ADMIN',
      isActive: true,
    }
  });
  console.log('Created STORE_ADMIN role');
  
  console.log('\n✅ User setup complete! They now have:');
  console.log('  - OWNER role in organization:', organization.name);
  console.log('  - STORE_ADMIN role in store:', store.name);
  console.log('\nPlease log out and log back in to refresh the session.');
}

fixUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
