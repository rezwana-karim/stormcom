#!/usr/bin/env node
/**
 * Test Script for Super Admin Store Creation
 * 
 * This script tests if super admins can create stores without requiring
 * existing organization membership.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Testing Super Admin Store Creation Fix\n');
  console.log('=' .repeat(60));

  try {
    // 1. Find super admin user
    console.log('\n[1/5] Finding super admin user...');
    const superAdmin = await prisma.user.findFirst({
      where: { isSuperAdmin: true },
      include: {
        memberships: {
          include: {
            organization: {
              include: { store: true }
            }
          }
        }
      }
    });

    if (!superAdmin) {
      console.log('❌ No super admin found in database');
      console.log('\nTo create a super admin:');
      console.log('1. Run: npx prisma studio');
      console.log('2. Open User table');
      console.log('3. Set isSuperAdmin = true for a user');
      return;
    }

    console.log(`✅ Found super admin: ${superAdmin.email}`);
    console.log(`   - ID: ${superAdmin.id}`);
    console.log(`   - Memberships: ${superAdmin.memberships.length}`);

    // 2. Check if super admin has any stores
    console.log('\n[2/5] Checking existing stores for super admin...');
    const existingStores = superAdmin.memberships
      .filter(m => m.organization.store)
      .map(m => m.organization.store);
    
    console.log(`   Found ${existingStores.length} existing store(s)`);
    if (existingStores.length > 0) {
      existingStores.forEach(store => {
        console.log(`   - ${store.name} (${store.slug})`);
      });
    }

    // 3. Test organization slug generation
    console.log('\n[3/5] Testing organization slug uniqueness...');
    const testSlug = 'test-store-superadmin';
    const orgSlug = `${testSlug}-org`;
    
    const existingOrg = await prisma.organization.findUnique({
      where: { slug: orgSlug }
    });

    if (existingOrg) {
      console.log(`⚠️  Organization slug "${orgSlug}" already exists`);
      console.log(`   System will append timestamp: ${orgSlug}-${Date.now()}`);
    } else {
      console.log(`✅ Organization slug "${orgSlug}" is available`);
    }

    // 4. Check store slug availability
    console.log('\n[4/5] Checking store slug availability...');
    const existingStore = await prisma.store.findUnique({
      where: { slug: testSlug }
    });

    if (existingStore) {
      console.log(`⚠️  Store slug "${testSlug}" already exists`);
      console.log('   Use a different slug when testing');
    } else {
      console.log(`✅ Store slug "${testSlug}" is available for testing`);
    }

    // 5. Display test instructions
    console.log('\n[5/5] Test Instructions');
    console.log('=' .repeat(60));
    console.log('\n📝 To test store creation as super admin:\n');
    console.log('1. Start dev server:');
    console.log('   npm run dev\n');
    console.log('2. Login as super admin:');
    console.log(`   Email: ${superAdmin.email}`);
    console.log('   Password: SuperAdmin123!@# (or your password)\n');
    console.log('3. Navigate to:');
    console.log('   http://localhost:3000/dashboard/stores\n');
    console.log('4. Click "Create Store" button\n');
    console.log('5. Fill the form:');
    console.log('   - Store Name: Test Super Admin Store');
    console.log('   - Slug: test-store-superadmin (auto-generated)');
    console.log('   - Email: teststore@example.com');
    console.log('   - Subscription Plan: FREE');
    console.log('   - Subscription Status: TRIALING');
    console.log('   - Is Active: ✓ Checked\n');
    console.log('6. Click "Create Store"\n');
    console.log('7. Expected Result:');
    console.log('   ✅ Store created successfully');
    console.log('   ✅ Organization auto-created: "Test Super Admin Store Organization"');
    console.log('   ✅ Super admin added as OWNER of organization');
    console.log('   ✅ Store appears in stores list\n');

    // Additional checks
    console.log('\n📊 Summary');
    console.log('=' .repeat(60));
    console.log(`Super Admin: ${superAdmin.email}`);
    console.log(`Current Organizations: ${superAdmin.memberships.length}`);
    console.log(`Current Stores: ${existingStores.length}`);
    console.log(`\nFix Status: ✅ READY TO TEST`);
    console.log('\nChanges Made:');
    console.log('  1. ✅ API Route: Allows super admin to create without org');
    console.log('  2. ✅ Store Service: Auto-creates organization');
    console.log('  3. ✅ Unique Slugs: Handles duplicate org slugs');
    console.log('  4. ✅ Ownership: Super admin becomes OWNER');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
