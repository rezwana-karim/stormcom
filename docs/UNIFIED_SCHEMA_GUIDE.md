# Unified Prisma Schema Guide

This project uses a single unified `schema.prisma` file that supports both SQLite (development) and PostgreSQL (production).

## Quick Start

### Development (SQLite)

```bash
# Set up environment
DATABASE_URL="file:./dev.db"

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:dev

# Open Prisma Studio
npm run prisma:studio
```

### Production (PostgreSQL)

```bash
# Switch to PostgreSQL provider
npm run db:switch:postgres

# Set PostgreSQL connection
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Deploy migrations
npm run prisma:migrate:deploy

# Switch back for local development
npm run db:switch:sqlite
```

## Architecture

### Single Source of Truth

The project maintains ONE schema file: `prisma/schema.prisma`

**Benefits:**
- ✅ No schema drift between environments
- ✅ Easier maintenance (single file to update)
- ✅ Reduced risk of inconsistencies
- ✅ Simplified migration workflow

### Legacy Schema Files

The following files are deprecated but kept for reference:
- `prisma/schema.sqlite.prisma` (use `schema.prisma` instead)
- `prisma/schema.postgres.prisma` (use `schema.prisma` instead)

Do not modify these files. They will be removed in a future update.

## Database Provider Switching

The unified schema defaults to SQLite for development. To switch providers:

```bash
# Switch to PostgreSQL
npm run db:switch:postgres

# Switch back to SQLite
npm run db:switch:sqlite
```

**What this does:**
- Modifies the `provider` line in `schema.prisma`
- Changes: `provider = "sqlite"` ↔ `provider = "postgresql"`

**When to switch:**
- Before production deployment: Switch to PostgreSQL
- After deployment: Switch back to SQLite for local dev
- In CI/CD: Automated via deployment scripts

## Environment Configuration

### Development (.env.local)

```bash
DATABASE_URL="file:./dev.db"
```

### Production (.env.production)

```bash
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public&sslmode=require"
```

### Vercel/Cloud Deployment

Set `DATABASE_URL` as environment variable in your deployment platform:
- Vercel: Project Settings → Environment Variables
- Railway: Project Settings → Variables
- Render: Environment → Environment Variables

## Migration Workflow

### Creating a Migration

```bash
# 1. Make changes to schema.prisma

# 2. Create migration (development)
npm run prisma:migrate:dev --name your_migration_name

# 3. Migration is auto-applied to dev.db
```

### Applying Migrations (Production)

```bash
# 1. Switch to PostgreSQL
npm run db:switch:postgres

# 2. Set production DATABASE_URL
export DATABASE_URL="postgresql://..."

# 3. Deploy migration
npm run prisma:migrate:deploy

# 4. Switch back to SQLite
npm run db:switch:sqlite
```

### Migration Best Practices

1. **Always test locally first**
   ```bash
   rm prisma/dev.db  # Start fresh
   npm run prisma:migrate:dev
   ```

2. **Create descriptive migration names**
   ```bash
   ✅ add_product_indexes
   ✅ add_cart_models
   ❌ update_schema
   ❌ fixes
   ```

3. **Review generated SQL**
   - Check `prisma/migrations/[timestamp]_[name]/migration.sql`
   - Verify indexes and constraints
   - Look for data loss risks

4. **Back up production before deploy**
   ```bash
   # PostgreSQL
   pg_dump dbname > backup_$(date +%Y%m%d).sql
   
   # Vercel Postgres
   Use Vercel dashboard backup feature
   ```

## Database Differences: SQLite vs PostgreSQL

### Compatible Field Types

The schema uses database-agnostic types where possible:

