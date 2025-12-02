#!/bin/bash
# Build script for Next.js with dynamic Prisma schema selection
# This script determines which Prisma schema to use based on DATABASE_URL

echo "🔧 Starting build process..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL is not set"
  exit 1
fi

# Determine which schema to use based on DATABASE_URL
if [[ $DATABASE_URL == postgresql://* ]] || [[ $DATABASE_URL == postgres://* ]]; then
  echo "🐘 Detected PostgreSQL database, using schema.postgres.prisma"
  SCHEMA_PATH="prisma/schema.postgres.prisma"
elif [[ $DATABASE_URL == file:* ]]; then
  echo "🗄️  Detected SQLite database, using schema.prisma"
  SCHEMA_PATH="prisma/schema.prisma"
else
  echo "⚠️  Unknown database type, defaulting to PostgreSQL schema"
  SCHEMA_PATH="prisma/schema.postgres.prisma"
fi

# Generate Prisma Client
echo "📦 Generating Prisma Client from $SCHEMA_PATH..."
npx prisma generate --schema="$SCHEMA_PATH"

if [ $? -ne 0 ]; then
  echo "❌ Failed to generate Prisma Client"
  exit 1
fi

echo "✅ Prisma Client generated successfully"

# Build Next.js
echo "🏗️  Building Next.js application..."
next build

if [ $? -ne 0 ]; then
  echo "❌ Next.js build failed"
  exit 1
fi

echo "✅ Build completed successfully!"
