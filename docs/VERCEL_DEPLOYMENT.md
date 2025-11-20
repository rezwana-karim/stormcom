# Vercel Deployment Guide

This guide walks you through deploying StormCom to Vercel with PostgreSQL database.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **PostgreSQL Database**: Set up a PostgreSQL database (recommended providers):
   - [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
   - [Supabase](https://supabase.com)
   - [Neon](https://neon.tech)
   - [Railway](https://railway.app)
   - [PlanetScale](https://planetscale.com) (MySQL, would need schema adjustments)

## Setup Instructions

### 1. Prepare Your Database

#### Option A: Using Vercel Postgres (Recommended)

1. Go to your Vercel project dashboard
2. Navigate to the "Storage" tab
3. Create a new Postgres database
4. Copy the connection string (it will look like: `postgres://username:password@host:5432/database`)

#### Option B: Using External PostgreSQL Provider

1. Create a PostgreSQL database with your chosen provider
2. Get the connection string (format: `postgresql://username:password@host:5432/database?sslmode=require`)

### 2. Configure Environment Variables in Vercel

Go to your Vercel project settings → Environment Variables and add:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | Your PostgreSQL connection string | From step 1 |
| `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` | Min 32 characters |
| `NEXTAUTH_URL` | Your production URL | e.g., `https://your-app.vercel.app` |
| `EMAIL_FROM` | Your sender email | e.g., `noreply@yourdomain.com` |
| `RESEND_API_KEY` | Your Resend API key | Get from [resend.com](https://resend.com) |

**Important**: Add these variables to all environments (Production, Preview, Development) as needed.

### 3. Initialize Database Schema

After deploying, you need to run migrations to set up the database:

#### Option 1: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Pull environment variables
vercel env pull .env.local

# Run migrations
npm run prisma:migrate:deploy
```

#### Option 2: Using GitHub Actions (Automated)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Database Migrations

on:
  push:
    branches: [main]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npx prisma migrate deploy --schema=prisma/schema.postgres.prisma
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### 4. Deploy to Vercel

#### Option A: Via GitHub Integration (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Vercel will auto-detect Next.js configuration
5. Click "Deploy"

#### Option B: Via Vercel CLI

```bash
vercel --prod
```

### 5. Seed Initial Data (Optional)

If you want to populate the database with sample data:

```bash
# Make sure DATABASE_URL points to your production database
vercel env pull .env.local
npm run prisma:seed
```

**Warning**: Only run seed in non-production environments or with test data.

## Post-Deployment Checklist

- [ ] Verify app is accessible at your Vercel URL
- [ ] Test authentication (sign up, login)
- [ ] Check database connections
- [ ] Monitor logs in Vercel dashboard
- [ ] Set up custom domain (optional)
- [ ] Configure CORS if using external APIs
- [ ] Enable Vercel Analytics (optional)

## Environment-Specific Configurations

### Development
- Uses SQLite: `file:./dev.db`
- Local Prisma migrations: `npm run prisma:migrate:dev`
- Seed with: `npm run db:seed`

### Production (Vercel)
- Uses PostgreSQL: Connection string from environment variable
- Migrations via: `npm run prisma:migrate:deploy`
- No seeding in production (manual only)

## Troubleshooting

### Build Errors

**Error**: `Prisma Client not generated`
- **Solution**: The `postinstall` script should handle this automatically. If not, add `prisma:generate:postgres` to your build command.

**Error**: `Environment variable not found: DATABASE_URL`
- **Solution**: Ensure all environment variables are set in Vercel project settings.

**Error**: `Can't reach database server`
- **Solution**: Check your DATABASE_URL is correct and the database allows connections from Vercel IPs.

### Migration Errors

**Error**: `The database schema is not empty`
- **Solution**: Use `prisma migrate deploy` for production, not `prisma migrate dev`.

**Error**: `Migration failed to apply`
- **Solution**: Check migration files and ensure they're compatible with PostgreSQL. SQLite-specific features may need adjustment.

## Database Migrations

### Creating New Migrations

During development:
```bash
# 1. Modify prisma/schema.sqlite.prisma (for local dev)
# 2. Create migration
npm run prisma:migrate:dev

# 3. Update prisma/schema.postgres.prisma to match
# 4. Test production migration
npm run prisma:migrate:deploy
```

### Rolling Back

Prisma doesn't support automatic rollbacks. To revert:
1. Create a new migration that reverses the changes
2. Apply it with `prisma migrate deploy`

## Monitoring

- **Logs**: Vercel Dashboard → Your Project → Logs
- **Database**: Use your database provider's dashboard
- **Performance**: Enable Vercel Analytics in project settings

## Scaling Considerations

1. **Database Connection Pooling**: Configure `connection_limit` in DATABASE_URL:
   ```
   postgresql://user:pass@host:5432/db?connection_limit=10
   ```

2. **Prisma Data Proxy** (for serverless): Consider using for better connection management:
   ```bash
   npx prisma generate --data-proxy
   ```

3. **Caching**: Implement Redis for session storage and caching (optional)

## Security Best Practices

- [ ] Use strong, unique secrets for `NEXTAUTH_SECRET`
- [ ] Enable SSL for database connections
- [ ] Rotate API keys regularly
- [ ] Set up database backups
- [ ] Monitor for suspicious activity
- [ ] Use environment variables for all secrets (never hardcode)
- [ ] Enable Vercel's security headers
- [ ] Set up rate limiting for API routes

## Support

- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Prisma**: [prisma.io/docs](https://prisma.io/docs)
- **Project Issues**: [GitHub Issues](https://github.com/rezwana-karim/stormcom/issues)

## Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Vercel Platform Documentation](https://vercel.com/docs)
- [Prisma Production Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)
