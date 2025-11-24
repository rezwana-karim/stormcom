# GitHub Project Issues Plan - Version 2.0

## Overview
This document outlines the updated structured issues to be created in the GitHub Project at https://github.com/orgs/CodeStorm-Hub/projects/7

**Updates Based On**:
- Implementation Status Analysis (IMPLEMENTATION_STATUS_AND_ROADMAP.md)
- External Website Integration Plan (EXTERNAL_WEBSITE_INTEGRATION_PLAN.md)
- Existing Codebase Review (60-80% auth/multi-tenancy already built)
- Bangladesh Market Requirements

**Key Findings**:
- ✅ Authentication & Multi-tenancy: 60-80% complete
- ✅ Database Schema: E-commerce models already exist
- ❌ E-commerce Core Logic: 0% complete (API routes exist but not implemented)
- ❌ Storefront: 0% complete
- ❌ Bangladesh Features: 0% complete
- ❌ External Website Integration: 0% complete

---

## Issue Structure Template

Each issue should include:
- **Title**: Clear, actionable description
- **Labels**: priority (P0/P1/P2), type (epic/story/task), phase (0-5)
- **Milestone**: Phase milestone
- **Assignee**: Team member(s)
- **Description**: Context, acceptance criteria, dependencies
- **Linked PRs**: Associated pull requests
- **Status**: Not Started / In Progress / Complete

---

## Phase 0: Foundation Assessment & MVP Preparation (Weeks 1-2)

### Epic: Codebase Audit & Gap Analysis

#### Issue #0.1: Complete Codebase Audit
- **Priority**: P0
- **Type**: Task
- **Phase**: 0
- **Estimate**: 3 days
- **Description**:
  - Review all existing models in prisma/schema.sqlite.prisma
  - Document which API routes are stubbed vs implemented
  - Test existing authentication flow end-to-end
  - Validate multi-tenancy isolation
  - Create gap analysis document
