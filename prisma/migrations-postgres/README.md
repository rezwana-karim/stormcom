# PostgreSQL Migrations

This directory contains PostgreSQL-specific migration scripts for production deployment.

## Why a Separate Migrations Directory?

The main `prisma/migrations` directory contains SQLite-specific migrations (created during local development). These use SQLite syntax (`DATETIME`, SQLite-specific SQL) which is incompatible with PostgreSQL.

For production deployment on Vercel with PostgreSQL, we need separate migrations that use:
- PostgreSQL data types (`TIMESTAMP(3)` instead of `DATETIME`)
- PostgreSQL enums (`CREATE TYPE ... AS ENUM`)
- PostgreSQL-specific syntax and constraints

## Migration Files

- `init.sql` - Complete schema initialization for PostgreSQL database

## How Migrations are Applied

### During Vercel Deployment

1. The `vercel.json` buildCommand runs `scripts/migrate-postgres.js`
2. The script:
   - Verifies `DATABASE_URL` is a PostgreSQL connection
   - Generates Prisma Client from `schema.postgres.prisma`
   - Attempts to run `prisma migrate deploy` first
   - Falls back to executing `init.sql` directly if needed
3. Then the normal Next.js build proceeds

### Manual Migration

If you need to run migrations manually on production:

```bash
# Set your production DATABASE_URL
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Run the migration script
node scripts/migrate-postgres.js
```

Or directly with Prisma:

```bash
# Generate Prisma Client for PostgreSQL
npx prisma generate --schema=prisma/schema.postgres.prisma

# Run migrations
npx prisma db execute --schema=prisma/schema.postgres.prisma --file=prisma/migrations-postgres/init.sql
```

## Updating the Schema

When you update the PostgreSQL schema (`prisma/schema.postgres.prisma`):

1. Update the schema file
2. Regenerate the migration SQL:
   ```bash
   # This will show you the SQL changes needed
   npx prisma migrate diff \
     --from-empty \
     --to-schema-datamodel prisma/schema.postgres.prisma \
     --script > prisma/migrations-postgres/new-migration.sql
   ```
3. Review and test the migration SQL
4. Update the migration script if needed

## Environment Variables Required

- `DATABASE_URL` - PostgreSQL connection string (required in Vercel environment variables)

Example:
```
DATABASE_URL="postgresql://user:password@host.region.postgres.vercel-storage.com:5432/database?sslmode=require"
```

## Troubleshooting

### Migration fails with "relation already exists"

The `init.sql` script uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times. If you see this error, the tables already exist.

### Connection errors

- Verify `DATABASE_URL` is set correctly in Vercel environment variables
- Check that the PostgreSQL database exists
- Ensure SSL mode is configured correctly (usually `?sslmode=require` for Vercel)

### Permission errors

- Verify the database user has CREATE, ALTER, and INDEX permissions
- For Vercel Postgres, the default user should have all necessary permissions
