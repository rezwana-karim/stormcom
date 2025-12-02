#!/usr/bin/env node
/**
 * Check All Users and Their Roles
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('='.repeat(70));
  console.log('ALL USERS AND THEIR ROLES');
  console.log('='.repeat(70));

  const users = await prisma.user.findMany({
    include: {
      memberships: {
        include: {
          organization: true,
        },
      },
      storeStaff: {
        include: {
          store: true,
        },
      },
    },
    orderBy: {
      email: 'asc',
    },
  });

  console.log(`\nTotal Users: ${users.length}\n`);

  users.forEach((user, index) => {
    console.log(`[${index + 1}] ${user.email}`);
    console.log(`    ID: ${user.id}`);
    console.log(`    Name: ${user.name || 'N/A'}`);
    console.log(`    Super Admin: ${user.isSuperAdmin ? 'YES' : 'NO'}`);
    console.log(`    Password Set: ${user.passwordHash ? 'YES' : 'NO'}`);
    
    if (user.memberships.length > 0) {
      console.log(`    Organization Roles:`);
      user.memberships.forEach(m => {
        console.log(`      - ${m.role} in ${m.organization.name}`);
      });
    } else {
      console.log(`    Organization Roles: None`);
    }
    
    if (user.storeStaff.length > 0) {
      console.log(`    Store Roles:`);
      user.storeStaff.forEach(s => {
        console.log(`      - ${s.role} in ${s.store.name}`);
      });
    } else {
      console.log(`    Store Roles: None`);
    }
    
    console.log('');
  });

  // Count by role type
  const superAdmins = users.filter(u => u.isSuperAdmin).length;
  const withOrgRole = users.filter(u => u.memberships.length > 0).length;
  const withStoreRole = users.filter(u => u.storeStaff.length > 0).length;
  const customers = users.filter(u => !u.isSuperAdmin && u.memberships.length === 0 && u.storeStaff.length === 0).length;

  console.log('='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log(`Super Admins: ${superAdmins}`);
  console.log(`Users with Organization Roles: ${withOrgRole}`);
  console.log(`Users with Store Roles: ${withStoreRole}`);
  console.log(`Customers (no roles): ${customers}`);
  console.log('');

  await prisma.$disconnect();
}

main().catch(console.error);
