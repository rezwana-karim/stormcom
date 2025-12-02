const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'susmoy4061@gmail.com' },
    include: {
      memberships: { include: { organization: true } },
      storeStaff: { include: { store: true } },
      storeRequests: true
    }
  });
  
  if (!user) {
    console.log('User not found');
    return;
  }
  
  console.log('User:', user.name, '- Email:', user.email);
  console.log('Account Status:', user.accountStatus);
  console.log('Is Super Admin:', user.isSuperAdmin);
  console.log('\nMemberships:', user.memberships.length);
  user.memberships.forEach(m => {
    console.log('  - Org:', m.organization?.name, '| Role:', m.role);
  });
  console.log('\nStore Staff:', user.storeStaff.length);
  user.storeStaff.forEach(s => {
    console.log('  - Store:', s.store?.name, '| Role:', s.role, '| Active:', s.isActive);
  });
  console.log('\nStore Requests:', user.storeRequests.length);
  user.storeRequests.forEach(sr => {
    console.log('  - Store:', sr.storeName, '| Status:', sr.status);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
