# PostgreSQL Migration Guide

This guide explains how to migrate your StormCom database from SQLite (development) to PostgreSQL (production).

## Overview

StormCom uses:
- **SQLite** for local development (`schema.sqlite.prisma`)
- **PostgreSQL** for production deployment (`schema.postgres.prisma`)

Both schemas are kept in sync to ensure consistency between environments.

## Prerequisites

- PostgreSQL database set up (see [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md))
- Access to your SQLite database (if migrating data)
- `DATABASE_URL` environment variable configured

## Migration Options

### Option 1: Fresh Start (Recommended for New Deployments)

If you're deploying for the first time or don't need to preserve existing data:

1. **Set up PostgreSQL connection**:
   ```bash
   export DATABASE_URL="postgresql://user:pass@host:5432/database?sslmode=require"
   ```

2. **Run migrations**:
   ```bash
   npm run prisma:migrate:deploy
   ```

3. **Seed initial data** (optional):
   ```bash
   npm run db:seed
   ```

### Option 2: Data Migration (Preserve Existing Data)

If you need to migrate existing data from SQLite to PostgreSQL:

#### Step 1: Export SQLite Data

There are several approaches:

**A. Using Prisma Studio**
```bash
# Open Prisma Studio for SQLite
npx prisma studio --schema=prisma/schema.sqlite.prisma
# Manually export data as needed
```

**B. Using SQL Dump**
```bash
sqlite3 prisma/dev.db .dump > data-dump.sql
# Note: SQL syntax differences may require manual editing
```

**C. Using a Node.js Script (Recommended)**

Create `scripts/migrate-data.js`:

```javascript
const { PrismaClient: PrismaClientSqlite } = require('@prisma/client');
const { PrismaClient: PrismaClientPostgres } = require('@prisma/client');

// Generate Prisma clients for both databases
// First run: npx prisma generate --schema=prisma/schema.sqlite.prisma --generator client --output=./node_modules/.prisma/client-sqlite
// Then run: npx prisma generate --schema=prisma/schema.postgres.prisma --generator client --output=./node_modules/.prisma/client-postgres

const sqlite = new PrismaClientSqlite();
const postgres = new PrismaClientPostgres();

async function migrateData() {
  try {
    console.log('Starting data migration...');

    // Migrate Users
    const users = await sqlite.user.findMany();
    for (const user of users) {
      await postgres.user.upsert({
        where: { id: user.id },
        update: user,
        create: user,
      });
    }
    console.log(`Migrated ${users.length} users`);

    // Migrate Organizations
    const orgs = await sqlite.organization.findMany();
    for (const org of orgs) {
      await postgres.organization.upsert({
        where: { id: org.id },
        update: org,
        create: org,
      });
    }
    console.log(`Migrated ${orgs.length} organizations`);

    // Continue for other models...
    // Add memberships, projects, stores, products, orders, etc.

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sqlite.$disconnect();
    await postgres.$disconnect();
  }
}

migrateData();
```

#### Step 2: Initialize PostgreSQL Schema

```bash
# Set PostgreSQL DATABASE_URL
export DATABASE_URL="postgresql://user:pass@host:5432/database"

# Run migrations
npm run prisma:migrate:deploy
```

#### Step 3: Run Data Migration

```bash
# Run your migration script
node scripts/migrate-data.js
```

#### Step 4: Verify Migration

```bash
# Open Prisma Studio for PostgreSQL
npx prisma studio --schema=prisma/schema.postgres.prisma

# Verify all data is present and correct
```

## Schema Differences

Both schemas are functionally identical. The only differences are:

1. **Provider**: `sqlite` vs `postgresql`
2. **Connection String Format**: 
   - SQLite: `file:./dev.db`
   - PostgreSQL: `postgresql://user:pass@host:5432/database`

## Environment-Specific Commands

### Development (SQLite)
```bash
# Generate Prisma Client
npm run prisma:generate

# Create migration
npm run prisma:migrate:dev

# Open Prisma Studio
npx prisma studio --schema=prisma/schema.sqlite.prisma
```

### Production (PostgreSQL)
```bash
# Generate Prisma Client
npm run prisma:generate:postgres

# Deploy migrations (no interactive prompts)
npm run prisma:migrate:deploy

# Open Prisma Studio
npx prisma studio --schema=prisma/schema.postgres.prisma
```

## Troubleshooting

### Error: "Prisma Client not generated"

**Solution**: Generate the correct client for your database:
```bash
# For PostgreSQL
npm run prisma:generate:postgres

# For SQLite
npm run prisma:generate
```

### Error: "Migration already applied"

**Solution**: Use `prisma migrate deploy` instead of `prisma migrate dev` in production.

### Error: "Column type mismatch"

**Cause**: SQLite and PostgreSQL handle some types differently.

**Solution**: Ensure your schema files are in sync. Check:
- String lengths (Text vs VARCHAR)
- DateTime formats
- JSON field handling

### Data Loss During Migration

**Prevention**:
1. Always backup your SQLite database before migration
2. Test migration on a copy of your data first
3. Verify data in PostgreSQL before deleting SQLite database
4. Keep SQLite database as backup until production is stable

## Best Practices

1. **Keep Schemas in Sync**: When modifying the schema, update both files
2. **Test Migrations**: Always test on a staging database first
3. **Backup Before Deploy**: Back up production database before running migrations
4. **Use Transactions**: Wrap data migrations in transactions when possible
5. **Incremental Migration**: For large datasets, migrate in batches

## Rollback Strategy

If you need to rollback:

1. **Restore Database Backup**:
   ```bash
   # Restore from backup (provider-specific)
   psql -U user -d database < backup.sql
   ```

2. **Revert Migrations**:
   ```bash
   # Create a new migration that reverses changes
   npx prisma migrate dev --name revert_previous_migration --schema=prisma/schema.postgres.prisma
   ```

3. **Switch Back to SQLite** (development only):
   ```bash
   export DATABASE_URL="file:./dev.db"
   npm run dev
   ```

## Production Checklist

Before deploying to production:

- [ ] PostgreSQL database provisioned and accessible
- [ ] Environment variables configured in Vercel/hosting platform
- [ ] Schema validated with `npx prisma validate`
- [ ] Migrations tested on staging database
- [ ] Backup strategy in place
- [ ] Data migration completed (if applicable)
- [ ] Connection pooling configured
- [ ] Database backups scheduled
- [ ] Monitoring and logging set up

## Additional Resources

- [Prisma PostgreSQL Documentation](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [Prisma Migrate Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [SQLite to PostgreSQL Migration Tools](https://pgloader.io/)
- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)

## Support

For issues specific to StormCom:
- GitHub Issues: [rezwana-karim/stormcom/issues](https://github.com/rezwana-karim/stormcom/issues)
- Project Documentation: [README.md](../README.md)

For Prisma-specific issues:
- Prisma Documentation: [prisma.io/docs](https://prisma.io/docs)
- Prisma Community: [slack.prisma.io](https://slack.prisma.io)
