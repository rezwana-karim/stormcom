#!/usr/bin/env node
// Build script for Next.js with dynamic Prisma schema selection (Node.js version)
// This script determines which Prisma schema to use based on DATABASE_URL

/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process');
const path = require('path');
/* eslint-enable @typescript-eslint/no-require-imports */

console.log('🔧 Starting build process...');

// Check if DATABASE_URL is set
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL is not set');
  process.exit(1);
}

// Determine which schema to use based on DATABASE_URL
let schemaPath;
if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
  console.log('🐘 Detected PostgreSQL database, using schema.postgres.prisma');
  schemaPath = 'prisma/schema.postgres.prisma';
} else if (databaseUrl.startsWith('file:')) {
  console.log('🗄️  Detected SQLite database, using schema.sqlite.prisma');
  schemaPath = 'prisma/schema.sqlite.prisma';
} else {
  console.log('⚠️  Unknown database type, defaulting to PostgreSQL schema');
  schemaPath = 'prisma/schema.postgres.prisma';
}

try {
  // Generate Prisma Client
  console.log(`📦 Generating Prisma Client from ${schemaPath}...`);
  execSync(`npx prisma generate --schema="${schemaPath}"`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
  console.log('✅ Prisma Client generated successfully');

  // Build Next.js
  console.log('🏗️  Building Next.js application...');
  execSync('next build', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
