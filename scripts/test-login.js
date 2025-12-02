// Test script to check login functionality
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('🔍 Checking database for users...\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        isSuperAdmin: true,
      },
      take: 10,
    });

    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('Run: npm run seed');
      return;
    }

    console.log(`✅ Found ${users.length} users:\n`);
    
    for (const user of users) {
      const hasPassword = !!user.passwordHash;
      console.log(`📧 ${user.email}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   Password: ${hasPassword ? '✅ Set' : '❌ Not set'}`);
      console.log(`   Super Admin: ${user.isSuperAdmin ? '✅ Yes' : 'No'}`);
      
      // Test password if set
      if (hasPassword && user.email === 'test@example.com') {
        const testPassword = 'Test123!@#';
        const isValid = await bcrypt.compare(testPassword, user.passwordHash);
        console.log(`   Test Password (${testPassword}): ${isValid ? '✅ Valid' : '❌ Invalid'}`);
      }
      if (hasPassword && user.email === 'superadmin@example.com') {
        const testPassword = 'SuperAdmin123!@#';
        const isValid = await bcrypt.compare(testPassword, user.passwordHash);
        console.log(`   Test Password (${testPassword}): ${isValid ? '✅ Valid' : '❌ Invalid'}`);
      }
      if (hasPassword && user.email === 'storeadmin@example.com') {
        const testPassword = 'StoreAdmin123!@#';
        const isValid = await bcrypt.compare(testPassword, user.passwordHash);
        console.log(`   Test Password (${testPassword}): ${isValid ? '✅ Valid' : '❌ Invalid'}`);
      }
      console.log('');
    }

    // Check if NextAuth tables exist
    console.log('\n🔍 Checking NextAuth tables...');
    const accountCount = await prisma.account.count();
    const sessionCount = await prisma.session.count();
    console.log(`   Accounts: ${accountCount}`);
    console.log(`   Sessions: ${sessionCount}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'P2021') {
      console.log('\n💡 Database tables might not exist. Run: npm run prisma:migrate:dev');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
