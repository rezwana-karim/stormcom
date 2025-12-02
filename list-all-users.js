const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      isSuperAdmin: true,
      passwordHash: true,
      accountStatus: true,
    }
  });

  console.log('\n=== ALL USERS IN DATABASE ===\n');
  users.forEach(u => {
    console.log(`Email: ${u.email}`);
    console.log(`  Name: ${u.name}`);
    console.log(`  isSuperAdmin: ${u.isSuperAdmin}`);
    console.log(`  hasPassword: ${!!u.passwordHash}`);
    console.log(`  accountStatus: ${u.accountStatus}`);
    console.log('');
  });

  console.log(`Total users: ${users.length}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
