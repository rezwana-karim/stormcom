#!/usr/bin/env node
/**
 * GitHub Project Setup Script
 * 
 * This script documents the setup of GitHub Project #7 for StormCom:
 * - Labels to create in the repository
 * - Milestones for each phase
 * - Issues from the planning documents
 * 
 * The actual creation is done via GitHub MCP tools or the GitHub CLI.
 * This script serves as documentation and can be used with @octokit/rest if installed.
 * 
 * Usage: node scripts/github-project-setup.js
 */

// Try to load @octokit/rest, fall back to dry-run mode if not available
let Octokit;
try {
  Octokit = require("@octokit/rest").Octokit;
} catch (e) {
  Octokit = null;
}

// Configuration
const OWNER = "CodeStorm-Hub";
const REPO = "stormcomui";
const PROJECT_NUMBER = 7;

// Label definitions
const LABELS = [
  // Priority labels
  { name: "priority: P0", description: "Critical - Must have for MVP", color: "d73a4a" },
  { name: "priority: P1", description: "High - Core functionality", color: "fb8500" },
  { name: "priority: P2", description: "Medium - Enhancement", color: "ffd60a" },
  { name: "priority: P3", description: "Low - Nice to have", color: "6c757d" },
  // Type labels
  { name: "type: epic", description: "Epic containing multiple stories", color: "7209b7" },
  { name: "type: story", description: "User story with acceptance criteria", color: "4895ef" },
  { name: "type: task", description: "Technical implementation task", color: "4cc9f0" },
  { name: "type: research", description: "Research or investigation task", color: "f72585" },
  // Phase labels
  { name: "phase: 0", description: "Phase 0: Foundation Assessment", color: "808080" },
  { name: "phase: 1", description: "Phase 1: Lifecycle & Security Foundation", color: "0a9396" },
  { name: "phase: 1.5", description: "Phase 1.5: Bangladesh Market Features", color: "029688" },
  { name: "phase: 2", description: "Phase 2: External Website Integration", color: "005f73" },
  { name: "phase: 3", description: "Phase 3: Multi-Channel Sales", color: "94d2bd" },
  { name: "phase: 4", description: "Phase 4: Marketing Automation", color: "ee9b00" },
  { name: "phase: 5", description: "Phase 5: Advanced Reliability", color: "ca6702" },
  // Status labels
  { name: "status: blocked", description: "Issue is blocked by dependencies", color: "d90429" },
  { name: "status: needs-review", description: "Issue needs review or feedback", color: "ffb703" },
  { name: "status: ready", description: "Issue is ready for development", color: "06ffa5" },
  // Category labels
  { name: "area: auth", description: "Authentication and authorization", color: "0969da" },
  { name: "area: database", description: "Database schema and migrations", color: "1f6feb" },
  { name: "area: api", description: "API endpoints and services", color: "238636" },
  { name: "area: ui", description: "User interface components", color: "a371f7" },
  { name: "area: payments", description: "Payment processing integration", color: "d4a72c" },
  { name: "area: inventory", description: "Inventory management", color: "7c3aed" },
  { name: "area: orders", description: "Order management", color: "2da44e" },
  { name: "area: marketing", description: "Marketing automation", color: "cf222e" },
  { name: "area: performance", description: "Performance optimization", color: "bf8700" },
  { name: "area: security", description: "Security and permissions", color: "da3633" },
  { name: "area: observability", description: "Logging, monitoring, tracing", color: "6e7781" },
  { name: "area: i18n", description: "Internationalization", color: "54aeff" },
  { name: "area: storefront", description: "Public storefront features", color: "e85aad" },
  { name: "area: bangladesh", description: "Bangladesh market specific", color: "12b76a" },
];

// Helper function to calculate due dates dynamically
function calculateDueDate(weeksFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + (weeksFromNow * 7));
  return date.toISOString();
}

// Milestone definitions with dynamic due dates
const MILESTONES = [
  {
    title: "Phase 0: Foundation Assessment",
    description: "Codebase audit, schema validation, MVP scope definition",
    due_on: calculateDueDate(2), // 2 weeks from now
  },
  {
    title: "Phase 1: E-Commerce Core (MVP)",
    description: "Product management, storefront, checkout, orders, Stripe payments",
    due_on: calculateDueDate(8), // 6 weeks after Phase 0
  },
  {
    title: "Phase 1.5: Bangladesh Features",
    description: "bKash integration, Bengali localization, Pathao shipping",
    due_on: calculateDueDate(12), // 4 weeks after Phase 1
  },
  {
    title: "Phase 2: External Integration",
    description: "WordPress plugin, REST API for external integrations",
    due_on: calculateDueDate(16), // 4 weeks after Phase 1.5
  },
  {
    title: "Phase 3: Multi-Channel Sales",
    description: "Facebook Shop, Instagram Shopping integration",
    due_on: calculateDueDate(22), // 6 weeks after Phase 2
  },
  {
    title: "Phase 4: Marketing Automation",
    description: "Multi-channel campaigns, SMS/WhatsApp, segmentation, analytics",
    due_on: calculateDueDate(31), // 9 weeks after Phase 3
  },
  {
    title: "Phase 5: Advanced Reliability",
    description: "Event sourcing, workflow orchestration, fraud detection, predictive models",
    due_on: calculateDueDate(40), // 9 weeks after Phase 4
  },
];

