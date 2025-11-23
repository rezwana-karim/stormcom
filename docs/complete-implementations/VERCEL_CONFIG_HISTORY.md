# Vercel Configuration History

## Original Configuration (Before Migration Changes)

The original `vercel.json` configuration before implementing PostgreSQL migrations and conditional seeding:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install"
}
```

## Current Configuration

The current `vercel.json` with automated migrations and conditional seeding:

```json
{
  "buildCommand": "node scripts/migrate-postgres.js && node scripts/conditional-seed.js && npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install"
}
```

## Changes Made

1. **Added PostgreSQL Migration**: `node scripts/migrate-postgres.js` runs before build to create database schema
2. **Added Conditional Seeding**: `node scripts/conditional-seed.js` optionally seeds database if `SEED_DATABASE=true`
3. **Build Command Chain**: Migrations → Seeding → Build

## Reverting to Original Configuration

If you need to revert to the original configuration:

```bash
# Update vercel.json to:
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install"
}

# Then manually run migrations:
# Option 1: Via Vercel CLI
vercel env pull .env.local
export $(cat .env.local | xargs)
npm run prisma:migrate:postgres

# Option 2: Via npm script
npm run prisma:migrate:deploy
```

## Notes

- Original configuration required manual database setup
- Current configuration automates database setup during deployment
- Conditional seeding is opt-in via `SEED_DATABASE` environment variable
- All changes are backward compatible
