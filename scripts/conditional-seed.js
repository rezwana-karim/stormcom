#!/usr/bin/env node
/**
 * Conditional Production Database Seeding Script
 * 
 * This script runs production database seeding ONLY if the SEED_DATABASE
 * environment variable is explicitly set to "true".
 * 
 * This provides a safety mechanism to prevent accidental data loss in production.
 * 
 * Usage in Vercel:
 *   1. Set SEED_DATABASE=true in Vercel environment variables (only when needed)
 *   2. Deploy or redeploy
 *   3. Remove or set SEED_DATABASE=false after seeding is complete
 * 
 * Usage locally:
 *   SEED_DATABASE=true node scripts/conditional-seed.js
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 Checking if database seeding is requested...');

// Check if seeding is explicitly requested
const shouldSeed = process.env.SEED_DATABASE === 'true';

if (!shouldSeed) {
  console.log('ℹ️  Database seeding skipped (SEED_DATABASE not set to "true")');
  console.log('   To enable seeding, set environment variable: SEED_DATABASE=true');
  console.log('   ⚠️  WARNING: Seeding will DELETE ALL EXISTING DATA');
  console.log('ℹ️  Build will continue without seeding.');
  process.exit(0);
}

// Check if DATABASE_URL is set
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Verify it's a PostgreSQL connection
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ Error: DATABASE_URL must be a PostgreSQL connection string');
  process.exit(1);
}

console.log('⚠️  SEED_DATABASE=true detected');
console.log('⚠️  Database seeding will proceed and DELETE ALL EXISTING DATA');
console.log('   Database:', databaseUrl.substring(0, 30) + '...');

try {
  console.log('\n🌱 Running production seeding with --force flag...');
  
  execSync('node scripts/seed-production.js --force', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: process.env,
  });

  console.log('\n✅ Conditional seeding completed successfully!');
  console.log('\n💡 Remember to:');
  console.log('   1. Remove or set SEED_DATABASE=false in Vercel environment variables');
  console.log('   2. This prevents accidental seeding on future deployments');
  
} catch (error) {
  console.error('\n❌ Seeding failed:', error.message);
  process.exit(1);
}