// Issue definitions - based on GITHUB_ISSUES_PLAN_V2.md
const ISSUES = [
  // Phase 0 Issues
  {
    title: "[Phase 0] Complete Codebase Audit",
    phase: "phase: 0",
    priority: "priority: P0",
    type: "type: task",
    estimate: 3,
    epic: "Codebase Audit & Gap Analysis",
    milestone: "Phase 0: Foundation Assessment",
    labels: ["area: database", "area: api"],
    body: `## Context
Review all existing models and API routes to understand current implementation state.

## Acceptance Criteria
- [ ] All 50+ API routes categorized (implemented/stubbed/missing)
- [ ] Database schema completeness report (what's built vs needed)
- [ ] Multi-tenancy test results documented
- [ ] Gap analysis shared with team

## Implementation Notes
- Review prisma/schema.sqlite.prisma for existing models
- Check src/app/api/ directory for route structure
- Test existing authentication flow end-to-end
- Validate multi-tenancy isolation

## Estimate
3 days

## Dependencies
None

## Reference
- docs/IMPLEMENTATION_STATUS_AND_ROADMAP.md (partially complete)
`,
  },
  {
    title: "[Phase 0] Database Schema Validation & Fixes",
    phase: "phase: 0",
    priority: "priority: P0",
    type: "type: task",
    estimate: 2,
    epic: "Codebase Audit & Gap Analysis",
    milestone: "Phase 0: Foundation Assessment",
    labels: ["area: database"],
    body: `## Context
Validate existing Product, Order, Customer, Store models and add missing indexes/relations.

## Acceptance Criteria
- [ ] All e-commerce models have storeId foreign key
- [ ] Missing indexes added (category.slug, product.sku, etc.)
- [ ] ProductImage and ProductVariant relations validated
- [ ] Migration script tested on clean database
- [ ] No breaking changes to existing auth models

## Dependencies
- #1 Complete Codebase Audit

## Reference
- docs/research/database_schema_analysis.md
- prisma/schema.sqlite.prisma

## Estimate
2 days
`,
  },
  {
    title: "[Phase 0] MVP Scope Definition",
    phase: "phase: 0",
    priority: "priority: P0",
    type: "type: task",
    estimate: 2,
    epic: "Codebase Audit & Gap Analysis",
    milestone: "Phase 0: Foundation Assessment",
    labels: [],
    body: `## Context
Define strict 2-month MVP scope based on market validation needs.

## Acceptance Criteria
- [ ] MVP feature list finalized (max 20 features)
- [ ] Non-MVP features deferred to Phase 6+
- [ ] Stakeholder sign-off on MVP scope
- [ ] Timeline adjusted for 2-month delivery

## Dependencies
- #1 Complete Codebase Audit

## Reference
- docs/PROJECT_PLAN.md
- docs/EXECUTIVE_SUMMARY.md

## Estimate
2 days
`,
  },

  // Phase 1 Issues
  {
    title: "[Phase 1] Epic: Product Management",
    phase: "phase: 1",
    priority: "priority: P0",
    type: "type: epic",
    estimate: 0,
    epic: "Product Management",
    milestone: "Phase 1: E-Commerce Core (MVP)",
    labels: ["area: api", "area: ui", "area: database"],
    body: `## Overview
Implement complete product management functionality leveraging existing schema (80% built).

## Child Issues
- Implement Product CRUD API
- Product Dashboard UI
- Inventory Management

## Success Metrics
- Product list shows 50+ products with good performance
- CSV import endpoint working for 1000+ products
- Low stock alerts functional

## Dependencies
- Phase 0 completion

## Estimate
12 days total
`,
  },
  {
    title: "[Phase 1] Implement Product CRUD API",
    phase: "phase: 1",
    priority: "priority: P0",
    type: "type: story",
    estimate: 4,
    epic: "Product Management",
    milestone: "Phase 1: E-Commerce Core (MVP)",
    labels: ["area: api", "area: database"],
    body: `## Context
Implement logic in existing /api/products/* routes. Schema already exists, need business logic.

## Acceptance Criteria
- [ ] POST /api/products creates product with variants
- [ ] GET /api/products filters by storeId automatically
- [ ] PUT /api/products/[id] updates product
- [ ] DELETE /api/products/[id] soft deletes
- [ ] CSV import endpoint working for 1000+ products
- [ ] Image upload integrated (Vercel Blob or Cloudinary)

## Implementation Notes
- Use existing Product, ProductVariant models from Prisma schema
- Implement repository pattern for tenant scoping
- Add validation with Zod schemas

## Dependencies
- Phase 0 database validation

## Reference
- src/app/api/products/route.ts (stub exists)
- docs/research/api_refactor_plan.md

## Estimate
4 days
`,
  },
  {
    title: "[Phase 1] Product Dashboard UI",
    phase: "phase: 1",
    priority: "priority: P0",
    type: "type: story",
    estimate: 5,
    epic: "Product Management",
    milestone: "Phase 1: E-Commerce Core (MVP)",
    labels: ["area: ui"],
    body: `## Context
Build product management interface using existing shadcn-ui components.

## Acceptance Criteria
- [ ] Product list shows 50+ products with good performance
- [ ] Create form validates all required fields
- [ ] Variant management UI (add/remove variants)
- [ ] Image upload with preview and reordering
- [ ] Bulk actions work for 100+ selected products

## Implementation Notes
- Convert existing /projects page to /dashboard/products
- Use DataTable component from shadcn-ui
- Implement drag-and-drop for image reordering

## Dependencies
- Product CRUD API implementation

## Reference
- src/components/data-table.tsx (existing)
- docs/research/ui_ux_improvements.md

## Estimate
5 days
`,
  },
  {
    title: "[Phase 1] Inventory Management",
    phase: "phase: 1",
    priority: "priority: P0",
    type: "type: story",
    estimate: 3,
    epic: "Product Management",
    milestone: "Phase 1: E-Commerce Core (MVP)",
    labels: ["area: inventory", "area: api"],
    body: `## Context
Implement inventory tracking per product/variant with adjustment logging.

## Acceptance Criteria
- [ ] Inventory decrements on order
- [ ] Inventory adjustment API with reason codes
- [ ] Low stock alert (when qty < threshold)
- [ ] Inventory history log with user tracking

## Implementation Notes
- InventoryLog model already exists
- Implement inventoryService.adjust() wrapper
- Add reservation logic for checkout flow

## Dependencies
- Product CRUD API

## Reference
- prisma/schema.sqlite.prisma (InventoryLog exists)
- docs/research/implementation_plan.md

## Estimate
3 days
`,
  },
  {
    title: "[Phase 1] Epic: Storefront",
    phase: "phase: 1",
    priority: "priority: P0",
    type: "type: epic",
    estimate: 0,
    epic: "Storefront",
    milestone: "Phase 1: E-Commerce Core (MVP)",
    labels: ["area: storefront", "area: ui"],
    body: `## Overview
Build dynamic storefront per store with subdomain routing.

## Child Issues
- Dynamic Subdomain Routing
- Storefront Template #1 (Basic)
- Shopping Cart & Checkout Flow

## Success Metrics
- Subdomain routing works (vendor.stormcom.app)
- Mobile responsive storefront
- SEO meta tags for all pages

## Dependencies
- Product Management

## Estimate
15 days total
`,
  },
  {
    title: "[Phase 1] Dynamic Subdomain Routing",
    phase: "phase: 1",
    priority: "priority: P0",
    type: "type: story",
    estimate: 4,
    epic: "Storefront",
    milestone: "Phase 1: E-Commerce Core (MVP)",
    labels: ["area: storefront"],
    body: `## Context
Implement middleware for subdomain detection and store loading.

## Acceptance Criteria
- [ ] Middleware detects subdomain and loads store
- [ ] Store data available in all storefront routes
- [ ] Custom domain CNAME configuration works
- [ ] Proper 404 for non-existent stores
- [ ] Works locally with hosts file setup

## Implementation Notes
- Extend existing middleware.ts
- Use Next.js middleware + headers for subdomain routing
- Add subdomain field to Store model if needed

## Dependencies
- None (can start early)

## Reference
- middleware.ts (exists)
- docs/IMPLEMENTATION_STATUS_AND_ROADMAP.md

## Estimate
4 days
`,
  },
  {
    title: "[Phase 1] Storefront Template #1 (Basic)",
    phase: "phase: 1",
    priority: "priority: P0",
    type: "type: story",
    estimate: 6,
    epic: "Storefront",
    milestone: "Phase 1: E-Commerce Core (MVP)",
    labels: ["area: storefront", "area: ui"],
    body: `## Context
Create first storefront template with basic e-commerce pages.

## Acceptance Criteria
- [ ] Homepage shows store name, logo, featured products
- [ ] Product listing with category filter, search
- [ ] Product detail page shows variants, images, add to cart
- [ ] Cart view with quantity adjustment
- [ ] Mobile responsive (tested on 3 devices)
- [ ] SEO meta tags for all pages

## Implementation Notes
- Create src/app/store/[storeSlug]/ route structure
- Use shadcn-ui components
- Implement static generation with revalidation

## Dependencies
- Dynamic Subdomain Routing
- Product CRUD API

## Reference
- docs/EXTERNAL_WEBSITE_INTEGRATION_PLAN.md

## Estimate
6 days
`,
  },
  {
    title: "[Phase 1] Shopping Cart & Checkout Flow",
    phase: "phase: 1",
    priority: "priority: P0",
    type: "type: story",
    estimate: 5,
    epic: "Storefront",
    milestone: "Phase 1: E-Commerce Core (MVP)",
    labels: ["area: storefront", "area: orders"],
    body: `## Context
Implement cart management and checkout process.

## Acceptance Criteria
- [ ] Add to cart works from product page
- [ ] Cart persists across sessions (database-backed)
- [ ] Checkout collects shipping & billing info
- [ ] Order summary shows correct totals
- [ ] Confirmation email sent on order

## Implementation Notes
- Use Zustand for client-side cart state
- Persist cart to database for logged-in users
- Integrate with Resend for order emails

## Dependencies
- Storefront Template

## Reference
- Cart and Order models exist in schema

## Estimate
5 days
`,
  },
  {
    title: "[Phase 1] Epic: Order Management",
    phase: "phase: 1",
    priority: "priority: P0",
    type: "type: epic",
    estimate: 0,
    epic: "Order Management",
    milestone: "Phase 1: E-Commerce Core (MVP)",
    labels: ["area: orders", "area: api", "area: ui"],
    body: `## Overview
Implement complete order processing workflow.

## Child Issues
- Order Processing API
- Order Dashboard UI

## Success Metrics
- Order creation p95 < 400ms
- Inventory decremented atomically
- Order notifications sent to vendor

## Dependencies
- Storefront & Cart

## Estimate
8 days total
`,
  },
  {
    title: "[Phase 1] Order Processing API",
    phase: "phase: 1",
    priority: "priority: P0",
    type: "type: story",
    estimate: 4,
    epic: "Order Management",
    milestone: "Phase 1: E-Commerce Core (MVP)",
    labels: ["area: orders", "area: api", "area: inventory"],
    body: `## Context
Implement order creation logic with inventory management.

## Acceptance Criteria
- [ ] POST /api/orders creates order with items
- [ ] Inventory decremented atomically
- [ ] Order status updates via PUT /api/orders/[id]/status
- [ ] Refund API integrated with payment gateway
- [ ] Order notifications sent to vendor

## Implementation Notes
- Use Prisma transaction for atomic operations
- Implement order number generation
- Add idempotency key support

## Dependencies
- Shopping Cart implementation
- Inventory Management

## Reference
- Order and OrderItem models exist

## Estimate
4 days
`,
  },
  {
    title: "[Phase 1] Order Dashboard UI",
    phase: "phase: 1",
    priority: "priority: P0",
    type: "type: story",
    estimate: 4,
    epic: "Order Management",
    milestone: "Phase 1: E-Commerce Core (MVP)",
    labels: ["area: orders", "area: ui"],
    body: `## Context
Build order management interface for vendors.

## Acceptance Criteria
- [ ] Order list shows 100+ orders performantly
- [ ] Filter by status, date range, customer
- [ ] Order detail shows customer, items, payments
- [ ] Mark as fulfilled button updates status
- [ ] Refund button with amount input

## Dependencies
- Order Processing API

## Reference
- Existing admin dashboard components

## Estimate
4 days
`,
  },
  {
    title: "[Phase 1] Epic: Payment Integration",
    phase: "phase: 1",
    priority: "priority: P0",
    type: "type: epic",
    estimate: 0,
    epic: "Payment Integration",
    milestone: "Phase 1: E-Commerce Core (MVP)",
    labels: ["area: payments"],
    body: `## Overview
Integrate Stripe for payment processing (MVP).

## Child Issues
- Stripe Payment Integration

## Success Metrics
- Successful payment creates order
- Webhook updates order status
- Test mode works with test cards

## Dependencies
- Order Management

## Estimate
5 days total
`,
  },
  {
    title: "[Phase 1] Stripe Payment Integration",
    phase: "phase: 1",
    priority: "priority: P0",
    type: "type: story",
    estimate: 5,
    epic: "Payment Integration",
    milestone: "Phase 1: E-Commerce Core (MVP)",
    labels: ["area: payments"],
    body: `## Context
Integrate Stripe Checkout for payment processing.

## Acceptance Criteria
- [ ] Stripe Checkout loads on checkout page
- [ ] Successful payment creates order
- [ ] Webhook updates order status
- [ ] Failed payments handled gracefully
- [ ] Test mode works with test cards
- [ ] Stripe Dashboard link in admin panel

## Implementation Notes
- Create src/lib/payments/stripe.ts
- Implement webhook handler at /api/webhooks/stripe
- Store Stripe payment intent ID in Order

## Dependencies
- Order Processing API

## Reference
- docs/research/cost_optimization.md (payment processor fees)

## Estimate
5 days
`,
  },

  // Phase 1.5 Issues - Bangladesh Features
  {
    title: "[Phase 1.5] Epic: Bangladesh Payment Methods",
    phase: "phase: 1.5",
    priority: "priority: P0",
    type: "type: epic",
    estimate: 0,
    epic: "Bangladesh Payment Methods",
    milestone: "Phase 1.5: Bangladesh Features",
    labels: ["area: payments", "area: bangladesh"],
    body: `## Overview
Integrate Bangladesh-specific payment methods.

## Child Issues
- bKash Payment Gateway Integration
- Cash on Delivery (COD) Option

## Success Metrics
- bKash checkout working in sandbox
- COD orders tracked separately
- 60%+ COD usage supported

## Dependencies
- Phase 1 Payment Integration

## Estimate
8 days total
`,
  },
  {
    title: "[Phase 1.5] bKash Payment Gateway Integration",
    phase: "phase: 1.5",
    priority: "priority: P0",
    type: "type: story",
    estimate: 6,
    epic: "Bangladesh Payment Methods",
    milestone: "Phase 1.5: Bangladesh Features",
    labels: ["area: payments", "area: bangladesh"],
    body: `## Context
Integrate bKash Merchant API for Bangladesh market.

## Acceptance Criteria
- [ ] bKash checkout button on payment page
- [ ] Redirect to bKash app/web
- [ ] Callback processes payment status
- [ ] Order marked as paid on success
- [ ] Refund API tested
- [ ] Works with bKash sandbox

## Implementation Notes
- Create src/lib/payments/bkash.ts
- Implement OAuth flow for authentication
- Handle webhook/callback for payment status
- Requires bKash merchant account (2-3 weeks approval)

## Dependencies
- Stripe Integration (payment abstraction layer)

## Reference
- docs/IMPLEMENTATION_STATUS_AND_ROADMAP.md
- https://developer.bka.sh/

## Estimate
6 days
`,
  },
  {
    title: "[Phase 1.5] Cash on Delivery (COD) Option",
    phase: "phase: 1.5",
    priority: "priority: P1",
    type: "type: story",
    estimate: 2,
    epic: "Bangladesh Payment Methods",
    milestone: "Phase 1.5: Bangladesh Features",
    labels: ["area: payments", "area: bangladesh"],
    body: `## Context
Implement COD as payment method (60% of Bangladesh orders).

## Acceptance Criteria
- [ ] COD selectable at checkout
- [ ] Order created with "COD" payment method
- [ ] Dashboard shows COD orders separately
- [ ] Email indicates COD payment

## Dependencies
- Order Processing API

## Reference
- Bangladesh market requirement (60% COD usage)

## Estimate
2 days
`,
  },
  {
    title: "[Phase 1.5] Bengali Localization Infrastructure",
    phase: "phase: 1.5",
    priority: "priority: P1",
    type: "type: story",
    estimate: 4,
    epic: "Bengali Language Support",
    milestone: "Phase 1.5: Bangladesh Features",
    labels: ["area: i18n", "area: bangladesh", "area: ui"],
    body: `## Context
Set up i18n infrastructure for Bengali language support.

## Acceptance Criteria
- [ ] Language switcher in header
- [ ] All dashboard UI translated
- [ ] Storefront translated (template 1)
- [ ] Numbers show in Bengali numerals (optional)
- [ ] Dates formatted per locale

## Implementation Notes
- Use next-intl or similar library
- Create bn.json translation file
- Add language preference to user settings

## Dependencies
- Product Dashboard UI
- Storefront Template

## Reference
- docs/GITHUB_ISSUES_PLAN.md Issue #57-60 (i18n)

## Estimate
4 days
`,
  },
  {
    title: "[Phase 1.5] Pathao Courier Integration",
    phase: "phase: 1.5",
    priority: "priority: P1",
    type: "type: story",
    estimate: 5,
    epic: "Local Shipping Integration",
    milestone: "Phase 1.5: Bangladesh Features",
    labels: ["area: orders", "area: bangladesh"],
    body: `## Context
Integrate Pathao API for Bangladesh shipping.

## Acceptance Criteria
- [ ] "Send via Pathao" button on order page
- [ ] Parcel created in Pathao system
- [ ] Tracking number saved to order
- [ ] Shipping cost shown at checkout (estimate)
- [ ] Delivery status updates order

## Implementation Notes
- Create src/lib/shipping/pathao.ts
- Implement OAuth for Pathao API
- Add shipping settings per store
- Requires Pathao merchant account

## Dependencies
- Order Dashboard UI

## Reference
- docs/IMPLEMENTATION_STATUS_AND_ROADMAP.md
- https://pathao.com/merchant-api/

## Estimate
5 days
`,
  },

  // Phase 2 Issues - External Integration
  {
    title: "[Phase 2] Epic: WordPress Plugin",
    phase: "phase: 2",
    priority: "priority: P1",
    type: "type: epic",
    estimate: 0,
    epic: "WordPress Plugin Development",
    milestone: "Phase 2: External Integration",
    labels: [],
    body: `## Overview
Develop WordPress/WooCommerce plugin for product and order sync.

## Child Issues
- WordPress Plugin Core
- WordPress Product Sync
- WordPress Order Sync (Bidirectional)

## Success Metrics
- Plugin installs and activates
- Products sync automatically
- Orders sync bidirectionally

## Dependencies
- Phase 1 completion

## Estimate
16 days total
`,
  },
  {
    title: "[Phase 2] WordPress Plugin Core",
    phase: "phase: 2",
    priority: "priority: P1",
    type: "type: story",
    estimate: 6,
    epic: "WordPress Plugin Development",
    milestone: "Phase 2: External Integration",
    labels: [],
    body: `## Context
Create WordPress plugin scaffold with settings and API authentication.

## Acceptance Criteria
- [ ] Plugin installs and activates
- [ ] Settings page with API key input
- [ ] Connection test button validates API key
- [ ] Error logs accessible in admin
- [ ] WordPress.org submission ready

## Implementation Notes
- PHP plugin development
- Use WordPress Settings API
- Implement secure API key storage

## Dependencies
- None (can start early)

## Reference
- docs/EXTERNAL_WEBSITE_INTEGRATION_PLAN.md

## Estimate
6 days
`,
  },
  {
    title: "[Phase 2] External Integration API v1",
    phase: "phase: 2",
    priority: "priority: P1",
    type: "type: story",
    estimate: 4,
    epic: "REST API for External Integrations",
    milestone: "Phase 2: External Integration",
    labels: ["area: api"],
    body: `## Context
Create REST API for external system integrations.

## Acceptance Criteria
- [ ] All endpoints documented (OpenAPI/Swagger)
- [ ] API key generated per store
- [ ] Rate limit: 1000 requests/hour per key
- [ ] Postman collection provided
- [ ] Example code (PHP, JavaScript, Python)

## Endpoints
- POST /api/external/products (create/update)
- POST /api/external/orders (create order)
- GET /api/external/inventory (check stock)
- PUT /api/external/inventory (update stock)

## Dependencies
- Product CRUD API
- Order Processing API

## Reference
- docs/EXTERNAL_WEBSITE_INTEGRATION_PLAN.md

## Estimate
4 days
`,
  },

  // Phase 3 Issues - Multi-Channel
  {
    title: "[Phase 3] Epic: Facebook Shop Integration",
    phase: "phase: 3",
    priority: "priority: P1",
    type: "type: epic",
    estimate: 0,
    epic: "Facebook Shop Integration",
    milestone: "Phase 3: Multi-Channel Sales",
    labels: [],
    body: `## Overview
Integrate Facebook Shop for product catalog and order sync.

## Child Issues
- Facebook Graph API Integration
- Instagram Shopping Integration

## Success Metrics
- Products sync to Facebook catalog
- Facebook orders appear in StormCom
- Messages forwarded to vendor

## Dependencies
- Phase 2 External API

## Estimate
12 days total
`,
  },
  {
    title: "[Phase 3] Facebook Graph API Integration",
    phase: "phase: 3",
    priority: "priority: P1",
    type: "type: story",
    estimate: 7,
    epic: "Facebook Shop Integration",
    milestone: "Phase 3: Multi-Channel Sales",
    labels: [],
    body: `## Context
Integrate Facebook Graph API for Shop and order sync.

## Acceptance Criteria
- [ ] "Connect Facebook" button in dashboard
- [ ] OAuth redirects and connects page
- [ ] Products sync to Facebook catalog
- [ ] Facebook orders appear in StormCom
- [ ] Messages forwarded to vendor

## Implementation Notes
- Create Facebook App in developer portal
- Implement OAuth flow
- Set up webhook endpoints
- Handle order events

## Dependencies
- Product CRUD API
- Order Processing API

## Reference
- docs/EXTERNAL_WEBSITE_INTEGRATION_PLAN.md

## Estimate
7 days
`,
  },
  {
    title: "[Phase 3] Instagram Shopping Integration",
    phase: "phase: 3",
    priority: "priority: P1",
    type: "type: story",
    estimate: 5,
    epic: "Facebook Shop Integration",
    milestone: "Phase 3: Multi-Channel Sales",
    labels: [],
    body: `## Context
Extend Facebook integration for Instagram Shopping.

## Acceptance Criteria
- [ ] Instagram account connected
- [ ] Products available for tagging
- [ ] Instagram orders sync to StormCom
- [ ] Shopping links work in stories

## Dependencies
- Facebook Graph API Integration

## Reference
- docs/EXTERNAL_WEBSITE_INTEGRATION_PLAN.md

## Estimate
5 days
`,
  },

  // Phase 4 Issues - Marketing Automation (Enhanced)
  {
    title: "[Phase 4] Epic: Marketing Automation",
    phase: "phase: 4",
    priority: "priority: P1",
    type: "type: epic",
    estimate: 0,
    epic: "Marketing Automation",
    milestone: "Phase 4: Marketing Automation",
    labels: ["area: marketing"],
    body: `## Overview
Implement comprehensive multi-channel marketing automation.

## Child Issues
- Cart & Marketing Campaign Tables
- Campaign Builder & Template System
- Abandoned Cart Recovery Workflow
- SMS Gateway Integration (Bangladesh)
- WhatsApp Business API Integration
- Churn Risk Win-Back Campaign
- Campaign Analytics Dashboard
- Bangladesh-Specific Features

## Success Metrics
- Cart recovery > 20%
- SMS delivery > 95%
- WhatsApp engagement > 60%
- Campaign ROI > 3:1

## Dependencies
- Phase 3 completion
- Customer Segmentation

## Reference
- docs/research/MARKETING_AUTOMATION_V2.md

## Estimate
38 days total
`,
  },
  {
    title: "[Phase 4] Cart & Marketing Campaign Tables",
    phase: "phase: 4",
    priority: "priority: P1",
    type: "type: story",
    estimate: 5,
    epic: "Marketing Automation",
    milestone: "Phase 4: Marketing Automation",
    labels: ["area: marketing", "area: database"],
    body: `## Context
Create database models for cart tracking and marketing campaigns.

## Models to Create
- Cart, CartItem
- MarketingCampaign, CampaignTemplate
- EmailCampaign, SMSCampaign, WhatsAppCampaign
- EmailEvent, SMSEvent, WhatsAppEvent

## Acceptance Criteria
- [ ] Cart tables created with proper indexes
- [ ] MarketingCampaign table supports multiple channel types
- [ ] CampaignTemplate table with 50+ Bangladesh-specific templates
- [ ] Event webhook ingestion configured
- [ ] Campaign status tracking (draft, scheduled, sent, completed)

## Dependencies
- Phase 3 completion

## Reference
- docs/research/MARKETING_AUTOMATION_V2.md
- docs/research/codebase_feature_gap_analysis.md section 19

## Estimate
5 days
`,
  },
  {
    title: "[Phase 4] Abandoned Cart Recovery Workflow",
    phase: "phase: 4",
    priority: "priority: P1",
    type: "type: story",
    estimate: 5,
    epic: "Marketing Automation",
    milestone: "Phase 4: Marketing Automation",
    labels: ["area: marketing"],
    body: `## Context
Implement automated cart abandonment detection and recovery.

## Acceptance Criteria
- [ ] Abandoned cart detection job (configurable: 30m, 1h, 3h, 24h)
- [ ] Multi-channel templates with cart item personalization
- [ ] Automatic channel selection (WhatsApp → SMS → Email)
- [ ] Recovery tracking with revenue attribution
- [ ] Recovery rate > 12% (stretch: 20%+)
- [ ] Discount code generation for recovery campaigns

## Implementation Notes
- Create cron job for cart inactivity detection
- Implement personalized message templates
- Track conversion with attribution

## Dependencies
- Cart & Marketing Campaign Tables

## Reference
- docs/research/MARKETING_AUTOMATION_V2.md section 7.1

## Estimate
5 days
`,
  },
  {
    title: "[Phase 4] SMS Gateway Integration (Bangladesh)",
    phase: "phase: 4",
    priority: "priority: P1",
    type: "type: story",
    estimate: 4,
    epic: "Marketing Automation",
    milestone: "Phase 4: Marketing Automation",
    labels: ["area: marketing", "area: bangladesh"],
    body: `## Context
Integrate Bangladesh SMS gateways for marketing campaigns.

## Acceptance Criteria
- [ ] SMS gateway abstraction layer supporting multiple providers
- [ ] SSL Wireless integration (primary)
- [ ] SMS credit purchase via bKash/Nagad
- [ ] Credit packages: 500, 1000, 5000, 10000 SMS
- [ ] Delivery status tracking (sent, delivered, failed)
- [ ] Bangla text support with proper encoding
- [ ] SMS length calculator (160 chars standard, 70 chars Bangla)

## Implementation Notes
- Create src/lib/marketing/sms/
- Implement provider abstraction
- Add credit management system

## Dependencies
- Cart & Marketing Campaign Tables

## Reference
- docs/research/MARKETING_AUTOMATION_V2.md section 3.2

## Estimate
4 days
`,
  },
  {
    title: "[Phase 4] WhatsApp Business API Integration",
    phase: "phase: 4",
    priority: "priority: P1",
    type: "type: story",
    estimate: 5,
    epic: "Marketing Automation",
    milestone: "Phase 4: Marketing Automation",
    labels: ["area: marketing"],
    body: `## Context
Integrate WhatsApp Business API for marketing messages.

## Acceptance Criteria
- [ ] WhatsApp Business API connection setup
- [ ] Template submission and approval workflow UI
- [ ] Rich media attachment support (images up to 5MB)
- [ ] Interactive message builder (buttons, lists, quick replies)
- [ ] Delivery status tracking (sent, delivered, read)
- [ ] Conversation 24-hour window management
- [ ] Product catalog integration for shopping messages

## Dependencies
- Cart & Marketing Campaign Tables

## Reference
- docs/research/MARKETING_AUTOMATION_V2.md section 6.2

## Estimate
5 days
`,
  },
  {
    title: "[Phase 4] Campaign Analytics Dashboard",
    phase: "phase: 4",
    priority: "priority: P1",
    type: "type: story",
    estimate: 5,
    epic: "Marketing Automation",
    milestone: "Phase 4: Marketing Automation",
    labels: ["area: marketing", "area: ui"],
    body: `## Context
Build comprehensive campaign analytics and ROI tracking.

## Acceptance Criteria
- [ ] Real-time metrics (sent, delivered, opened, clicked, converted)
- [ ] Channel comparison charts (SMS vs WhatsApp vs Email)
- [ ] Revenue attribution per campaign
- [ ] ROI calculator (cost vs revenue)
- [ ] Customer journey visualization
- [ ] Export functionality (CSV, PDF, Excel)
- [ ] Date range filtering and comparison

## Dependencies
- Marketing campaign tables
- SMS/WhatsApp integrations

## Reference
- docs/research/MARKETING_AUTOMATION_V2.md section 8

## Estimate
5 days
`,
  },

  // Phase 5 Issues - Advanced Reliability
  {
    title: "[Phase 5] Epic: Event Sourcing Core",
    phase: "phase: 5",
    priority: "priority: P2",
    type: "type: epic",
    estimate: 0,
    epic: "Event Sourcing Core Entities",
    milestone: "Phase 5: Advanced Reliability",
    labels: [],
    body: `## Overview
Implement event sourcing for inventory and orders.

## Child Issues
- Inventory Projection Rebuild Script
- Order State Replay Capability

## Success Metrics
- Data inconsistency < 0.5%
- Event replay success 100%

## Dependencies
- Phase 4 completion

## Estimate
8 days total
`,
  },
  {
    title: "[Phase 5] Inventory Projection Rebuild Script",
    phase: "phase: 5",
    priority: "priority: P2",
    type: "type: task",
    estimate: 3,
    epic: "Event Sourcing Core Entities",
    milestone: "Phase 5: Advanced Reliability",
    labels: ["area: inventory"],
    body: `## Context
Build script to rebuild Product.inventoryQty from events.

## Acceptance Criteria
- [ ] Rebuild script created
- [ ] Verification logic
- [ ] Tests ensure accuracy

## Dependencies
- InventoryAdjustment table (Phase 1)

## Estimate
3 days
`,
  },
  {
    title: "[Phase 5] Fraud Assessment Pipeline",
    phase: "phase: 5",
    priority: "priority: P2",
    type: "type: story",
    estimate: 6,
    epic: "Fraud Assessment",
    milestone: "Phase 5: Advanced Reliability",
    labels: ["area: security", "area: orders"],
    body: `## Context
Implement rule-based fraud detection for orders.

## Acceptance Criteria
- [ ] FraudAssessment table created
- [ ] Scoring service with rules (velocity, address mismatch, high value)
- [ ] Orders flagged automatically
- [ ] Review queue UI
- [ ] Fraud detection accuracy > 90%

## Dependencies
- Phase 4 completion

## Reference
- docs/research/threat_model.md

## Estimate
6 days
`,
  },
];