| Prisma Type | SQLite | PostgreSQL | Notes |
|-------------|--------|------------|-------|
| `String` | TEXT | VARCHAR/TEXT | ✅ Compatible |
| `Int` | INTEGER | INTEGER | ✅ Compatible |
| `Float` | REAL | DOUBLE PRECISION | ⚠️ Precision differences |
| `Boolean` | INTEGER (0/1) | BOOLEAN | ✅ Prisma handles conversion |
| `DateTime` | TEXT (ISO8601) | TIMESTAMP | ✅ Prisma handles conversion |
| `Json` | TEXT | JSONB | ✅ Prisma handles conversion |

### Known Limitations

**SQLite Limitations:**
- No native `DECIMAL` type (uses REAL, potential precision loss)
- No native ENUM type (uses CHECK constraints)
- Limited ALTER TABLE support (column drops require table recreation)
- No cascading TRUNCATE
- No partial indexes with WHERE clause

**Recommendation:**
- Use Float for prices in development (SQLite)
- Consider Decimal (via raw SQL) for production money fields
- Test critical money calculations in both environments

## Common Tasks

### Reset Database

```bash
# Development (SQLite)
rm prisma/dev.db
npm run prisma:migrate:dev

# Production (PostgreSQL) - DANGER
# Create a new migration to drop/recreate tables
# OR use Prisma Studio to delete data
```

### Seed Database

```bash
npm run db:seed
```

### Inspect Database

```bash
# Open Prisma Studio
npm run prisma:studio

# SQLite CLI
sqlite3 prisma/dev.db

# PostgreSQL CLI
psql $DATABASE_URL
```

### Generate Types

```bash
# Regenerate Prisma Client after schema changes
npm run prisma:generate
```

## Troubleshooting

### "provider env() not supported"

This error occurs if you try to use `env("DATABASE_PROVIDER")` in the schema.

**Solution**: Use the provider switching script:
```bash
npm run db:switch:postgres  # or db:switch:sqlite
```

### "DATABASE_URL not found"

**Solution**: Create `.env.local` file:
```bash
cp .env.example .env.local
```

### "Migration failed"

**Debugging steps:**
1. Check migration SQL: `cat prisma/migrations/[latest]/migration.sql`
2. Verify database connection: `npx prisma db push --force-reset`
3. Check database logs
4. Try migration on clean database

### "Cannot find module '@prisma/client'"

**Solution**: Generate Prisma Client:
```bash
npm run prisma:generate
```

### "Schema validation error"

**Common causes:**
- Syntax error in schema.prisma
- Missing relations
- Invalid field types

**Solution**: Run validation:
```bash
npx prisma validate
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run PostgreSQL migrations
        # Uses schema.postgres.prisma directly - no schema modification needed
        run: npm run prisma:migrate:deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

> **Note**: The deployment uses `schema.postgres.prisma` directly via the npm script.
> Do NOT commit schema changes back from CI/CD as this creates merge conflicts and git noise.
> The unified `schema.prisma` remains set to SQLite for local development.

## Performance Considerations

### Indexes

All critical queries have indexes:
- Multi-tenant: `storeId` first in composite indexes
- Lookups: slug, sku, email, orderNumber
- Sorting: createdAt, status

### Query Optimization

```typescript
// ✅ Good: Uses index
await prisma.product.findMany({
  where: { storeId: 'store123', status: 'ACTIVE' },
  orderBy: { createdAt: 'desc' },
});

// ❌ Bad: Full table scan
await prisma.product.findMany({
  where: { name: { contains: 'shirt' } },
});

// ✅ Better: With index
await prisma.product.findMany({
  where: { 
    storeId: 'store123',
    name: { contains: 'shirt' }
  },
});
```

## Further Reading

- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Multi-Provider Setup](https://www.prisma.io/docs/guides/database/multi-provider)
- [Database Schema Validation Report](./docs/complete-implementations/DATABASE_SCHEMA_VALIDATION_REPORT_2025-11-25.md)

## Support

Questions or issues? Check:
1. This README
2. DATABASE_SCHEMA_VALIDATION_REPORT.md
3. GitHub Issues
4. Prisma Discord
