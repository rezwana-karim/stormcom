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

## 📚 Documentation

See [TASK.md](./TASK.md) and [.github/copilot-instructions.md](./.github/copilot-instructions.md) for detailed implementation guidance.

For Next.js 16 specifics, see official documentation at https://nextjs.org/docs

Built with Next.js 16 and shadcn/ui
