# Multi-Tenant Subdomain Routing Setup Guide

This guide explains how to set up and test the subdomain-based multi-tenancy routing for StormCom.

## Overview

StormCom supports multi-tenant e-commerce stores with:
- **Subdomain routing**: `vendor1.stormcom.app`, `vendor2.stormcom.app`
- **Custom domain support**: `vendor.com` (CNAME to StormCom)
- **Local development**: `demo.localhost:3000`, `acme.localhost:3000`

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         proxy.ts (Next.js 16)                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  1. Extract subdomain from hostname                         │ │
│  │  2. Check cache for store data (10-min TTL)                 │ │
│  │  3. Query /api/stores/lookup if not cached                  │ │
│  │  4. Rewrite URL: vendor1.com/ → /store/vendor1/             │ │
│  │  5. Pass store data via headers (x-store-id, x-store-slug)  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    /store/[slug]/* routes                        │
│  - layout.tsx: Reads x-store-id header, renders store layout    │
│  - page.tsx: Store homepage with featured products              │
│  - products/page.tsx: Product listing with filters              │
│  - categories/page.tsx: Category listing                         │
└─────────────────────────────────────────────────────────────────┘
```

## Local Development Setup (Windows)

### 1. Edit Windows Hosts File

Open PowerShell as Administrator and run:

```powershell
# Open hosts file in Notepad with admin privileges
notepad C:\Windows\System32\drivers\etc\hosts
```

Add these lines at the end:

```
# StormCom Multi-Tenant Development
127.0.0.1 demo.localhost
127.0.0.1 acme.localhost
127.0.0.1 teststore.localhost
```

Save the file and close Notepad.

### 2. Verify Hosts File

```powershell
# Test the hosts entries
ping demo.localhost
ping acme.localhost
```

You should see replies from `127.0.0.1`.

### 3. Start Development Server

```bash
npm run dev
```

### 4. Access Stores

- **Demo Store**: http://demo.localhost:3000
- **Acme Store**: http://acme.localhost:3000
- **Direct URL**: http://localhost:3000/store/demo-store

## Available Test Stores

The seed data creates these stores:

| Store Name | Subdomain | Direct URL |
|------------|-----------|------------|
| Demo Store | `demo` | `/store/demo-store` |
| Acme Store | `acme` | `/store/acme-store` |

### Create New Test Stores

```bash
# Run seed to reset with default stores
npm run prisma:seed

# Or create via API (requires auth)
# POST /api/stores with store data
```

## Production Setup

### Subdomain Routing (*.stormcom.app)

1. Configure DNS wildcard record:
   ```
   *.stormcom.app → A record → your-server-ip
   ```

2. Configure SSL with wildcard certificate

3. Deploy to Vercel or your preferred platform

### Custom Domain Support

For custom domains like `vendor.com`:

1. **Vendor adds CNAME record**:
   ```
   Type: CNAME
   Name: @ (or www)
   Value: cname.vercel-dns.com (if using Vercel)
   TTL: 3600
   ```

2. **Add domain in Vercel**:
   - Project Settings → Domains → Add Domain
   - Enter `vendor.com`
   - Verify DNS configuration

3. **Update store record**:
   ```sql
   UPDATE Store SET customDomain = 'vendor.com' WHERE slug = 'vendor-store';
   ```

4. **Verify in admin panel**:
   - POST `/api/stores/[id]/verify-domain`

## Caching Strategy

The proxy implements a 10-minute cache for store lookups:

```typescript
const STORE_CACHE_TTL = 600; // 10 minutes

// Cache key: store:{hostname}
// Example: store:demo.localhost
```

**Cache Invalidation**:
- Store updates should clear cache (implement via webhook or admin action)
- Cache automatically expires after 10 minutes

## Troubleshooting

### Store Not Found (404)

1. Check subdomain exists in database:
   ```sql
   SELECT * FROM Store WHERE subdomain = 'demo';
   ```

2. Check store is not deleted:
   ```sql
   SELECT * FROM Store WHERE subdomain = 'demo' AND deletedAt IS NULL;
   ```

3. Verify hosts file entry (Windows):
   ```powershell
   type C:\Windows\System32\drivers\etc\hosts | findstr localhost
   ```

### Proxy Not Running

1. Ensure `proxy.ts` exists at project root
2. Check Next.js version is 16+:
   ```bash
   npm list next
   ```

3. Check for proxy errors in console:
   ```bash
   npm run dev 2>&1 | findstr "[proxy]"
   ```

### Headers Not Passed

Verify headers in Server Component:
```typescript
import { headers } from "next/headers";

const headersList = await headers();
console.log("Store ID:", headersList.get("x-store-id"));
console.log("Store Slug:", headersList.get("x-store-slug"));
console.log("Store Name:", headersList.get("x-store-name"));
```

## Security Considerations

1. **Multi-tenancy isolation**: Always filter queries by both `storeId` and relevant user context
2. **Subdomain validation**: Only allow alphanumeric subdomains
3. **Custom domain verification**: Implement DNS verification before enabling
4. **Rate limiting**: Consider rate limiting the `/api/stores/lookup` endpoint

## Files Reference

| File | Purpose |
|------|---------|
| `proxy.ts` | Next.js 16 proxy for subdomain routing |
| `src/app/api/stores/lookup/route.ts` | Store lookup API endpoint |
| `src/app/store/[slug]/layout.tsx` | Store layout with header/footer |
| `src/app/store/[slug]/page.tsx` | Store homepage |
| `src/app/store-not-found/page.tsx` | 404 page for invalid stores |
| `src/components/storefront/store-header.tsx` | Store navigation component |
| `src/components/storefront/store-footer.tsx` | Store footer component |
| `prisma/schema.prisma` | Store model with subdomain/customDomain |
