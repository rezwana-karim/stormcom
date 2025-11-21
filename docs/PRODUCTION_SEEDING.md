# Production Database Seeding Guide

This guide explains how to seed your production PostgreSQL database with demo data.

## ⚠️ CRITICAL: Automatic Seeding Safety

**Production seeding is now CONDITIONAL and SAFE by default.**

The build process includes a conditional seeding step that **ONLY runs if you explicitly enable it**. This prevents accidental data loss.

### How It Works

1. **By Default**: Seeding is SKIPPED during Vercel deployments
2. **To Enable**: Set `SEED_DATABASE=true` in Vercel environment variables
3. **After Seeding**: Remove the variable to prevent future accidental seeding

This ensures you never accidentally delete production data.

## Quick Start (Safe Conditional Seeding)

### Automatic Seeding During Vercel Deployment

**Step 1: Enable Seeding (One-Time)**

In your Vercel project settings:
1. Go to **Settings** → **Environment Variables**
2. Add new variable:
   - **Name**: `SEED_DATABASE`
   - **Value**: `true`
   - **Environment**: Production (or Preview for testing)
3. Save the variable

**Step 2: Deploy**

Push your code or trigger a redeploy. The build process will:
- Run migrations
- **Seed the database** (because `SEED_DATABASE=true`)
- Build the application

**Step 3: Disable Auto-Seeding (Important!)**

After successful seeding:
1. Go back to **Settings** → **Environment Variables**
2. Either:
   - Delete the `SEED_DATABASE` variable, OR
   - Change its value to `false`
3. Save

**Future deployments will NOT seed the database**, protecting your data.

### Manual Seeding (Direct)

```bash
# 1. Install Vercel CLI if not already installed
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Link to your project
vercel link

# 4. Pull environment variables (includes DATABASE_URL)
vercel env pull .env.local

# 5. Source the environment variables
source .env.local  # On Unix/macOS
# OR
export $(cat .env.local | xargs)  # Alternative for Unix/macOS

# 6. Run the production seed script
npm run prisma:seed:production
```

### Option 2: Direct DATABASE_URL

```bash
# Set DATABASE_URL environment variable
export DATABASE_URL="******host:5432/database?sslmode=require"

# Run the production seed script
npm run prisma:seed:production
```

### Option 3: Force Mode (No Confirmation)

Useful for CI/CD or automated scripts:

```bash
# Set DATABASE_URL
export DATABASE_URL="your-postgres-connection-string"

# Run with --force flag to skip confirmation
node scripts/seed-production.js --force
```

## What Gets Created

The seed script creates comprehensive demo data:

### User Account
- **Email**: `test@example.com`
- **Password**: `Test123!@#`
- **Name**: Test User

### Organization
- **Name**: Demo Company
- **Slug**: `demo-company`
- **Role**: Owner (for test user)

### E-commerce Store
- **Name**: Demo Store
- **Currency**: USD
- **Products**: 10 sample products across multiple categories
- **Categories**: Electronics, Clothing, Home & Garden
- **Brands**: Sample brands with products
- **Orders**: Sample orders with various statuses
- **Customers**: Demo customers with order history

### Projects
- Sample projects with team members
- Various project statuses (planning, active, archived)

## Step-by-Step Instructions

### 1. Verify Prerequisites

Ensure your database is ready:

```bash
# Check if migrations are up to date
export DATABASE_URL="your-postgres-url"
npx prisma migrate deploy --schema=prisma/schema.postgres.prisma
```

### 2. Backup (If Needed)

If you have any data you want to keep:

```bash
# Backup PostgreSQL database
pg_dump "your-database-url" > backup-$(date +%Y%m%d).sql
```

### 3. Run Seeding

```bash
# With environment variable
export DATABASE_URL="your-postgres-url"
npm run prisma:seed:production

# You will be prompted to confirm
# Type 'yes' to proceed
```

### 4. Verify Seeding

Check that data was created:

