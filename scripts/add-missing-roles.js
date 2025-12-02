#!/usr/bin/env node
/**
 * Add Missing Role Users
 * Creates users for roles that don't exist yet:
 * - ADMIN (Organization Admin)
 * - MEMBER (Organization Member)
 * - VIEWER (Organization Viewer)
 * - DELIVERY_BOY (Store Level)
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Adding Missing Role Users...\n');

  // Find Demo Company and Demo Store
  const demoOrg = await prisma.organization.findFirst({
    where: { name: 'Demo Company' },
    include: { store: true },
  });

  if (!demoOrg) {
    console.error('❌ Demo Company not found. Run seed first.');
    return;
  }

  if (!demoOrg.store) {
    console.error('❌ Demo Store not found in Demo Company');
    return;
  }

  const storeId = demoOrg.store.id;
  const orgId = demoOrg.id;

  console.log(`✅ Found Demo Company (${orgId})`);
  console.log(`✅ Found Demo Store (${storeId})\n`);

  const usersToCreate = [
    {
      email: 'admin@example.com',
      name: 'Organization Admin',
      password: 'OrgAdmin123!@#',
      organizationRole: 'ADMIN',
      storeRole: null,
    },
    {
      email: 'member@example.com',
      name: 'Organization Member',
      password: 'OrgMember123!@#',
      organizationRole: 'MEMBER',
      storeRole: null,
    },
    {
      email: 'viewer@example.com',
      name: 'Organization Viewer',
      password: 'OrgViewer123!@#',
      organizationRole: 'VIEWER',
      storeRole: null,
    },
    {
      email: 'delivery@example.com',
      name: 'Delivery Personnel',
      password: 'Delivery123!@#',
      organizationRole: null,
      storeRole: 'DELIVERY_BOY',
    },
  ];

  for (const userData of usersToCreate) {
    try {
      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existing) {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          emailVerified: new Date(),
          passwordHash,
          isSuperAdmin: false,
        },
      });

      console.log(`✅ Created user: ${userData.email}`);

      // Add organization role if specified
      if (userData.organizationRole) {
        await prisma.membership.create({
          data: {
            userId: user.id,
            organizationId: orgId,
            role: userData.organizationRole,
          },
        });
        console.log(`   Added organization role: ${userData.organizationRole}`);
      }

      // Add store role if specified
      if (userData.storeRole) {
        await prisma.storeStaff.create({
          data: {
            userId: user.id,
            storeId: storeId,
            role: userData.storeRole,
            isActive: true,
          },
        });
        console.log(`   Added store role: ${userData.storeRole}`);
      }

      console.log('');
    } catch (error) {
      console.error(`❌ Error creating ${userData.email}:`, error.message);
    }
  }

  console.log('\n✅ All missing users added!\n');

  // Show summary
  const allUsers = await prisma.user.findMany({
    include: {
      memberships: true,
      storeStaff: true,
    },
  });

  console.log('='.repeat(70));
  console.log('CURRENT USER COUNT BY ROLE');
  console.log('='.repeat(70));

  const roleCounts = {
    SUPER_ADMIN: 0,
    OWNER: 0,
    ADMIN: 0,
    MEMBER: 0,
    VIEWER: 0,
    STORE_ADMIN: 0,
    SALES_MANAGER: 0,
    INVENTORY_MANAGER: 0,
    CUSTOMER_SERVICE: 0,
    CONTENT_MANAGER: 0,
    MARKETING_MANAGER: 0,
    DELIVERY_BOY: 0,
    CUSTOMER: 0,
  };

  allUsers.forEach(user => {
    if (user.isSuperAdmin) {
      roleCounts.SUPER_ADMIN++;
    }
    
    user.memberships.forEach(m => {
      roleCounts[m.role]++;
    });
    
    user.storeStaff.forEach(s => {
      roleCounts[s.role]++;
    });
    
    if (!user.isSuperAdmin && user.memberships.length === 0 && user.storeStaff.length === 0) {
      roleCounts.CUSTOMER++;
    }
  });

  Object.entries(roleCounts).forEach(([role, count]) => {
    const status = count > 0 ? '✅' : '❌';
    console.log(`${status} ${role.padEnd(25)} ${count}`);
  });

  console.log('');

  await prisma.$disconnect();
}

main().catch(console.error);
