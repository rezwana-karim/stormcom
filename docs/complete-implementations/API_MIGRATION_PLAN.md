# StormCom API Migration Plan

**Date**: November 18, 2025
**Source**: `f:\codestorm\codestorm\stormcom-old\stormcom`
**Target**: `f:\codestorm\codestorm\stormcom-ui\stormcom`

## Executive Summary

Comprehensive migration of **75+ API endpoints** across **20 categories** from stormcom-old to stormcom-ui while preserving existing UI components and authentication.

---

## API Inventory

### 📊 Total APIs to Migrate: 75+

#### 1. **Analytics APIs** (5 endpoints)
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/sales` - Sales analytics
- `GET /api/analytics/revenue` - Revenue analytics
- `GET /api/analytics/products` - Product analytics
- `GET /api/analytics/customers` - Customer analytics

#### 2. **Attributes APIs** (5 endpoints)
- `GET /api/attributes` - List product attributes
- `POST /api/attributes` - Create attribute
- `GET /api/attributes/[id]` - Get attribute
- `PATCH /api/attributes/[id]` - Update attribute
- `DELETE /api/attributes/[id]` - Delete attribute

#### 3. **Audit Logs API** (1 endpoint)
- `GET /api/audit-logs` - Get audit logs

#### 4. **Brands APIs** (5 endpoints)
- `GET /api/brands` - List brands
- `POST /api/brands` - Create brand
- `GET /api/brands/[slug]` - Get brand
- `PATCH /api/brands/[slug]` - Update brand
- `DELETE /api/brands/[slug]` - Delete brand

#### 5. **Bulk Operations APIs** (4 endpoints)
- `POST /api/bulk/products/import` - Import products
- `GET /api/bulk/products/export` - Export products
- `POST /api/bulk/categories/import` - Import categories
- `GET /api/bulk/categories/export` - Export categories

#### 6. **Categories APIs** (6 endpoints)
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `GET /api/categories/tree` - Category tree
- `GET /api/categories/[slug]` - Get category
- `PATCH /api/categories/[slug]` - Update category
- `DELETE /api/categories/[slug]` - Delete category

#### 7. **Checkout APIs** (4 endpoints)
- `POST /api/checkout/initialize` - Initialize checkout
- `PATCH /api/checkout/[id]/address` - Update address
- `PATCH /api/checkout/[id]/shipping` - Select shipping
- `POST /api/checkout/[id]/complete` - Complete checkout

#### 8. **CSRF Token API** (1 endpoint)
- `GET /api/csrf-token` - Get CSRF token

#### 9. **Documentation API** (1 endpoint)
- `GET /api/docs` - Swagger UI

#### 10. **Emails API** (1 endpoint)
- `POST /api/emails/send` - Send email

#### 11. **GDPR APIs** (4 endpoints)
- `GET /api/gdpr/consent` - Get consent status
- `POST /api/gdpr/consent` - Update consent
- `POST /api/gdpr/export` - Request data export
- `POST /api/gdpr/delete` - Request data deletion

#### 12. **Integrations APIs** (4 endpoints)
- `GET /api/integrations/shopify/connect` - Shopify OAuth
- `POST /api/integrations/shopify/export` - Export to Shopify
- `GET /api/integrations/mailchimp/connect` - Mailchimp OAuth
- `POST /api/integrations/mailchimp/sync` - Sync to Mailchimp
- `POST /api/integrations/[platform]/disconnect` - Disconnect

#### 13. **Inventory APIs** (2 endpoints)
- `GET /api/inventory` - Get inventory
- `POST /api/inventory/adjust` - Adjust stock

#### 14. **Notifications API** (1 endpoint)
- `GET /api/notifications` - Get notifications

#### 15. **Orders APIs** (2 endpoints)
- `GET /api/orders` - List orders
- `GET /api/orders/[id]` - Get order details

#### 16. **Products APIs** (13 endpoints)
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/products/[id]` - Get product
- `PATCH /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product
- `GET /api/products/[id]/stock` - Get stock
- `PATCH /api/products/[id]/stock` - Update stock
- `GET /api/products/[id]/variants` - Get variants
- `POST /api/products/[id]/variants` - Create variant
- `PATCH /api/products/[id]/reviews` - Update reviews
- `POST /api/products/import` - Import products
- `GET /api/products/export` - Export products
- `GET /api/products/search` - Search products

#### 17. **Stores APIs** (5 endpoints)
- `GET /api/stores` - List stores
- `POST /api/stores` - Create store
- `GET /api/stores/[id]` - Get store
- `PUT /api/stores/[id]` - Update store
- `DELETE /api/stores/[id]` - Delete store
- `GET /api/stores/[id]/admins` - List admins
- `POST /api/stores/[id]/admins` - Add admin
- `DELETE /api/stores/[id]/admins` - Remove admin
- `PUT /api/stores/[id]/theme` - Update theme
- `DELETE /api/stores/[id]/theme` - Delete theme

#### 18. **Subscriptions APIs** (2 endpoints)
- `POST /api/subscriptions` - Create checkout session
- `GET /api/subscriptions/[storeId]` - Get subscription
- `POST /api/subscriptions/[storeId]/cancel` - Cancel subscription

#### 19. **Themes API** (1 endpoint)
- `GET /api/themes` - Get theme config

#### 20. **Webhooks API** (1 endpoint)
- `POST /api/webhooks/stripe` - Stripe webhook handler
- `POST /api/webhooks/stripe/subscription` - Subscription webhook

---

## Migration Strategy

### Phase 1: Foundation (Database & Services)
**Priority**: CRITICAL
**Dependencies**: None

#### Tasks:
1. ✅ Review and extend Prisma schema
2. ✅ Migrate core service utilities
3. ✅ Set up lib/services directory structure
4. ✅ Configure environment variables

#### Files to Migrate:
- `prisma/schema.prisma` → Extend with e-commerce models
- `src/lib/prisma.ts` → Already exists, verify singleton
- `src/lib/utils.ts` → Already exists, extend as needed
- `src/services/*` → Migrate all service modules

---

### Phase 2: Core E-commerce APIs
**Priority**: HIGH
**Dependencies**: Phase 1

#### 2A: Product Management
- Products APIs (13 endpoints)
- Attributes APIs (5 endpoints)
- Categories APIs (6 endpoints)
- Brands APIs (5 endpoints)

#### 2B: Store Management
- Stores APIs (5 endpoints)
- Themes API (1 endpoint)

---

### Phase 3: Business Logic APIs
**Priority**: HIGH
**Dependencies**: Phase 2

#### 3A: Order & Checkout
- Orders APIs (2 endpoints)
- Checkout APIs (4 endpoints)
- Inventory APIs (2 endpoints)

#### 3B: Analytics
- Analytics APIs (5 endpoints)
- Audit Logs API (1 endpoint)

---

### Phase 4: Integration & Webhooks
**Priority**: MEDIUM
**Dependencies**: Phase 2, Phase 3

#### Tasks:
- Integrations APIs (4 endpoints)
- Webhooks APIs (2 endpoints)
- Subscriptions APIs (2 endpoints)

---

### Phase 5: Supporting Features
**Priority**: MEDIUM
**Dependencies**: Phase 2

#### Tasks:
- Bulk Operations APIs (4 endpoints)
- Emails API (1 endpoint)
- Notifications API (1 endpoint)
- GDPR APIs (4 endpoints)
- CSRF Token API (1 endpoint)
- Documentation API (1 endpoint)

---

### Phase 6: UI Pages & Components
**Priority**: HIGH
**Dependencies**: Phases 2-5

#### Pages to Create/Update:
1. **Products**
   - `/dashboard/products` - Product listing
   - `/dashboard/products/new` - Create product
   - `/dashboard/products/[id]` - Edit product
   - `/dashboard/products/import` - Bulk import
   - `/dashboard/categories` - Category management
   - `/dashboard/brands` - Brand management

2. **Orders**
   - `/dashboard/orders` - Order listing
   - `/dashboard/orders/[id]` - Order details

3. **Inventory**
   - `/dashboard/inventory` - Stock management

4. **Analytics**
   - `/dashboard/analytics` - Analytics dashboard
   - `/dashboard/analytics/sales` - Sales reports
   - `/dashboard/analytics/products` - Product performance

5. **Store Management**
   - `/dashboard/store/settings` - Store settings
   - `/dashboard/store/theme` - Theme customization
   - `/dashboard/store/admins` - Admin management

6. **Integrations**
   - `/dashboard/integrations` - Integration hub
   - `/dashboard/integrations/shopify` - Shopify integration
   - `/dashboard/integrations/mailchimp` - Mailchimp integration

7. **Subscriptions**
   - `/dashboard/billing` - Already exists, extend with subscriptions

8. **Compliance**
   - `/dashboard/settings/privacy` - GDPR settings
   - `/dashboard/audit-logs` - Audit log viewer

#### Components to Create:
- `product-form.tsx` - Product creation/editing
- `product-table.tsx` - Product listing table
- `category-tree.tsx` - Category hierarchy
- `order-table.tsx` - Order listing
- `order-details.tsx` - Order detail view
- `analytics-charts.tsx` - Chart components
- `inventory-tracker.tsx` - Stock tracking
- `integration-card.tsx` - Integration cards
- `subscription-plans.tsx` - Plan comparison

---

## Technical Implementation Details

### Prisma Schema Extensions Needed

```prisma
// Add to existing schema.sqlite.prisma

// E-commerce enums
enum ProductStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}

enum OrderStatus {
  PENDING
  PAID
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELED
  REFUNDED
}

// Store model (maps to Organization)
model Store {
  id                String   @id @default(cuid())
  organizationId    String   @unique
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  name              String
  slug              String   @unique
  description       String?
  logo              String?
  email             String
  phone             String?
  
  // Subscription
  subscriptionPlan  String   @default("FREE")
  subscriptionStatus String  @default("ACTIVE")
  
  products          Product[]
  categories        Category[]
  brands            Brand[]
  orders            Order[]
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model Product {
  id          String        @id @default(cuid())
  storeId     String
  store       Store         @relation(fields: [storeId], references: [id], onDelete: Cascade)
  
  name        String
  slug        String
  description String?
  price       Float
  status      ProductStatus @default(DRAFT)
  
  categoryId  String?
  category    Category?     @relation(fields: [categoryId], references: [id])
  brandId     String?
  brand       Brand?        @relation(fields: [brandId], references: [id])
  
  stock       Int           @default(0)
  sku         String?
  
  variants    ProductVariant[]
  orderItems  OrderItem[]
  
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  
  @@unique([storeId, slug])
  @@index([storeId, status])
}

// Additional models: Category, Brand, Order, OrderItem, etc.
```

### API Route Structure

```
src/app/api/
├── products/
│   ├── route.ts                    # GET, POST
│   ├── [id]/
│   │   ├── route.ts                # GET, PATCH, DELETE
│   │   ├── stock/route.ts          # GET, PATCH
│   │   └── variants/route.ts       # GET, POST
│   ├── import/route.ts             # POST
│   ├── export/route.ts             # GET
│   └── search/route.ts             # GET
├── categories/
│   ├── route.ts                    # GET, POST
│   ├── tree/route.ts               # GET
│   └── [slug]/route.ts             # GET, PATCH, DELETE
├── brands/
│   ├── route.ts                    # GET, POST
│   └── [slug]/route.ts             # GET, PATCH, DELETE
├── orders/
│   ├── route.ts                    # GET
│   └── [id]/route.ts               # GET
├── checkout/
│   ├── initialize/route.ts         # POST
│   └── [id]/
│       ├── address/route.ts        # PATCH
│       ├── shipping/route.ts       # PATCH
│       └── complete/route.ts       # POST
├── stores/
│   ├── route.ts                    # GET, POST
│   └── [id]/
│       ├── route.ts                # GET, PUT, DELETE
│       ├── theme/route.ts          # PUT, DELETE
│       └── admins/route.ts         # GET, POST, DELETE
└── [... other APIs ...]
```

### Service Layer Structure

```
src/services/
├── products/
│   ├── product.service.ts
│   ├── category.service.ts
│   ├── brand.service.ts
│   └── attribute.service.ts
├── orders/
│   ├── order.service.ts
│   ├── checkout.service.ts
│   └── inventory.service.ts
├── stores/
│   ├── store.service.ts
│   └── theme.service.ts
├── analytics/
│   └── analytics.service.ts
├── integrations/
│   ├── shopify.service.ts
│   └── mailchimp.service.ts
└── webhooks/
    └── stripe.service.ts
```

---

## Migration Checklist

### Pre-Migration
- [x] Backup stormcom-ui project
- [x] Document current state
- [x] Review existing UI components
- [ ] Set up development environment
- [ ] Initialize Next.js DevTools MCP

### Phase 1: Foundation
- [ ] Extend Prisma schema with all e-commerce models
- [ ] Run migrations
- [ ] Generate Prisma client
- [ ] Migrate core services
- [ ] Set up environment variables

### Phase 2: Core APIs
- [ ] Migrate Products APIs (13)
- [ ] Migrate Attributes APIs (5)
- [ ] Migrate Categories APIs (6)
- [ ] Migrate Brands APIs (5)
- [ ] Migrate Stores APIs (5)
- [ ] Migrate Themes API (1)

### Phase 3: Business Logic
- [ ] Migrate Orders APIs (2)
- [ ] Migrate Checkout APIs (4)
- [ ] Migrate Inventory APIs (2)
- [ ] Migrate Analytics APIs (5)
- [ ] Migrate Audit Logs API (1)

### Phase 4: Integrations
- [ ] Migrate Integrations APIs (4)
- [ ] Migrate Webhooks APIs (2)
- [ ] Migrate Subscriptions APIs (2)

### Phase 5: Supporting Features
- [ ] Migrate Bulk Operations APIs (4)
- [ ] Migrate Emails API (1)
- [ ] Migrate Notifications API (1)
- [ ] Migrate GDPR APIs (4)
- [ ] Migrate CSRF Token API (1)
- [ ] Migrate Documentation API (1)

### Phase 6: UI Implementation
- [ ] Create product management pages
- [ ] Create order management pages
- [ ] Create inventory pages
- [ ] Create analytics dashboard
- [ ] Create store settings pages
- [ ] Create integrations pages
- [ ] Create billing/subscription pages
- [ ] Create compliance pages

### Testing & Validation
- [ ] Test all API endpoints
- [ ] Validate multi-tenancy isolation
- [ ] Test UI flows
- [ ] Browser automation testing
- [ ] Type checking
- [ ] Linting
- [ ] Build validation

---

## Risk Assessment

### High Risk
1. **Data Model Complexity**: Large schema migration with many relations
2. **Multi-Tenancy**: Must preserve data isolation
3. **Breaking Changes**: Existing UI must not be affected

### Medium Risk
1. **API Dependencies**: Some APIs depend on others
2. **Third-party Integrations**: Shopify, Mailchimp, Stripe
3. **Performance**: Large data sets, complex queries

### Low Risk
1. **Supporting Features**: CSRF, Docs, Emails
2. **UI Components**: Using existing shadcn-ui primitives

---

## Success Criteria

- ✅ All 75+ APIs migrated and functional
- ✅ Existing UI components preserved
- ✅ Authentication working (NextAuth)
- ✅ Multi-tenancy properly isolated
- ✅ Type-safe (0 TypeScript errors)
- ✅ Lint-clean (0 ESLint errors)
- ✅ Successful build
- ✅ All routes accessible
- ✅ Browser automation tests pass

---

## Timeline Estimate

- **Phase 1**: 2-3 hours
- **Phase 2**: 4-5 hours
- **Phase 3**: 3-4 hours
- **Phase 4**: 2-3 hours
- **Phase 5**: 2-3 hours
- **Phase 6**: 5-6 hours
- **Testing**: 2-3 hours

**Total**: ~20-27 hours

---

## Notes

- Preserve existing authentication (NextAuth)
- Do not modify existing UI layouts
- Use shadcn-ui for new components
- Follow Next.js 16 best practices
- Use MCP tools for implementation guidance
- Create backups before deleting any files
- Test incrementally after each phase

---

**Generated**: November 18, 2025
**Status**: Planning Phase
