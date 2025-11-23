# StormCom Enhancement Implementation Plan

**Created:** November 23, 2025  
**Status:** Ready for Execution  
**Estimated Timeline:** 8-12 weeks total

---

## Phase 19: Testing & Monitoring Foundation (Week 1-2)

### Task 1.1: Vitest Testing Suite Setup
**Priority:** P1 - Critical  
**Estimated Time:** 3-4 days

**Actions:**
1. Install dependencies:
   ```bash
   npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom
   ```

2. Create `vitest.config.ts`:
   ```typescript
   import { defineConfig } from 'vitest/config';
   import react from '@vitejs/plugin-react';
   import path from 'path';

   export default defineConfig({
     plugins: [react()],
     test: {
       globals: true,
       environment: 'jsdom',
       setupFiles: './tests/setup.ts',
     },
     resolve: {
       alias: {
         '@': path.resolve(__dirname, './src'),
       },
     },
   });
   ```

3. Create test files for all 28 API modules:
   - `tests/api/analytics.test.ts`
   - `tests/api/orders.test.ts`
   - `tests/api/customers.test.ts`
   - ... (25 more modules)

4. Add test scripts to `package.json`:
   ```json
   {
     "scripts": {
       "test": "vitest",
       "test:ui": "vitest --ui",
       "test:coverage": "vitest --coverage"
     }
   }
   ```

**Success Criteria:**
- All 119 API endpoints have at least one test
- Coverage: >80% for API routes
- CI/CD integration ready

---

### Task 1.2: Sentry Error Monitoring
**Priority:** P1 - Critical  
**Estimated Time:** 1 day

**Actions:**
1. Install Sentry:
   ```bash
   npm install @sentry/nextjs
   ```

