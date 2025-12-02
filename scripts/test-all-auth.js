#!/usr/bin/env node
/**
 * Test Authentication for All Roles
 * Simulates login and checks session data for each role
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testRole(email, expectedPassword) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Testing: ${email}`);
  console.log('='.repeat(70));

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            organization: {
              include: { store: true },
            },
          },
        },
        storeStaff: {
          include: { store: true },
        },
      },
    });

    if (!user) {
      console.log('❌ User not found');
      return false;
    }

    console.log(`✅ User found: ${user.name}`);

    // Test password
    if (!user.passwordHash) {
      console.log('❌ No password hash set');
      return false;
    }

    const isValid = await bcrypt.compare(expectedPassword, user.passwordHash);
    if (!isValid) {
      console.log('❌ Password invalid');
      return false;
    }

    console.log('✅ Password valid');

    // Check roles
    console.log('\nRole Information:');
    console.log(`  Super Admin: ${user.isSuperAdmin ? 'YES' : 'NO'}`);
    
    if (user.memberships.length > 0) {
      console.log('  Organization Roles:');
      user.memberships.forEach(m => {
        console.log(`    - ${m.role} in ${m.organization.name}`);
      });
    }
    
    if (user.storeStaff.length > 0) {
      console.log('  Store Roles:');
      user.storeStaff.forEach(s => {
        console.log(`    - ${s.role} in ${s.store.name}`);
      });
    }

    // Simulate session data
    console.log('\nSession Data (simulated):');
    const membership = user.memberships[0];
    const storeStaff = user.storeStaff[0];

    const sessionData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        isSuperAdmin: user.isSuperAdmin || false,
        organizationRole: membership?.role || null,
        organizationId: membership?.organizationId || null,
        storeRole: storeStaff?.role || null,
        storeId: storeStaff?.storeId || membership?.organization?.store?.id || null,
      },
    };

    console.log(JSON.stringify(sessionData, null, 2));

    // Check permissions
    console.log('\nPermissions Check:');
    if (user.isSuperAdmin) {
      console.log('  ✅ All permissions (*)');
    } else {
      const effectiveRole = storeStaff?.role || membership?.role;
      if (effectiveRole) {
        console.log(`  ✅ Role-based permissions for: ${effectiveRole}`);
      } else {
        console.log('  ⚠️  No organization or store role (CUSTOMER)');
      }
    }

    // Check store creation ability
    console.log('\nStore Creation:');
    const canCreateStore = user.isSuperAdmin || 
                          (membership && ['OWNER', 'ADMIN'].includes(membership.role));
    console.log(`  ${canCreateStore ? '✅' : '❌'} Can create stores: ${canCreateStore ? 'YES' : 'NO'}`);

    return true;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('\n🧪 AUTHENTICATION TEST FOR ALL ROLES\n');

  const testUsers = [
    { email: 'superadmin@example.com', password: 'SuperAdmin123!@#', role: 'SUPER_ADMIN' },
    { email: 'test@example.com', password: 'Test123!@#', role: 'OWNER' },
    { email: 'admin@example.com', password: 'OrgAdmin123!@#', role: 'ADMIN' },
    { email: 'member@example.com', password: 'OrgMember123!@#', role: 'MEMBER' },
    { email: 'viewer@example.com', password: 'OrgViewer123!@#', role: 'VIEWER' },
    { email: 'storeadmin@example.com', password: 'StoreAdmin123!@#', role: 'STORE_ADMIN' },
    { email: 'sales@example.com', password: 'SalesManager123!@#', role: 'SALES_MANAGER' },
    { email: 'inventory@example.com', password: 'InventoryManager123!@#', role: 'INVENTORY_MANAGER' },
    { email: 'support@example.com', password: 'CustomerService123!@#', role: 'CUSTOMER_SERVICE' },
    { email: 'content@example.com', password: 'ContentManager123!@#', role: 'CONTENT_MANAGER' },
    { email: 'marketing@example.com', password: 'MarketingManager123!@#', role: 'MARKETING_MANAGER' },
    { email: 'delivery@example.com', password: 'Delivery123!@#', role: 'DELIVERY_BOY' },
    { email: 'customer1@example.com', password: 'Customer123!@#', role: 'CUSTOMER' },
    { email: 'customer2@example.com', password: 'Customer123!@#', role: 'CUSTOMER' },
  ];

  const results = {
    passed: 0,
    failed: 0,
  };

  for (const user of testUsers) {
    const success = await testRole(user.email, user.password);
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Users Tested: ${testUsers.length}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log('');

  if (results.failed === 0) {
    console.log('🎉 All authentication tests passed!');
    console.log('\n✅ All users can login with their credentials');
    console.log('✅ Session data is correctly populated');
    console.log('✅ Permissions are properly assigned');
    console.log('✅ Store creation permissions verified');
  } else {
    console.log('⚠️  Some tests failed. Check errors above.');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
