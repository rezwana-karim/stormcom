# StormCom - Multi-Tenant SaaS Platform

A production-ready Next.js 16 SaaS boilerplate with authentication, multi-tenancy, team management, and beautiful UI components built with shadcn/ui.

## 🚀 Features

### Core Features
- ✅ **Next.js 16** with App Router and React 19
- ✅ **TypeScript** for type safety
- ✅ **Turbopack** for blazing fast builds
- ✅ **React Compiler** for automatic memoization
- ✅ **Tailwind CSS v4** with shadcn/ui components

### Authentication & Security
- ✅ **NextAuth.js v4** with email magic links
- ✅ **Prisma** ORM with SQLite (dev) / PostgreSQL (prod)
- ✅ **Session Management** with JWT strategy
- ✅ **Security Headers** via proxy.ts
- ✅ **Rate Limiting** for API protection
- ✅ **Environment Validation** with Zod

### Multi-Tenancy
- ✅ **Organization Management** with slug-based routing
- ✅ **Role-Based Access Control** (OWNER, ADMIN, MEMBER, VIEWER)
- ✅ **Team Invitations** via email
- ✅ **Multi-Tenant Database** with proper isolation

### UI/UX
- ✅ **30+ shadcn/ui Components** pre-configured
- ✅ **Dark Mode** with next-themes
- ✅ **Toast Notifications** with Sonner
- ✅ **Responsive Design** mobile-first approach

## 📦 Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 16.0.3 |
| UI Library | React 19.2 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Authentication | NextAuth.js 4.24 |
| Database | Prisma 6.19 |
| Email | Resend |

## 🚦 Getting Started

### Installation

1. Clone and install:
```bash
npm install
```

2. Set up environment variables in `.env.local`:
```env
DATABASE_URL=\"file:./dev.db\"
NEXTAUTH_URL=\"http://localhost:3000\"
NEXTAUTH_SECRET=\"your-secret-min-32-chars\"
RESEND_API_KEY=\"re_your_key\"
EMAIL_FROM=\"noreply@yourdomain.com\"
```

3. Generate Prisma Client and run migrations:
```bash
npm run prisma:generate
export $(cat .env.local | xargs) && npm run prisma:migrate:dev
```

4. Start development:
```bash
npm run dev
```

## 🚀 Deployment

### Deploy to Vercel

1. **Prepare Database**: Set up a PostgreSQL database (Vercel Postgres, Supabase, Neon, or Railway)

2. **Configure Environment Variables** in Vercel:
   - `DATABASE_URL` - PostgreSQL connection string
   - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` - Your production URL
   - `EMAIL_FROM` - Sender email address
   - `RESEND_API_KEY` - Email service API key

3. **Deploy**:
   ```bash
   # Via GitHub (recommended)
   # Push to GitHub and import in Vercel dashboard
   
   # Or via CLI
   vercel --prod
   ```

4. **Run Migrations**:
   ```bash
   vercel env pull .env.local
   npm run prisma:migrate:deploy
   ```

See [VERCEL_DEPLOYMENT.md](./docs/VERCEL_DEPLOYMENT.md) for detailed instructions.

## 📚 Documentation

- [Deployment Guide](./docs/VERCEL_DEPLOYMENT.md) - Deploy to Vercel with PostgreSQL
- [PostgreSQL Migration Guide](./docs/POSTGRESQL_MIGRATION.md) - Migrate from SQLite to PostgreSQL
- [Development Guide](./TASK.md) - Implementation guidance
- [Copilot Instructions](./.github/copilot-instructions.md) - Detailed project structure

For Next.js 16 specifics, see official documentation at https://nextjs.org/docs

Built with Next.js 16 and shadcn/ui