```bash
# Connect to database
psql "your-database-url"

# Check user count
SELECT COUNT(*) FROM "User";

# Check organization count
SELECT COUNT(*) FROM "Organization";

# Check product count
SELECT COUNT(*) FROM "Product";
```

## Seeding for Different Environments

### Local Development (SQLite)

For local development with SQLite, use the regular seed command:

```bash
npm run prisma:seed
# or
npm run db:seed
```

### Staging Environment

For staging environments, follow the production seeding steps but with your staging `DATABASE_URL`.

### Production (First Time Only)

**Only run this on a fresh production database:**

```bash
# Pull production environment variables
vercel env pull .env.production

# Source production variables
export $(cat .env.production | xargs)

# Run seeding with confirmation
npm run prisma:seed:production
```

## Troubleshooting

### Error: "DATABASE_URL is not set"

**Solution**: Set the DATABASE_URL environment variable:
```bash
export DATABASE_URL="******host:5432/database"
```

### Error: "Must be a PostgreSQL connection string"

**Cause**: The DATABASE_URL is pointing to SQLite or another database.

**Solution**: Ensure you're using a PostgreSQL connection string:
```bash
# Correct format
export DATABASE_URL="******host:5432/dbname?sslmode=require"
```

### Error: "relation does not exist"

**Cause**: Database schema is not up to date.

**Solution**: Run migrations first:
```bash
npm run prisma:migrate:postgres
# Then try seeding again
npm run prisma:seed:production
```

### Error: "permission denied"

**Cause**: Database user lacks necessary permissions.

**Solution**: Ensure the database user has CREATE, INSERT, UPDATE, DELETE permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE your_db TO your_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO your_user;
```

### Seeding Takes Too Long

**Cause**: Large dataset or slow database connection.

**Solution**: 
- Ensure database is in the same region as your machine
- Check network connectivity
- The seed script creates comprehensive demo data; this is expected to take 30-60 seconds

## Post-Seeding

### Login to Application

After seeding, you can log in with:

- **URL**: Your application URL (e.g., `https://your-app.vercel.app`)
- **Email**: `test@example.com`
- **Password**: `Test123!@#`

### Explore Demo Data

1. **Dashboard**: View sample projects and organization
2. **E-commerce**: Browse demo products, categories, and orders
3. **Team**: See organization members and roles
4. **Settings**: Configure store and organization settings

### Clean Up (If Needed)

To remove all seeded data and start fresh:

```bash
# Connect to database
psql "your-database-url"

# Delete all data (careful!)
TRUNCATE "User", "Account", "Session", "Organization", "Membership", 
         "Project", "ProjectMember", "Store", "Product", "Category", 
         "Brand", "Order", "OrderItem", "Customer" CASCADE;
```

Or run the seed script again (it cleans before seeding).

## CI/CD Integration

For automated seeding in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Seed Production Database
  run: |
    export DATABASE_URL="${{ secrets.DATABASE_URL }}"
    npm run prisma:seed:production -- --force
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Security Considerations

1. **Never seed production with real user data**: Always use demo/test accounts
2. **Change default passwords**: Update the test account password after seeding
3. **Limit access**: Only authorized personnel should have seeding access
4. **Audit logs**: Keep track of when and who runs seeding scripts
5. **Environment separation**: Use different databases for dev/staging/production

## Alternative: Manual Data Entry

If you prefer not to use automated seeding:

1. Access your application at the production URL
2. Sign up for a new account
3. Create an organization
4. Manually add products, categories, etc., through the UI

This is slower but gives you full control over the data.

## Support

If you encounter issues:

1. Check the error message carefully
2. Verify DATABASE_URL is correct
3. Ensure migrations are up to date
4. Check database user permissions
5. Review this guide's troubleshooting section
6. Consult the main deployment documentation

## Related Documentation

- [Deployment Guide](./VERCEL_DEPLOYMENT.md) - Full deployment instructions
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) - Production checklist
- [Migration Guide](../prisma/migrations-postgres/README.md) - Database migrations

---

**Remember**: Seeding deletes all existing data. Use with caution!
