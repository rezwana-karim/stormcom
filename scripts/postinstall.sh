#!/bin/bash
# Postinstall script for Prisma Client generation
# Determines which schema to use based on DATABASE_URL

echo "🔄 Running postinstall..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not set, skipping Prisma generation"
  echo "   Run 'npm run prisma:generate' manually when ready"
  exit 0
fi

# Determine which schema to use
if [[ $DATABASE_URL == postgresql://* ]] || [[ $DATABASE_URL == postgres://* ]]; then
  echo "🐘 Using PostgreSQL schema"
  SCHEMA_PATH="prisma/schema.postgres.prisma"
elif [[ $DATABASE_URL == file:* ]]; then
  echo "🗄️  Using SQLite schema"
  SCHEMA_PATH="prisma/schema.prisma"
else
  echo "⚠️  Unknown database, defaulting to PostgreSQL"
  SCHEMA_PATH="prisma/schema.postgres.prisma"
fi

# Generate Prisma Client
echo "📦 Generating Prisma Client from $SCHEMA_PATH..."
npx prisma generate --schema="$SCHEMA_PATH" 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✅ Prisma Client generated"
else
  echo "⚠️  Prisma generation skipped or failed"
fi

exit 0
