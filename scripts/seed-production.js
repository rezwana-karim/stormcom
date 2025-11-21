#!/usr/bin/env node
/**
 * Production Database Seeding Script
 * 
 * This script seeds the PostgreSQL production database with initial data.
 * It uses the PostgreSQL schema and is safe to run on production.
 * 
 * IMPORTANT: This will DELETE ALL EXISTING DATA before seeding.
 * Use with caution on production databases.
 * 
 * Usage: 
 *   node scripts/seed-production.js
 * 
 * Or with environment variables:
 *   DATABASE_URL="your-postgres-url" node scripts/seed-production.js
 */

const { execSync } = require('child_process');
const path = require('path');
const readline = require('readline');

console.log('🌱 Production Database Seeding Script');
console.log('=====================================\n');

// Check if DATABASE_URL is set
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL environment variable is not set');
  console.error('   Set it with your PostgreSQL connection string:');
  console.error('   export DATABASE_URL="******host:5432/database?sslmode=require"');
  process.exit(1);
}

// Verify it's a PostgreSQL connection
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ Error: DATABASE_URL must be a PostgreSQL connection string');
  console.error('   Current value starts with:', databaseUrl.substring(0, 20));
  process.exit(1);
}

console.log('✅ PostgreSQL DATABASE_URL detected');
console.log('   Connection:', databaseUrl.substring(0, 30) + '...\n');

// Function to prompt for confirmation
function promptConfirmation() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('⚠️  WARNING: This will DELETE ALL EXISTING DATA in the database!');
    console.log('   This includes:');
    console.log('   - All users and accounts');
    console.log('   - All organizations and memberships');
    console.log('   - All projects and project members');
    console.log('   - All e-commerce data (stores, products, orders, etc.)');
    console.log('');
    
    rl.question('Are you sure you want to continue? (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function main() {
  // Check if running in CI or with --force flag
  const forceMode = process.argv.includes('--force') || process.env.CI === 'true';
  
  if (!forceMode) {
    const confirmed = await promptConfirmation();
    if (!confirmed) {
      console.log('\n❌ Seeding cancelled by user');
      process.exit(0);
    }
  }

  console.log('\n🚀 Starting production database seeding...\n');

  try {
    // Step 1: Ensure Prisma Client is generated for PostgreSQL
    console.log('📦 Step 1: Generating Prisma Client for PostgreSQL...');
    execSync('npx prisma generate --schema=prisma/schema.postgres.prisma', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
    console.log('✅ Prisma Client generated\n');

    // Step 2: Run the seed script
    console.log('🌱 Step 2: Running seed script...');
    console.log('   This will populate the database with demo data\n');
    
    execSync('node prisma/seed.mjs', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
      },
    });

    console.log('\n✅ Production database seeded successfully!');
    console.log('\n📋 Demo Account Created:');
    console.log('   Email: test@example.com');
    console.log('   Password: Test123!@#');
    console.log('   Organization: Demo Company (slug: demo-company)');
    console.log('\n🎉 You can now log in and explore the application!');
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Verify DATABASE_URL is correct and database is accessible');
    console.error('2. Ensure the database schema is up to date (run migrations first)');
    console.error('3. Check that the database user has proper permissions');
    console.error('4. Review the error message above for specific issues');
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
