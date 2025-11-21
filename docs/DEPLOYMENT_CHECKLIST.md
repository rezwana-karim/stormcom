# Production Deployment Checklist

Use this checklist when deploying StormCom to production on Vercel.

## Pre-Deployment

- [ ] Code is committed and pushed to GitHub
- [ ] All tests pass locally (if any)
- [ ] Environment variables are documented

## Vercel Setup

- [ ] PostgreSQL database created (Vercel Postgres recommended)
- [ ] Database connection string obtained
- [ ] Vercel project connected to GitHub repository

## Environment Variables (in Vercel Project Settings)

Set these in **Settings → Environment Variables** for all environments:

- [ ] `DATABASE_URL` - PostgreSQL connection string
  ```
  Format: postgresql://user:password@host:5432/database?sslmode=require
  ```
- [ ] `NEXTAUTH_SECRET` - Generated with `openssl rand -base64 32`
- [ ] `NEXTAUTH_URL` - Production URL (e.g., `https://stormcom.vercel.app`)
- [ ] `EMAIL_FROM` - Sender email address
- [ ] `RESEND_API_KEY` - Resend API key for email (optional for build)

## Deployment

- [ ] Push code to GitHub (or run `vercel --prod`)
- [ ] Wait for Vercel deployment to complete
- [ ] Check deployment logs for:
  - [ ] "✅ Prisma Client generated successfully"
  - [ ] "✅ Migration completed successfully"
  - [ ] "✅ Build completed successfully"

## Post-Deployment Verification

- [ ] Visit production URL
- [ ] Test signup page (`/signup`)
- [ ] Create a test account
- [ ] Verify email magic link works
- [ ] Test login (`/login`)
- [ ] Access dashboard (`/dashboard`)
- [ ] Check Vercel Analytics is working

## Optional: Seed Demo Data

**⚠️ WARNING**: Only seed on fresh databases. Seeding deletes all existing data!

- [ ] Decide if you want demo data in production
- [ ] If yes, follow [Production Seeding Guide](./PRODUCTION_SEEDING.md)
- [ ] Use Vercel CLI to pull environment variables
- [ ] Run `npm run prisma:seed:production`
- [ ] Test demo login: `test@example.com` / `Test123!@#`

## Database Verification

- [ ] Connect to production database
  ```bash
  psql "your-production-database-url"
  ```
- [ ] Verify tables exist:
  ```sql
  \dt
  ```
  Should show: User, Account, Session, VerificationToken, Organization, Membership, etc.

- [ ] Check for any data:
  ```sql
  SELECT COUNT(*) FROM "User";
  ```

## Monitoring

- [ ] Check Vercel deployment logs for errors
- [ ] Monitor Vercel Analytics dashboard
- [ ] Set up error alerts (optional)
- [ ] Configure custom domain (optional)

## Common Issues

### Issue: "The table 'public.User' does not exist"

**Solution:**
1. Check Vercel build logs for migration errors
2. Verify `DATABASE_URL` is set correctly
3. Manually run migrations if needed:
   ```bash
   export DATABASE_URL="your-production-url"
   npm run prisma:migrate:postgres
   ```
4. Redeploy

### Issue: "Cannot connect to database"

**Solution:**
1. Verify database is running and accessible
2. Check connection string format
3. Ensure SSL is enabled (`?sslmode=require`)
4. Test connection locally:
   ```bash
   psql "your-database-url"
   ```

### Issue: Build times out

**Solution:**
1. Check database is in same region as Vercel deployment
2. Verify network connectivity to database
3. Try manual migration first, then redeploy

## Rollback Plan

If deployment fails:

1. **Immediate:** Revert to previous deployment in Vercel dashboard
2. **Database:** No rollback needed (migrations are additive)
3. **Fix:** Address issues in development
4. **Redeploy:** Push fixes to trigger new deployment

## Security Checklist

- [ ] `NEXTAUTH_SECRET` is strong and unique
- [ ] Database has SSL enabled
- [ ] No secrets in code or logs
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Security headers configured

## Performance Checklist

- [ ] Vercel Analytics enabled
- [ ] Database connection pooling configured
- [ ] Images optimized
- [ ] Static pages cached properly

## Next Steps

After successful deployment:

1. Set up custom domain
2. Configure DNS
3. Enable preview deployments
4. Set up staging environment
5. Configure backup strategy
6. Monitor performance metrics

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Production Best Practices](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Project Issues](https://github.com/rezwana-karim/stormcom/issues)