async function main() {
  const token = process.env.GITHUB_TOKEN;
  
  if (!token || !Octokit) {
    console.log("=".repeat(60));
    console.log("GitHub Project Setup Script - DRY RUN MODE");
    console.log("=".repeat(60));
    if (!Octokit) {
      console.log("\n@octokit/rest not installed. Running in dry-run mode.");
      console.log("To install: npm install @octokit/rest");
    }
    if (!token) {
      console.log("\nNo GITHUB_TOKEN provided.");
      console.log("To execute with token:");
      console.log("  GITHUB_TOKEN=your_token node scripts/github-project-setup.js\n");
    }
    
    console.log("\n--- LABELS TO CREATE ---");
    console.log(`Total: ${LABELS.length} labels\n`);
    LABELS.forEach(l => console.log(`  [${l.color}] ${l.name}: ${l.description}`));
    
    console.log("\n--- MILESTONES TO CREATE ---");
    console.log(`Total: ${MILESTONES.length} milestones\n`);
    MILESTONES.forEach(m => console.log(`  ${m.title}\n    Due: ${m.due_on}\n    ${m.description}\n`));
    
    console.log("\n--- ISSUES TO CREATE ---");
    console.log(`Total: ${ISSUES.length} issues\n`);
    
    // Group by phase
    const byPhase = {};
    ISSUES.forEach(i => {
      const phase = i.phase.replace("phase: ", "Phase ");
      if (!byPhase[phase]) byPhase[phase] = [];
      byPhase[phase].push(i);
    });
    
    Object.entries(byPhase).forEach(([phase, issues]) => {
      console.log(`\n${phase} (${issues.length} issues):`);
      issues.forEach(i => {
        const priority = i.priority.replace("priority: ", "");
        const type = i.type.replace("type: ", "");
        console.log(`  [${priority}] [${type}] ${i.title}`);
        if (i.estimate > 0) console.log(`       Estimate: ${i.estimate} days`);
      });
    });
    
    // Calculate totals
    const totalDays = ISSUES.reduce((sum, i) => sum + (i.estimate || 0), 0);
    const p0Count = ISSUES.filter(i => i.priority === "priority: P0").length;
    const p1Count = ISSUES.filter(i => i.priority === "priority: P1").length;
    const p2Count = ISSUES.filter(i => i.priority === "priority: P2").length;
    
    console.log("\n--- SUMMARY ---");
    console.log(`Total Issues: ${ISSUES.length}`);
    console.log(`Total Estimated Days: ${totalDays}`);
    console.log(`P0 (Critical): ${p0Count}`);
    console.log(`P1 (High): ${p1Count}`);
    console.log(`P2 (Medium): ${p2Count}`);
    
    console.log("\n" + "=".repeat(60));
    console.log("Dry run complete. No changes made to GitHub.");
    console.log("=".repeat(60));
    console.log("\nTo create these items, use GitHub MCP tools or GitHub CLI.");
    console.log("See docs/GITHUB_PROJECT_SETUP_GUIDE.md for instructions.");
    return;
  }

  const octokit = new Octokit({ auth: token });
  
  console.log("=".repeat(60));
  console.log("GitHub Project Setup Script");
  console.log("=".repeat(60));
  console.log(`\nRepository: ${OWNER}/${REPO}`);
  console.log(`Project: #${PROJECT_NUMBER}`);
  
  // Step 1: Create Labels
  console.log("\n--- Creating Labels ---");
  for (const label of LABELS) {
    try {
      await octokit.issues.createLabel({
        owner: OWNER,
        repo: REPO,
        name: label.name,
        color: label.color,
        description: label.description,
      });
      console.log(`✓ Created label: ${label.name}`);
    } catch (error) {
      if (error.status === 422) {
        // Label already exists, try to update it
        try {
          await octokit.issues.updateLabel({
            owner: OWNER,
            repo: REPO,
            name: label.name,
            color: label.color,
            description: label.description,
          });
          console.log(`↻ Updated label: ${label.name}`);
        } catch (updateError) {
          console.log(`⚠ Skipped label (exists): ${label.name}`);
        }
      } else {
        console.error(`✗ Failed to create label: ${label.name}`, error.message);
      }
    }
  }
  
  // Step 2: Create Milestones
  console.log("\n--- Creating Milestones ---");
  const milestoneMap = {};
  for (const milestone of MILESTONES) {
    try {
      const result = await octokit.issues.createMilestone({
        owner: OWNER,
        repo: REPO,
        title: milestone.title,
        description: milestone.description,
        due_on: milestone.due_on,
      });
      milestoneMap[milestone.title] = result.data.number;
      console.log(`✓ Created milestone: ${milestone.title} (#${result.data.number})`);
    } catch (error) {
      if (error.status === 422) {
        // Milestone already exists, find it
        try {
          const existing = await octokit.issues.listMilestones({
            owner: OWNER,
            repo: REPO,
            state: "open",
          });
          const found = existing.data.find(m => m.title === milestone.title);
          if (found) {
            milestoneMap[milestone.title] = found.number;
            console.log(`↻ Using existing milestone: ${milestone.title} (#${found.number})`);
          }
        } catch (listError) {
          console.error(`✗ Failed to find milestone: ${milestone.title}`);
        }
      } else {
        console.error(`✗ Failed to create milestone: ${milestone.title}`, error.message);
      }
    }
  }
  
  // Step 3: Create Issues
  console.log("\n--- Creating Issues ---");
  for (const issue of ISSUES) {
    try {
      const labels = [issue.phase, issue.priority, issue.type, ...(issue.labels || [])];
      const milestoneNumber = milestoneMap[issue.milestone];
      
      const result = await octokit.issues.create({
        owner: OWNER,
        repo: REPO,
        title: issue.title,
        body: issue.body,
        labels: labels,
        milestone: milestoneNumber,
      });
      console.log(`✓ Created issue #${result.data.number}: ${issue.title}`);
      
      // Check rate limit headers and adjust delay accordingly
      const remaining = parseInt(result.headers['x-ratelimit-remaining'] || '100', 10);
      const delay = remaining < 10 ? 2000 : remaining < 30 ? 1000 : 200;
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      console.error(`✗ Failed to create issue: ${issue.title}`, error.message);
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("Setup complete!");
  console.log("=".repeat(60));
  console.log(`\nNext steps:`);
  console.log(`1. Visit https://github.com/orgs/${OWNER}/projects/${PROJECT_NUMBER}`);
  console.log(`2. Add issues to the project`);
  console.log(`3. Configure project views (Board, Table, Roadmap)`);
  console.log(`4. Set up automation workflows`);
}

main().catch(console.error);