2. Run Sentry wizard:
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```

3. Configure environment variables:
   ```bash
   NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
   SENTRY_AUTH_TOKEN=your-auth-token
   ```

4. Add error reporting to API routes:
   ```typescript
   import { reportError } from '@/lib/monitoring';

   try {
     // API logic
   } catch (error) {
     reportError(error, { userId, storeId, endpoint: '/api/orders' });
     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
   }
   ```

**Success Criteria:**
- Errors automatically reported to Sentry
- User context attached to error reports
- Source maps uploaded for production debugging

---

### Task 1.3: Performance Monitoring
**Priority:** P1 - Critical  
**Estimated Time:** 1 day

**Actions:**
1. Enable Vercel Analytics (production):
   - Update `next.config.ts` to enable Speed Insights
   - Add `@vercel/analytics` tracking to layouts

2. Add custom API performance logging:
   ```typescript
   // src/middleware/performance.ts
   export function withPerformanceLogging(handler: ApiHandler) {
     return async (req: NextRequest) => {
       const start = Date.now();
       const response = await handler(req);
       const duration = Date.now() - start;
       
       console.log({
         method: req.method,
         url: req.url,
         status: response.status,
         duration,
       });
       
       return response;
     };
   }
   ```

**Success Criteria:**
- Performance metrics visible in Vercel dashboard
- Slow API endpoints identified (<200ms target)
- Page load metrics tracked

---

## Phase 20: Security Hardening (Week 3)

### Task 2.1: Rate Limiting
**Priority:** P2 - High  
**Estimated Time:** 2 days

**Actions:**
1. Install Upstash Rate Limit:
   ```bash
   npm install @upstash/ratelimit @upstash/redis
   ```

2. Set up Upstash Redis (free tier):
   - Create account at upstash.com
   - Create Redis database
   - Copy UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN

3. Implement rate limiting middleware:
   ```typescript
   // src/lib/rate-limit.ts
   import { Ratelimit } from '@upstash/ratelimit';
   import { Redis } from '@upstash/redis';

   const redis = Redis.fromEnv();

   export const loginRateLimit = new Ratelimit({
     redis,
     limiter: Ratelimit.slidingWindow(5, '15 m'),
   });

   export const apiRateLimit = new Ratelimit({
     redis,
     limiter: Ratelimit.slidingWindow(100, '1 m'),
   });
   ```

4. Apply to public endpoints:
   - Login: 5 attempts per 15 minutes
   - Signup: 3 attempts per hour
   - Search: 20 requests per minute
   - General API: 100 requests per minute

**Success Criteria:**
- Brute force attacks mitigated
- Rate limit headers returned (X-RateLimit-*)
- User-friendly error messages

---

### Task 2.2: Security Headers
**Priority:** P2 - High  
**Estimated Time:** 1 day

**Actions:**
1. Update `next.config.ts`:
   ```typescript
   async headers() {
     return [
       {
         source: '/:path*',
         headers: [
           { key: 'X-DNS-Prefetch-Control', value: 'on' },
           { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
           { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
           { key: 'X-Content-Type-Options', value: 'nosniff' },
           { key: 'X-XSS-Protection', value: '1; mode=block' },
           { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
         ],
       },
     ];
   }
   ```

2. Add Content Security Policy (CSP):
   ```typescript
   {
     key: 'Content-Security-Policy',
     value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
   }
   ```

**Success Criteria:**
- A+ rating on securityheaders.com
- CSP violations monitored in Sentry

---

## Phase 21: Performance Optimization (Week 4-5)

### Task 3.1: API Caching
**Priority:** P3 - Medium  
**Estimated Time:** 3 days

**Actions:**
1. Implement Redis caching for analytics:
   ```typescript
   import { unstable_cache } from 'next/cache';

   export const getCachedAnalytics = unstable_cache(
     async (storeId: string, startDate: Date, endDate: Date) => {
       return await analytics.getDashboardData(storeId, startDate, endDate);
     },
     ['analytics-dashboard'],
     {
       revalidate: 300, // 5 minutes
       tags: ['analytics'],
     }
   );
   ```

2. Add cache invalidation on data changes:
   ```typescript
   import { revalidateTag } from 'next/cache';

   // After creating order
   revalidateTag('analytics');
   ```

3. Cache frequently accessed data:
   - Analytics dashboard (5 min)
   - Product lists (1 min)
   - Store settings (10 min)
   - Category tree (30 min)

**Success Criteria:**
- Analytics load time reduced by 70%
- Cache hit rate >80%
- Proper cache invalidation on updates

---

### Task 3.2: Database Optimization
**Priority:** P3 - Medium  
**Estimated Time:** 2 days

**Actions:**
1. Add database indexes:
   ```prisma
   model Order {
     @@index([storeId, status, createdAt])
     @@index([userId, storeId])
     @@index([orderNumber])
   }

   model Product {
     @@index([storeId, published, createdAt])
     @@index([slug])
     @@index([categoryId])
   }
   ```

2. Create migration:
   ```bash
   npx prisma migrate dev --name add-performance-indexes
   ```

3. Optimize expensive queries:
   - Use `select` to limit fields
   - Add pagination to all list endpoints
   - Use `include` strategically (avoid over-fetching)

**Success Criteria:**
- Query times reduced by 50%
- No N+1 query warnings
- Database size under control

---

### Task 3.3: Image Optimization
**Priority:** P3 - Medium  
**Estimated Time:** 1 day

**Actions:**
1. Replace all `<img>` tags with Next.js `<Image>`:
   ```tsx
   import Image from 'next/image';

   <Image
     src="/avatars/user.jpg"
     alt="User avatar"
     width={40}
     height={40}
     className="rounded-full"
   />
   ```

2. Set up Cloudinary for user uploads:
   - Create Cloudinary account
   - Install `cloudinary` SDK
   - Add upload API endpoint

3. Add avatar placeholder service:
   ```typescript
   const avatarUrl = user.image || 
     `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=128`;
   ```

**Success Criteria:**
- All images lazy-loaded
- Avatar 404 error fixed
- Product images optimized automatically

---

## Phase 22: Feature Enhancements (Week 6-8)

### Task 4.1: Admin Dashboard Improvements
**Priority:** P4 - Low  
**Estimated Time:** 5 days

**Actions:**
1. Real-time analytics refresh:
   ```typescript
   // Use SWR for auto-refresh
   import useSWR from 'swr';

   const { data, error } = useSWR(
     `/api/analytics/dashboard?storeId=${storeId}`,
     fetcher,
     { refreshInterval: 30000 } // 30 seconds
   );
   ```

2. CSV export functionality:
   ```typescript
   // src/lib/export.ts
   export function exportToCSV(data: any[], filename: string) {
     const csv = Papa.unparse(data);
     const blob = new Blob([csv], { type: 'text/csv' });
     const url = window.URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = filename;
     a.click();
   }
   ```

3. Advanced filtering:
   - Date range picker
   - Status filter (multi-select)
   - Customer search
   - Amount range filter

**Success Criteria:**
- Analytics refresh automatically
- Export works for orders, customers, products
- Filters apply instantly with debouncing

---

### Task 4.2: Audit Log Viewer
**Priority:** P4 - Low  
**Estimated Time:** 3 days

**Actions:**
1. Create `/dashboard/audit-logs` page
2. Design timeline UI component
3. Add filters:
   - User filter
   - Action type filter (CREATE, UPDATE, DELETE)
   - Resource type filter (Order, Product, Customer)
   - Date range

4. Implement search by description

**Success Criteria:**
- All audit events visible
- Timeline shows chronological events
- Filters narrow results effectively

---

### Task 4.3: Notification Center
**Priority:** P4 - Low  
**Estimated Time:** 3 days

**Actions:**
1. Add bell icon to header with badge:
   ```tsx
   <Button variant="ghost" size="icon" onClick={toggleNotifications}>
     <Bell className="h-5 w-5" />
     {unreadCount > 0 && (
       <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs">
         {unreadCount}
       </span>
     )}
   </Button>
   ```

2. Create dropdown notification list
3. Mark as read on click
4. Link to relevant resource (order, product, etc.)

**Success Criteria:**
- Unread count updates in real-time
- Notifications grouped by date
- Mark all as read functionality works

---

### Task 4.4: Webhook Management UI
**Priority:** P4 - Low  
**Estimated Time:** 3 days

**Actions:**
1. Create `/dashboard/settings/webhooks` page
2. Add webhook CRUD operations
3. Implement webhook testing:
   ```typescript
   async function testWebhook(webhookId: string) {
     const response = await fetch('/api/webhooks/test', {
       method: 'POST',
       body: JSON.stringify({ webhookId }),
     });
     return response.json();
   }
   ```

4. Show webhook logs (last 100 deliveries)

**Success Criteria:**
- Webhooks manageable from UI
- Test sends sample payload
- Logs show delivery status and response

---

## Phase 23: Documentation & Developer Experience (Week 9-10)

### Task 5.1: API Documentation (Swagger)
**Priority:** P5 - Enhancement  
**Estimated Time:** 4 days

**Actions:**
1. Install Swagger tools:
   ```bash
   npm install swagger-jsdoc swagger-ui-react
   ```

2. Add JSDoc comments to all API routes:
   ```typescript
   /**
    * @swagger
    * /api/orders:
    *   get:
    *     summary: Get orders for a store
    *     tags: [Orders]
    *     parameters:
    *       - in: query
    *         name: storeId
    *         required: true
    *         schema:
    *           type: string
    *     responses:
    *       200:
    *         description: List of orders
    */
   ```

3. Create `/api-docs` page with Swagger UI

**Success Criteria:**
- All 119 endpoints documented
- Interactive "Try it out" functionality
- Authentication headers configurable

---

### Task 5.2: Database Seeding Improvements
**Priority:** P5 - Enhancement  
**Estimated Time:** 2 days

**Actions:**
1. Create multiple seed scenarios:
   ```typescript
   // prisma/seeds/small.ts
   export async function seedSmall() {
     // 1 store, 10 products, 5 orders
   }

   // prisma/seeds/large.ts
   export async function seedLarge() {
     // 5 stores, 500 products, 1000 orders
   }
   ```

2. Add CLI flags:
   ```bash
   npm run prisma:seed -- --scenario=large
   npm run prisma:seed -- --scenario=small --reset
   ```

**Success Criteria:**
- Multiple seed scenarios available
- Reset command clears database first
- Seed data realistic and useful

---

### Task 5.3: Developer Guide Update
**Priority:** P5 - Enhancement  
**Estimated Time:** 2 days

**Actions:**
1. Update `docs/developer-guide.md`:
   - API conventions section
   - How to add new API endpoint (step-by-step)
   - How to add new dashboard page
   - Debugging guide (NextAuth, Prisma, API errors)
   - Environment variables reference

2. Create `docs/api-patterns.md`:
   - Multi-tenancy pattern
   - Pagination pattern
   - Error handling pattern
   - Validation pattern

**Success Criteria:**
- New developers can onboard in <1 hour
- Common tasks documented
- Troubleshooting guide comprehensive

---

## Implementation Priority Summary

### Week 1-2: Foundation (P1 - Critical)
- ✅ Vitest testing suite setup
- ✅ Sentry error monitoring
- ✅ Performance monitoring baseline

### Week 3: Security (P2 - High)
- ✅ Rate limiting on public endpoints
- ✅ Security headers configuration

### Week 4-5: Performance (P3 - Medium)
- ✅ API caching with Redis
- ✅ Database query optimization
- ✅ Image optimization

### Week 6-8: Features (P4 - Low)
- ✅ Admin dashboard enhancements
- ✅ Audit log viewer
- ✅ Notification center
- ✅ Webhook management UI

### Week 9-10: Documentation (P5 - Enhancement)
- ✅ Swagger API documentation
- ✅ Database seeding improvements
- ✅ Developer guide updates

---

## Resource Requirements

### Development Tools
- Upstash Redis (free tier: 10K commands/day)
- Sentry (free tier: 5K errors/month)
- Cloudinary (free tier: 25 credits/month)
- Vercel Analytics (included with Pro plan)

### Time Estimate
- **Total Development Time:** 40-50 days
- **Testing & QA:** 5-7 days
- **Documentation:** 3-4 days
- **Total Timeline:** 8-12 weeks

### Team Size
- 1 Full-stack Developer: Can complete in 12 weeks
- 2 Full-stack Developers: Can complete in 6-8 weeks
- 3 Developers (1 frontend, 1 backend, 1 DevOps): Can complete in 4-5 weeks

---

## Success Metrics

### Performance Targets
- API response time: <200ms (95th percentile)
- Dashboard load time: <3s (95th percentile)
- Test coverage: >80% for API routes
- Lighthouse score: >90 (performance, accessibility, SEO)

### Quality Targets
- Zero critical security vulnerabilities
- Zero production errors (daily)
- Uptime: >99.9%
- User satisfaction: >4.5/5

---

## Risk Mitigation

### Risk 1: Breaking Changes in Testing Implementation
**Mitigation:**
- Test in isolated branch
- Run full regression suite before merge
- Keep production stable during testing implementation

### Risk 2: Performance Degradation with Caching
**Mitigation:**
- Monitor cache hit rates closely
- A/B test caching strategies
- Have rollback plan ready

### Risk 3: Redis/Upstash Cost Overruns
**Mitigation:**
- Monitor usage daily
- Set up billing alerts
- Have fallback to in-memory cache if needed

---

## Deployment Strategy

### Phase 1: Staging Deployment
1. Deploy to staging environment
2. Run full test suite
3. Load testing with realistic traffic
4. Security scanning

### Phase 2: Canary Deployment
1. Deploy to 10% of production traffic
2. Monitor errors and performance
3. Gradually increase to 50%, then 100%

### Phase 3: Full Production
1. Complete rollout
2. Monitor for 48 hours
3. Performance optimization based on real data

---

## Next Steps

### Immediate Actions (This Week)
1. ✅ Set up Vitest and write first 10 API tests
2. ✅ Configure Sentry error monitoring
3. ✅ Enable Vercel Analytics

### Short-Term Actions (Next 2 Weeks)
1. Complete API testing suite (all 119 endpoints)
2. Implement rate limiting
3. Add security headers

### Long-Term Actions (Next 2 Months)
1. Complete all P3, P4, P5 enhancements
2. Performance optimization based on production metrics
3. Developer documentation finalization

---

**Plan Created:** November 23, 2025  
**Status:** Ready for Execution  
**Next Review:** After Phase 19 completion (Week 2)
