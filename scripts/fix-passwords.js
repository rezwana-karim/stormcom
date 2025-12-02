#!/usr/bin/env node
/**
 * Fix Passwords for Store Staff Users
 * Updates passwords to match the documented pattern
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing Store Staff Passwords...\n');

  const usersToFix = [
    { email: 'sales@example.com', newPassword: 'SalesManager123!@#' },
    { email: 'inventory@example.com', newPassword: 'InventoryManager123!@#' },
    { email: 'support@example.com', newPassword: 'CustomerService123!@#' },
    { email: 'content@example.com', newPassword: 'ContentManager123!@#' },
    { email: 'marketing@example.com', newPassword: 'MarketingManager123!@#' },
  ];

  for (const userData of usersToFix) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (!user) {
        console.log(`⚠️  User ${userData.email} not found, skipping...`);
        continue;
      }

      const passwordHash = await bcrypt.hash(userData.newPassword, 12);

      await prisma.user.update({
        where: { email: userData.email },
        data: { passwordHash },
      });

      console.log(`✅ Updated password for: ${userData.email}`);
    } catch (error) {
      console.error(`❌ Error updating ${userData.email}:`, error.message);
    }
  }

  console.log('\n✅ All passwords updated!\n');

  await prisma.$disconnect();
}

main().catch(console.error);
