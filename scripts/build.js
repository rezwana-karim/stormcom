#!/usr/bin/env node
// Build script for Next.js with unified Prisma schema
// This script ensures Prisma Client is generated before building

/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
/* eslint-enable @typescript-eslint/no-require-imports */

// Load .env.local file if it exists (for local development)
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log('📄 Loading .env.local file...');
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '').split('#')[0].trim();
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = value;
        }
      }
    }
  });
}

console.log('🔧 Starting build process...');

// Check if DATABASE_URL is set
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL is not set');
  console.log('💡 Tip: Create a .env.local file with DATABASE_URL="file:./dev.db"');
  process.exit(1);
}

// Detect and log database type
if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
  console.log('🐘 Detected PostgreSQL database');
} else if (databaseUrl.startsWith('file:')) {
  console.log('🗄️  Detected SQLite database');
} else {
  console.log('⚠️  Unknown database type, proceeding with build');
}

// Use unified schema
const schemaPath = 'prisma/schema.prisma';
console.log(`📋 Using unified schema: ${schemaPath}`);

try {
  // Generate Prisma Client
  console.log('📦 Generating Prisma Client...');
  execSync(`npx prisma generate`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
  console.log('✅ Prisma Client generated successfully');

  // Build Next.js
  console.log('🏗️  Building Next.js application...');
  execSync('npx next build', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