- **Acceptance Criteria**:
  - [ ] All 50+ API routes categorized (implemented/stubbed/missing)
  - [ ] Database schema completeness report (what's built vs needed)
  - [ ] Multi-tenancy test results documented
  - [ ] Gap analysis shared with team
- **Dependencies**: None
- **Current Status**: ✅ Partially complete (see IMPLEMENTATION_STATUS_AND_ROADMAP.md)

#### Issue #0.2: Database Schema Validation & Fixes
- **Priority**: P0
- **Type**: Task
- **Phase**: 0
- **Estimate**: 2 days
- **Description**:
  - Validate existing Product, Order, Customer, Store models
  - Add missing indexes for performance
  - Add missing relations (ProductImage, ProductVariant properly linked)
  - Ensure all models have storeId for multi-tenancy
  - Add missing fields identified in gap analysis
- **Acceptance Criteria**:
  - [ ] All e-commerce models have storeId foreign key
  - [ ] Missing indexes added (category.slug, product.sku, etc.)
  - [ ] ProductImage and ProductVariant relations validated
  - [ ] Migration script tested on clean database
  - [ ] No breaking changes to existing auth models
- **Dependencies**: #0.1
- **Reference**: docs/research/database_schema_analysis.md

#### Issue #0.3: MVP Scope Definition
- **Priority**: P0
- **Type**: Task
- **Phase**: 0
- **Estimate**: 2 days
- **Description**:
  - Define strict 2-month MVP scope
  - Prioritize features based on market validation needs
  - Create feature freeze list
  - Identify which Phase 1-5 issues are MVP vs post-MVP
- **Acceptance Criteria**:
  - [ ] MVP feature list finalized (max 20 features)
  - [ ] Non-MVP features deferred to Phase 6+
  - [ ] Stakeholder sign-off on MVP scope
  - [ ] Timeline adjusted for 2-month delivery
- **Dependencies**: #0.1

---

## Phase 1: E-Commerce Core (MVP Foundation) (Weeks 3-8)

**Timeline**: 6 weeks (adjusted from original)  
**Focus**: Get basic storefront + products + orders working with Stripe

### Epic: Product Management (Already 80% Schema Built)

#### Issue #1.1: Implement Product CRUD API
- **Priority**: P0
- **Type**: Story
- **Phase**: 1
- **Estimate**: 4 days
- **Description**:
  - Implement logic in existing /api/products/* routes
  - Product creation with variants, attributes, images
  - Bulk product import via CSV
  - Product search and filtering
  - Multi-tenant isolation (filter by storeId)
- **Acceptance Criteria**:
  - [ ] POST /api/products creates product with variants
  - [ ] GET /api/products filters by storeId automatically
  - [ ] PUT /api/products/[id] updates product
  - [ ] DELETE /api/products/[id] soft deletes
  - [ ] CSV import endpoint working for 1000+ products
  - [ ] Image upload integrated (Vercel Blob or Cloudinary)
- **Dependencies**: #0.2
- **Current Status**: ❌ Routes exist but not implemented
- **Reference**: src/app/api/products/route.ts (stub exists)

#### Issue #1.2: Product Dashboard UI
- **Priority**: P0
- **Type**: Story
- **Phase**: 1
- **Estimate**: 5 days
- **Description**:
  - Product list page with search, filters, pagination
  - Product create/edit form with variant support
  - Image upload with drag-and-drop
  - Bulk actions (delete, publish, archive)
  - Product preview
- **Acceptance Criteria**:
  - [ ] Product list shows 50+ products with good performance
  - [ ] Create form validates all required fields
  - [ ] Variant management UI (add/remove variants)
  - [ ] Image upload with preview and reordering
  - [ ] Bulk actions work for 100+ selected products
- **Dependencies**: #1.1
- **Reference**: Template from shadcn-ui data-table

#### Issue #1.3: Inventory Management
- **Priority**: P0
- **Type**: Story
- **Phase**: 1
- **Estimate**: 3 days
- **Description**:
  - Implement inventory tracking per product/variant
  - Inventory adjustment interface
  - Low stock alerts
  - Inventory log/history
- **Acceptance Criteria**:
  - [ ] Inventory decrements on order
  - [ ] Inventory adjustment API with reason codes
  - [ ] Low stock alert (when qty < threshold)
  - [ ] Inventory history log with user tracking
- **Dependencies**: #1.1
- **Reference**: InventoryLog model already exists

---

### Epic: Storefront (Dynamic Site per Store)

#### Issue #1.4: Dynamic Subdomain Routing
- **Priority**: P0
- **Type**: Story
- **Phase**: 1
- **Estimate**: 4 days
- **Description**:
  - Implement middleware for subdomain detection
  - Load store by subdomain (vendor.stormcom.app)
  - Custom domain support (vendor.com)
  - 404 for invalid subdomains
- **Acceptance Criteria**:
  - [ ] Middleware detects subdomain and loads store
  - [ ] Store data available in all storefront routes
  - [ ] Custom domain CNAME configuration works
  - [ ] Proper 404 for non-existent stores
  - [ ] Works locally with hosts file setup
- **Dependencies**: None
- **Reference**: middleware.ts, Organization/Store model
- **Technical Notes**: Use Next.js middleware + headers for subdomain routing

#### Issue #1.5: Storefront Template #1 (Basic)
- **Priority**: P0
- **Type**: Story
- **Phase**: 1
- **Estimate**: 6 days
- **Description**:
  - Create first storefront template
  - Homepage with featured products
  - Product listing page with filters
  - Product detail page
  - Shopping cart
  - Basic header/footer
- **Acceptance Criteria**:
  - [ ] Homepage shows store name, logo, featured products
  - [ ] Product listing with category filter, search
  - [ ] Product detail page shows variants, images, add to cart
  - [ ] Cart view with quantity adjustment
  - [ ] Mobile responsive (tested on 3 devices)
  - [ ] SEO meta tags for all pages
- **Dependencies**: #1.4, #1.1
- **Reference**: docs/EXTERNAL_WEBSITE_INTEGRATION_PLAN.md section on templates

#### Issue #1.6: Shopping Cart & Checkout Flow
- **Priority**: P0
- **Type**: Story
- **Phase**: 1
- **Estimate**: 5 days
- **Description**:
  - Cart management (add, update, remove items)
  - Checkout page (shipping, billing, payment)
  - Order summary and confirmation
  - Email confirmation
- **Acceptance Criteria**:
  - [ ] Add to cart works from product page
  - [ ] Cart persists across sessions (database-backed)
  - [ ] Checkout collects shipping & billing info
  - [ ] Order summary shows correct totals
  - [ ] Confirmation email sent on order
- **Dependencies**: #1.5
- **Reference**: Cart and Order models exist

---

### Epic: Order Management

#### Issue #1.7: Order Processing API
- **Priority**: P0
- **Type**: Story
- **Phase**: 1
- **Estimate**: 4 days
- **Description**:
  - Implement order creation logic
  - Order status transitions (pending → paid → fulfilled)
  - Order validation (inventory check, payment verification)
  - Order cancellation/refund
- **Acceptance Criteria**:
  - [ ] POST /api/orders creates order with items
  - [ ] Inventory decremented atomically
  - [ ] Order status updates via PUT /api/orders/[id]/status
  - [ ] Refund API integrated with payment gateway
  - [ ] Order notifications sent to vendor
- **Dependencies**: #1.1, #1.6
- **Reference**: Order and OrderItem models exist

#### Issue #1.8: Order Dashboard UI
- **Priority**: P0
- **Type**: Story
- **Phase**: 1
- **Estimate**: 4 days
- **Description**:
  - Order list with filters (status, date, customer)
  - Order detail view
  - Order fulfillment interface
  - Refund interface
- **Acceptance Criteria**:
  - [ ] Order list shows 100+ orders performantly
  - [ ] Filter by status, date range, customer
  - [ ] Order detail shows customer, items, payments
  - [ ] Mark as fulfilled button updates status
  - [ ] Refund button with amount input
- **Dependencies**: #1.7
- **Reference**: Existing admin dashboard components

---

### Epic: Payment Integration (Stripe MVP)

#### Issue #1.9: Stripe Payment Integration
- **Priority**: P0
- **Type**: Story
- **Phase**: 1
- **Estimate**: 5 days
- **Description**:
  - Stripe Checkout integration
  - Webhook handler for payment events
  - Payment status tracking
  - Test mode and live mode toggle
- **Acceptance Criteria**:
  - [ ] Stripe Checkout loads on checkout page
  - [ ] Successful payment creates order
  - [ ] Webhook updates order status
  - [ ] Failed payments handled gracefully
  - [ ] Test mode works with test cards
  - [ ] Stripe Dashboard link in admin panel
- **Dependencies**: #1.7
- **Reference**: docs/research/cost_optimization.md (payment processor fees)

---

## Phase 1.5: Bangladesh Market Features (Weeks 9-12)

**Timeline**: 4 weeks  
**Focus**: bKash, Bengali language, COD, local shipping

### Epic: Bangladesh Payment Methods

#### Issue #1.10: bKash Payment Gateway Integration
- **Priority**: P0
- **Type**: Story
- **Phase**: 1.5
- **Estimate**: 6 days
- **Description**:
  - bKash Merchant API integration
  - Create payment → redirect → callback flow
  - Payment verification
  - Refund support
  - Test environment setup
- **Acceptance Criteria**:
  - [ ] bKash checkout button on payment page
  - [ ] Redirect to bKash app/web
  - [ ] Callback processes payment status
  - [ ] Order marked as paid on success
  - [ ] Refund API tested
  - [ ] Works with bKash sandbox
- **Dependencies**: #1.9
- **Reference**: docs/IMPLEMENTATION_STATUS_AND_ROADMAP.md
- **Technical Notes**: Requires bKash merchant account application (2-3 weeks)

#### Issue #1.11: Cash on Delivery (COD) Option
- **Priority**: P1
- **Type**: Story
- **Phase**: 1.5
- **Estimate**: 2 days
- **Description**:
  - COD payment method option
  - Order confirmation without payment
  - COD marking on order dashboard
  - COD-specific email template
- **Acceptance Criteria**:
  - [ ] COD selectable at checkout
  - [ ] Order created with "COD" payment method
  - [ ] Dashboard shows COD orders separately
  - [ ] Email indicates COD payment
- **Dependencies**: #1.7
- **Reference**: Bangladesh market requirement (60% COD usage)

---

### Epic: Bengali Language Support

#### Issue #1.12: Bengali Localization Infrastructure
- **Priority**: P1
- **Type**: Story
- **Phase**: 1.5
- **Estimate**: 4 days
- **Description**:
  - i18n setup (next-intl or similar)
  - Bengali translations for core UI
  - Language switcher
  - RTL-aware layouts (future-proof)
  - Number/date formatting (Bengali)
- **Acceptance Criteria**:
  - [ ] Language switcher in header
  - [ ] All dashboard UI translated
  - [ ] Storefront translated (template 1)
  - [ ] Numbers show in Bengali numerals (optional)
  - [ ] Dates formatted per locale
- **Dependencies**: #1.2, #1.5
- **Reference**: docs/GITHUB_ISSUES_PLAN.md Issue #57-60 (i18n)

---

### Epic: Local Shipping Integration

#### Issue #1.13: Pathao Courier Integration
- **Priority**: P1
- **Type**: Story
- **Phase**: 1.5
- **Estimate**: 5 days
- **Description**:
  - Pathao API integration
  - Create parcel API
  - Tracking number capture
  - Shipping cost calculation
  - Delivery status webhook
- **Acceptance Criteria**:
  - [ ] "Send via Pathao" button on order page
  - [ ] Parcel created in Pathao system
  - [ ] Tracking number saved to order
  - [ ] Shipping cost shown at checkout (estimate)
  - [ ] Delivery status updates order
- **Dependencies**: #1.8
- **Reference**: docs/IMPLEMENTATION_STATUS_AND_ROADMAP.md
- **Technical Notes**: Requires Pathao merchant account

---

## Phase 2: External Website Integration (Weeks 13-16)

**Timeline**: 4 weeks  
**Focus**: WordPress plugin, API integration for existing websites

### Epic: WordPress Plugin Development

#### Issue #2.1: WordPress Plugin Core
- **Priority**: P1
- **Type**: Story
- **Phase**: 2
- **Estimate**: 6 days
- **Description**:
  - WordPress plugin scaffold
  - Settings page (API key, sync options)
  - API authentication
  - Error logging and debugging
- **Acceptance Criteria**:
  - [ ] Plugin installs and activates
  - [ ] Settings page with API key input
  - [ ] Connection test button validates API key
  - [ ] Error logs accessible in admin
  - [ ] WordPress.org submission ready
- **Dependencies**: None (can start early)
- **Reference**: docs/EXTERNAL_WEBSITE_INTEGRATION_PLAN.md

#### Issue #2.2: WordPress Product Sync
- **Priority**: P1
- **Type**: Story
- **Phase**: 2
- **Estimate**: 5 days
- **Description**:
  - Sync WooCommerce products to StormCom
  - Product create/update hooks
  - Image upload
  - Bulk sync interface
  - Sync status dashboard
- **Acceptance Criteria**:
  - [ ] New WooCommerce product auto-syncs
  - [ ] Product updates trigger sync
  - [ ] Images uploaded to StormCom
  - [ ] Bulk sync button for existing products
  - [ ] Sync status shows success/failure per product
- **Dependencies**: #2.1, #1.1
- **Reference**: docs/EXTERNAL_WEBSITE_INTEGRATION_PLAN.md (WordPress plugin code)

#### Issue #2.3: WordPress Order Sync (Bidirectional)
- **Priority**: P1
- **Type**: Story
- **Phase**: 2
- **Estimate**: 5 days
- **Description**:
  - WooCommerce order → StormCom (when created)
  - StormCom order → WooCommerce (from other channels)
  - Order status sync
  - Prevent duplicate orders
- **Acceptance Criteria**:
  - [ ] WooCommerce order appears in StormCom dashboard
  - [ ] Facebook order creates WooCommerce order
  - [ ] Order status syncs bidirectionally
  - [ ] Duplicate detection by external_id
  - [ ] Inventory updated on both systems
- **Dependencies**: #2.2, #1.7
- **Reference**: docs/EXTERNAL_WEBSITE_INTEGRATION_PLAN.md

---

### Epic: Generic REST API for External Integrations

#### Issue #2.4: External Integration API v1
- **Priority**: P1
- **Type**: Story
- **Phase**: 2
- **Estimate**: 4 days
- **Description**:
  - POST /api/external/products (create/update)
  - POST /api/external/orders (create order)
  - GET /api/external/inventory (check stock)
  - PUT /api/external/inventory (update stock)
  - API key authentication
  - Rate limiting per integration
- **Acceptance Criteria**:
  - [ ] All endpoints documented (OpenAPI/Swagger)
  - [ ] API key generated per store
  - [ ] Rate limit: 1000 requests/hour per key
  - [ ] Postman collection provided
  - [ ] Example code (PHP, JavaScript, Python)
- **Dependencies**: #1.1, #1.7
- **Reference**: docs/EXTERNAL_WEBSITE_INTEGRATION_PLAN.md

---

## Phase 3: Multi-Channel Sales (Weeks 17-22)

**Timeline**: 6 weeks  
**Focus**: Facebook Shop, Instagram Shopping

### Epic: Facebook Shop Integration

#### Issue #3.1: Facebook Graph API Integration
- **Priority**: P1
- **Type**: Story
- **Phase**: 3
- **Estimate**: 7 days
- **Description**:
  - Facebook App setup
  - OAuth flow for page connection
  - Product catalog sync to Facebook
  - Order webhook from Facebook
  - Message webhook for customer inquiries
- **Acceptance Criteria**:
  - [ ] "Connect Facebook" button in dashboard
  - [ ] OAuth redirects and connects page
  - [ ] Products sync to Facebook catalog
  - [ ] Facebook orders appear in StormCom
  - [ ] Messages forwarded to vendor
- **Dependencies**: #1.1, #1.7
- **Reference**: docs/EXTERNAL_WEBSITE_INTEGRATION_PLAN.md

#### Issue #3.2: Instagram Shopping Integration
- **Priority**: P1
- **Type**: Story
- **Phase**: 3
- **Estimate**: 5 days
- **Description**:
  - Instagram Business account connection
  - Product tagging in posts
  - Instagram orders sync
  - Story shopping links
- **Acceptance Criteria**:
  - [ ] Instagram account connected
  - [ ] Products available for tagging
  - [ ] Instagram orders sync to StormCom
  - [ ] Shopping links work in stories
- **Dependencies**: #3.1
- **Reference**: docs/EXTERNAL_WEBSITE_INTEGRATION_PLAN.md

---

## Phase 4: Marketing Automation (Enhanced) (Weeks 23-31)

**Timeline**: 9 weeks (as per v1.1 plan)  
**Focus**: Multi-channel campaigns, SMS, WhatsApp, email automation

**NOTE**: All Phase 4 issues from GITHUB_ISSUES_PLAN.md (Issues #51-54b) remain as defined in v1.1, with the following additions:

### Epic: Marketing Automation (Additional Issues)

#### Issue #4.10: Vendor Analytics Dashboard
- **Priority**: P1
- **Type**: Story
- **Phase**: 4
- **Estimate**: 5 days
- **Description**:
  - Sales analytics (daily, weekly, monthly)
  - Top products report
  - Customer insights (new vs returning)
  - Traffic sources (Facebook, Instagram, Website, Direct)
  - Revenue breakdown by channel
- **Acceptance Criteria**:
  - [ ] Dashboard shows last 30 days by default
  - [ ] Date range selector
  - [ ] Export to CSV/PDF
  - [ ] Real-time data (< 5 minute lag)
  - [ ] Mobile-responsive charts
- **Dependencies**: #1.7, #3.1, #3.2
- **Reference**: docs/IMPLEMENTATION_STATUS_AND_ROADMAP.md

---

## Summary Statistics (Updated)

### Total Issues by Phase
- **Phase 0**: 3 issues (Foundation Assessment)
- **Phase 1**: 9 issues (E-Commerce Core MVP)
- **Phase 1.5**: 4 issues (Bangladesh Features)
- **Phase 2**: 4 issues (External Website Integration)
- **Phase 3**: 2 issues (Multi-Channel Sales)
- **Phase 4**: 21 issues (Marketing Automation - from v1.1 + 1 new)
- **Phase 5**: 10 issues (Advanced Reliability - from v1.1)
- **Total**: 53 NEW issues + 77 from v1.1 = **130 issues across 25 epics**

### Priority Distribution
- **P0 (Critical)**: 38 issues (25 from v1.1 + 13 new MVP issues)
- **P1 (High)**: 55 issues (42 from v1.1 + 13 new)
- **P2 (Medium)**: 9 issues (unchanged from v1.1)
- **P3 (Low)**: 2 issues (unchanged from v1.1)

### Estimated Timeline
- **Phase 0**: 1 week (foundation assessment)
- **Phase 1**: 6 weeks (E-Commerce Core MVP) - 45 person-days
- **Phase 1.5**: 4 weeks (Bangladesh Features) - 25 person-days
- **Phase 2**: 4 weeks (External Integration) - 28 person-days
- **Phase 3**: 6 weeks (Multi-Channel) - 40 person-days
- **Phase 4**: 9 weeks (Marketing Automation) - 68 person-days (from v1.1)
- **Phase 5**: 9 weeks (Advanced Reliability) - 50 person-days (from v1.1)
- **Total**: ~39 weeks (9.5 months) with 2-3 full-stack engineers

### MVP Timeline (Phase 0 + 1 + 1.5)
- **Total**: 11 weeks (2.5 months)
- **Effort**: 73 person-days
- **Cost**: ~$13,000-$15,000 (2 developers)
- **Outcome**: Market-ready platform for Bangladesh vendors

### Recent Updates (2025-11-24)
- Added Phase 0 for codebase assessment (critical!)
- Restructured Phase 1 based on actual codebase state (60-80% schema exists)
- Added Phase 1.5 for Bangladesh-specific features
- Added Phase 2 for external website integration (WordPress plugin, REST API)
- Added Phase 3 for multi-channel (Facebook/Instagram)
- Maintained Phase 4-5 from v1.1 (marketing automation and reliability)
- Total issues increased from 77 to 130 (+53 issues)
- MVP now clearly defined as Phase 0 + 1 + 1.5 (11 weeks)

---

## Key Insights from Codebase Review

### ✅ What's Already Built (Don't Rebuild)
1. **Database Schema** (80% complete)
   - All e-commerce models exist (Store, Product, Order, Customer, etc.)
   - Multi-tenancy models complete (Organization, Membership, Role)
   - NextAuth models complete (User, Account, Session)

2. **API Routes** (Structure exists, logic missing)
   - 50+ API route files exist in src/app/api/
   - Routes are stubbed but not implemented
   - Need to add business logic to existing routes

3. **Authentication** (90% complete)
   - NextAuth with email magic link working
   - Session management functional
   - Protected route middleware exists

### ❌ What Needs to Be Built (Priority)
1. **API Business Logic** (0%)
   - Product CRUD operations
   - Order processing
   - Inventory management
   - Payment processing

2. **Storefront** (0%)
   - Dynamic subdomain routing
   - Template rendering
   - Shopping cart
   - Checkout flow

3. **Dashboard UI** (20%)
   - Product management interface
   - Order management interface
   - Analytics dashboards
   - Settings pages

4. **Integrations** (0%)
   - Payment gateways (Stripe, bKash)
   - Shipping partners (Pathao)
   - Social media (Facebook, Instagram)
   - External websites (WordPress plugin)

---

## Implementation Strategy

### Sprint 0 (Week 1-2): Foundation
1. Issue #0.1: Complete codebase audit
2. Issue #0.2: Database schema validation
3. Issue #0.3: MVP scope definition

### Sprint 1-3 (Week 3-8): MVP Core
1. Focus on Phase 1 issues #1.1 through #1.9
2. Get basic storefront working
3. Implement Stripe payments
4. Basic order management

### Sprint 4-5 (Week 9-12): Bangladesh Features
1. Phase 1.5 issues #1.10 through #1.13
2. bKash integration
3. Bengali localization
4. Pathao shipping

### Sprint 6-7 (Week 13-16): External Integration
1. Phase 2 issues #2.1 through #2.4
2. WordPress plugin
3. REST API for integrations

### Sprint 8-10 (Week 17-22): Multi-Channel
1. Phase 3 issues #3.1 through #3.2
2. Facebook Shop
3. Instagram Shopping

### Sprint 11-19 (Week 23-31): Marketing Automation
1. Phase 4 issues from v1.1 plus new additions
2. SMS/WhatsApp campaigns
3. Analytics dashboard

### Sprint 20-28 (Week 32-40): Advanced Features
1. Phase 5 issues from v1.1
2. Event sourcing
3. Fraud detection
4. Predictive models

---

## Migration from v1.0 to v2.0

### For Active Projects
1. **Review Phase 0**: New foundation assessment phase is critical
2. **Adjust Phase 1**: Now focused on implementing logic in existing routes
3. **Add Phase 1.5**: Bangladesh features separated for clarity
4. **Add Phase 2**: External website integration is new epic
5. **Add Phase 3**: Multi-channel moved earlier (was in Phase 4)
6. **Phase 4-5**: Mostly unchanged from v1.1

### Quick Wins (Implement First)
1. ✅ Codebase audit (#0.1) - understand what exists
2. ✅ Product CRUD (#1.1) - leverage existing schema
3. ✅ Basic storefront (#1.5) - single template
4. ✅ Stripe payments (#1.9) - fastest to implement
5. ✅ Order dashboard (#1.8) - basic vendor needs

---

## References

### New Documentation
- **IMPLEMENTATION_STATUS_AND_ROADMAP.md** - Current state analysis
- **EXTERNAL_WEBSITE_INTEGRATION_PLAN.md** - Integration architecture

### Existing Documentation
- **GITHUB_ISSUES_PLAN.md** (v1.1) - Original issues
- **PROJECT_PLAN.md** - Strategic roadmap
- **EXECUTIVE_SUMMARY.md** - Stakeholder overview
- **CHANGELOG.md** - Version history

### Codebase
- **prisma/schema.sqlite.prisma** - Database schema (review first!)
- **src/app/api/** - API route structure (50+ routes)
- **src/lib/auth.ts** - NextAuth configuration
- **middleware.ts** - Route protection

---

**Document Version**: 2.0  
**Last Updated**: 2025-11-24  
**Status**: ✅ Ready for Phase 0 Implementation  
**Next Review**: After Phase 0 completion (Week 2)
