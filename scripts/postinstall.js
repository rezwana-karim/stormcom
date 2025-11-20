#!/usr/bin/env node
// Postinstall script for Prisma Client generation (Node.js version for cross-platform)
// Determines which schema to use based on DATABASE_URL

/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
const { execSync } = require('child_process');
const path = require('path');
/* eslint-enable @typescript-eslint/no-require-imports */

console.log('🔄 Running postinstall...');

// Check if DATABASE_URL is set
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log('⚠️  DATABASE_URL not set, skipping Prisma generation');
  console.log('   Run \'npm run prisma:generate\' manually when ready');
  process.exit(0);
}

// Determine which schema to use
let schemaPath;
if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
  console.log('🐘 Using PostgreSQL schema');
  schemaPath = 'prisma/schema.postgres.prisma';
} else if (databaseUrl.startsWith('file:')) {
  console.log('🗄️  Using SQLite schema');
  schemaPath = 'prisma/schema.sqlite.prisma';
} else {
  console.log('⚠️  Unknown database, defaulting to PostgreSQL');
  schemaPath = 'prisma/schema.postgres.prisma';
}

// Generate Prisma Client
try {
  console.log(`📦 Generating Prisma Client from ${schemaPath}...`);
  execSync(`npx prisma generate --schema="${schemaPath}"`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
  console.log('✅ Prisma Client generated');
} catch {
  console.log('⚠️  Prisma generation skipped or failed');
  // Don't fail the postinstall
}

process.exit(0);
