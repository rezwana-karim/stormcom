# GitHub Project Issues Plan

## Overview
This document outlines the structured issues to be created in the GitHub Project at https://github.com/orgs/CodeStorm-Hub/projects/7

All issues are derived from comprehensive research documentation in `docs/research/` directory.

---

## Issue Structure Template

Each issue should include:
- **Title**: Clear, actionable description
- **Labels**: priority (P0/P1/P2), type (epic/story/task), phase (1-5)
- **Milestone**: Phase milestone
- **Assignee**: Team member(s)
- **Description**: Context, acceptance criteria, dependencies
- **Linked PRs**: Associated pull requests

---

## Phase 1 Issues: Lifecycle Completeness & Security Foundation

### Epic: Payment & Financial Operations

#### Issue #1: Implement PaymentAttempt Table and Service
- **Priority**: P0
- **Type**: Story
- **Phase**: 1
- **Estimate**: 5 days
- **Description**:
  - Create `PaymentAttempt` Prisma model
  - Migration script for table creation
  - Service layer integration for order pipeline
  - Gateway abstraction (Stripe initial)
  - Track external payment intent IDs
- **Acceptance Criteria**:
  - [ ] PaymentAttempt table created with proper indexes
  - [ ] Service method `createPaymentAttempt()` implemented
  - [ ] All order creations log payment attempt
  - [ ] Gateway abstraction supports multiple providers
  - [ ] Tests cover success/failure scenarios
- **Dependencies**: None
- **Linked Issues**: #2 (Refund), #3 (Idempotency)

#### Issue #2: Implement Refund Table and Workflow
- **Priority**: P0
- **Type**: Story
- **Phase**: 1
- **Estimate**: 4 days
- **Description**:
  - Create `Refund` Prisma model
  - Refund processing service logic
  - Link to PaymentAttempt and Order
  - UI for issuing partial/full refunds
  - Audit logging for refund operations
- **Acceptance Criteria**:
  - [ ] Refund table with status tracking
  - [ ] Service method `issueRefund(orderId, amount, reason)`
  - [ ] UI allows staff to issue refunds with confirmation
  - [ ] Refund audit events logged with correlationId
  - [ ] Tests verify refund amount validation
- **Dependencies**: #1 (PaymentAttempt)
- **Linked Issues**: #20 (Audit Logging)

#### Issue #3: Implement Idempotency Middleware for Orders
- **Priority**: P0
- **Type**: Task
- **Phase**: 1
- **Estimate**: 3 days
- **Description**:
  - Create IdempotentRequest table/cache
  - Middleware to check Idempotency-Key header
  - Cache successful responses (24h TTL)
  - Return cached response on duplicate key
- **Acceptance Criteria**:
  - [ ] IdempotencyKey middleware function created
  - [ ] Applied to POST /api/orders endpoint
  - [ ] Duplicate requests return original response
  - [ ] Tests verify idempotency behavior
- **Dependencies**: #1 (PaymentAttempt)

---

### Epic: Fulfillment & Returns Management

#### Issue #4: Implement Fulfillment Tables
- **Priority**: P0
- **Type**: Story
- **Phase**: 1
- **Estimate**: 4 days
- **Description**:
  - Create `Fulfillment` and `FulfillmentItem` models
  - Support multi-package fulfillments per order
  - Tracking number and carrier fields
  - Status transitions (pending → packed → shipped → delivered)
- **Acceptance Criteria**:
  - [ ] Fulfillment tables with proper relations
  - [ ] Service `createFulfillment(orderId, items[])`
  - [ ] Support partial item fulfillments
  - [ ] Indexes for efficient order lookup
- **Dependencies**: None

#### Issue #5: Implement Return Request Workflow
- **Priority**: P0
- **Type**: Story
- **Phase**: 1
- **Estimate**: 5 days
- **Description**:
  - Create `ReturnRequest` and `ReturnItem` models
  - RMA workflow (requested → approved → received → refunded)
  - Return reason codes
  - UI for customer to initiate returns
  - Staff UI for return approval
- **Acceptance Criteria**:
  - [ ] Return tables created
  - [ ] Service methods for return lifecycle
  - [ ] Customer UI to select items and initiate return
  - [ ] Staff UI to approve/reject returns
  - [ ] Email notifications on status changes
- **Dependencies**: #2 (Refund), #4 (Fulfillment)

#### Issue #6: Fulfillment API Endpoints
- **Priority**: P0
- **Type**: Task
- **Phase**: 1
- **Estimate**: 3 days
- **Description**:
  - POST /api/fulfillments - create fulfillment
  - POST /api/fulfillments/:id/ship - mark shipped
  - POST /api/fulfillments/:id/deliver - mark delivered
  - GET /api/orders/:id/fulfillments - list fulfillments
- **Acceptance Criteria**:
  - [ ] REST endpoints implemented
  - [ ] tRPC procedures created
  - [ ] Permission checks enforced (order.fulfill)
  - [ ] OpenAPI documentation generated
- **Dependencies**: #4 (Fulfillment Tables), #12 (RBAC)

---

### Epic: Inventory Integrity & Reservations

#### Issue #7: Implement InventoryAdjustment Event Table
- **Priority**: P0
- **Type**: Story
- **Phase**: 1
- **Estimate**: 4 days
- **Description**:
  - Create `InventoryAdjustment` model (event sourcing)
  - Reason codes (sale, return, manual, correction, initial)
  - Service wrapper for all inventory changes
  - Replace direct Product.inventoryQty updates
- **Acceptance Criteria**:
  - [ ] InventoryAdjustment table with indexes
  - [ ] Service `adjustInventory(productId, delta, reason, note)`
  - [ ] All inventory operations routed through service
  - [ ] Correlation ID tracking
- **Dependencies**: None

#### Issue #8: Implement StockReservation System
- **Priority**: P0
- **Type**: Story
- **Phase**: 1
- **Estimate**: 5 days
- **Description**:
  - Create `StockReservation` model
  - Reserve inventory during checkout (15min expiry)
  - Atomic decrement transaction on order completion
  - Release reservation on timeout or cancellation
  - Cleanup job for expired reservations
- **Acceptance Criteria**:
  - [ ] StockReservation table created
  - [ ] Service `reserveStock(items[], expiresAt)`
  - [ ] Order service integrates reservation
  - [ ] Cron job cleans up expired reservations
  - [ ] Tests prevent overselling
- **Dependencies**: #7 (InventoryAdjustment)

#### Issue #9: Inventory Reconciliation Job
- **Priority**: P0
- **Type**: Task
- **Phase**: 1
- **Estimate**: 3 days
- **Description**:
  - Nightly job verifying inventory accuracy
  - Formula: `currentQty == initial + Σ(adjustments) - Σ(reservations)`
  - Alert on variance threshold
  - Report generation for variances
- **Acceptance Criteria**:
  - [ ] Cron job created (runs nightly)
  - [ ] Variance calculation logic
  - [ ] Alerting on drift > 0.5%
  - [ ] Dashboard widget showing reconciliation status
- **Dependencies**: #7 (InventoryAdjustment), #8 (StockReservation)

---

### Epic: RBAC & Permission System

#### Issue #10: Implement Permission Tables
- **Priority**: P0
- **Type**: Story
- **Phase**: 1
- **Estimate**: 4 days
- **Description**:
  - Create `Permission`, `RolePermission`, `ApiToken` models
  - Seed initial permission codes (product.read, order.fulfill, etc.)
  - Map existing roles to permission sets
- **Acceptance Criteria**:
  - [ ] Permission tables with unique constraints
  - [ ] Migration creates permission seed data
  - [ ] Role-permission mapping established
  - [ ] ApiToken includes scopes field
- **Dependencies**: None

#### Issue #11: Implement Permission Enforcement Middleware
- **Priority**: P0
- **Type**: Task
- **Phase**: 1
- **Estimate**: 3 days
- **Description**:
  - Middleware function `requirePermissions(codes[])`
  - Permission resolution algorithm (role + token + overrides)
  - Cache permission sets per request context
  - Audit logging for permission denials
- **Acceptance Criteria**:
  - [ ] Middleware function created
  - [ ] Applied to protected endpoints
  - [ ] Unauthorized access returns 403 with clear message
  - [ ] Tests cover various permission scenarios
- **Dependencies**: #10 (Permission Tables)

#### Issue #12: Permission Matrix UI
- **Priority**: P1
- **Type**: Task
- **Phase**: 1
- **Estimate**: 4 days
- **Description**:
  - UI component showing role-permission matrix
  - Toggle permissions per role
  - Diff preview before save
  - Audit trail of permission changes
- **Acceptance Criteria**:
  - [ ] Matrix component implemented
  - [ ] Permission toggles functional
  - [ ] Changes saved atomically
  - [ ] Audit log integration
- **Dependencies**: #10 (Permission Tables), #11 (Middleware)

#### Issue #13: API Token Management
- **Priority**: P1
- **Type**: Story
- **Phase**: 1
- **Estimate**: 3 days
- **Description**:
  - UI to generate API tokens with scopes
  - Token displayed only once on creation
  - Token hash storage (bcrypt)
  - Revocation and expiry support
- **Acceptance Criteria**:
  - [ ] Token generation UI
  - [ ] Scopes selection interface
  - [ ] Token list with last used timestamp
  - [ ] Revoke token button
- **Dependencies**: #10 (Permission Tables)

---

### Epic: Performance Foundation

#### Issue #14: Implement Cache Tags Infrastructure
- **Priority**: P0
- **Type**: Story
- **Phase**: 1
- **Estimate**: 4 days
- **Description**:
  - Cache tag scheme (product:{id}, category:{id}, collection:{id}, etc.)
  - Invalidation hooks on product/category mutations
  - Next.js revalidateTag integration
  - Monitoring cache hit ratio
- **Acceptance Criteria**:
  - [ ] Cache tag helper functions
  - [ ] Invalidation hooks in service layer
  - [ ] Response header `X-Cache: HIT|MISS`
  - [ ] Metric collection for hit ratio
- **Dependencies**: None

#### Issue #15: Create ProductSummary Denormalized Table
- **Priority**: P0
- **Type**: Story
- **Phase**: 1
- **Estimate**: 5 days
- **Description**:
  - Create `ProductSummary` model
  - Denormalized fields (price, status, featured, categorySlug)
  - Background job for initial backfill
  - Trigger/job to keep synchronized
- **Acceptance Criteria**:
  - [ ] ProductSummary table created
  - [ ] Backfill script populates table
  - [ ] Product mutations update summary
  - [ ] Product listing queries use summary
  - [ ] p95 latency < 250ms
- **Dependencies**: #14 (Cache Tags)

#### Issue #16: Implement Correlation ID Middleware
- **Priority**: P0
- **Type**: Task
- **Phase**: 1
- **Estimate**: 2 days
- **Description**:
  - Generate correlationId if not present in request
  - Add to request context
  - Return in response header `X-Correlation-Id`
  - Include in all logs and audit entries
- **Acceptance Criteria**:
  - [ ] Middleware function created
  - [ ] CorrelationId in request context
  - [ ] Response header includes correlationId
  - [ ] Logs include correlationId field
- **Dependencies**: None

#### Issue #17: Structured JSON Logging Setup
- **Priority**: P0
- **Type**: Task
- **Phase**: 1
- **Estimate**: 3 days
- **Description**:
  - Logger utility with structured format
  - Fields: ts, level, cid, storeId, orgId, userId, event, durationMs
  - Sensitive field redaction
  - Log levels (debug, info, warn, error)
- **Acceptance Criteria**:
  - [ ] Logger utility created
  - [ ] All existing console.log replaced
  - [ ] Sensitive fields automatically redacted
  - [ ] Log aggregation configured (Loki/CloudWatch)
- **Dependencies**: #16 (CorrelationId)

#### Issue #18: OpenTelemetry Instrumentation
- **Priority**: P1
- **Type**: Story
- **Phase**: 1
- **Estimate**: 4 days
- **Description**:
  - OpenTelemetry SDK setup
  - Auto-instrumentation (HTTP, Prisma)
  - Manual spans for service methods
  - Prometheus exporter configuration
- **Acceptance Criteria**:
  - [ ] OTEL SDK initialized
  - [ ] Spans created for key operations
  - [ ] Span attributes include storeId, orderId, etc.
  - [ ] Metrics exported to Prometheus
- **Dependencies**: #16 (CorrelationId)

---

### Epic: Security Hardening

#### Issue #19: Implement Repository Pattern
- **Priority**: P0
- **Type**: Story
- **Phase**: 1
- **Estimate**: 5 days
- **Description**:
  - Create repository classes (ProductRepo, OrderRepo, CustomerRepo)
  - Auto-inject tenant scoping (storeId predicate)
  - Soft delete awareness
  - Unit tests verify scoping
- **Acceptance Criteria**:
  - [ ] Repository base class created
  - [ ] Scoped repositories for main entities
  - [ ] Service layer uses repositories exclusively
  - [ ] Lint rule detects direct Prisma usage
- **Dependencies**: None

#### Issue #20: Implement Hash-Chained Audit Logs
- **Priority**: P1
- **Type**: Story
- **Phase**: 1
- **Estimate**: 4 days
- **Description**:
  - Extend AuditLog with prevHash and hash fields
  - Hash chain linking (HMAC with secret)
  - Nightly integrity verification job
  - Immutable append-only enforcement
- **Acceptance Criteria**:
  - [ ] AuditLog schema updated
  - [ ] Hash calculation on insert
  - [ ] Verification job detects breaks
  - [ ] Alert on chain integrity failure
- **Dependencies**: #16 (CorrelationId)

---

## Phase 2 Issues: Merchandising & Pricing Power

### Epic: Collections & Product Groupings

#### Issue #21: Implement Collection Tables
- **Priority**: P1
- **Type**: Story
- **Phase**: 2
- **Estimate**: 3 days
- **Description**:
  - Create `Collection` and `CollectionProduct` models
  - Slug uniqueness per store
  - Sorting strategies (manual, bestseller, newest)
- **Acceptance Criteria**:
  - [ ] Collection tables created
  - [ ] Unique index on (storeId, slug)
  - [ ] Position field for manual ordering
- **Dependencies**: Phase 1 completion

#### Issue #22: Collection Management UI
- **Priority**: P1
- **Type**: Story
- **Phase**: 2
- **Estimate**: 5 days
- **Description**:
  - Collection CRUD interface
  - Product picker for adding to collection
  - Drag-and-drop manual ordering
  - Publish/unpublish toggle
- **Acceptance Criteria**:
  - [ ] Collection list page
  - [ ] Collection create/edit form
  - [ ] Product search and add functionality
  - [ ] Manual order drag-and-drop
- **Dependencies**: #21

#### Issue #23: Featured Collection Pages
- **Priority**: P1
- **Type**: Task
- **Phase**: 2
- **Estimate**: 3 days
- **Description**:
  - Public collection listing page
  - Collection detail page with products
  - SEO metadata
  - Cache tag integration
- **Acceptance Criteria**:
  - [ ] /collections route
  - [ ] /collections/:slug route
  - [ ] Static generation with revalidation
  - [ ] Cache tags applied
- **Dependencies**: #21, #14 (Cache Tags)

---

### Epic: Promotion & Discount Engine

#### Issue #24: Implement DiscountCode Table
- **Priority**: P0
- **Type**: Story
- **Phase**: 2
- **Estimate**: 3 days
- **Description**:
  - Create `DiscountCode` model
  - Fields: code, type (percent/fixed), value, usageLimit, minSpend
  - Validation logic
  - Stackable flag
- **Acceptance Criteria**:
  - [ ] DiscountCode table
  - [ ] Unique index on (storeId, code)
  - [ ] Service method `validateDiscountCode(code)`
- **Dependencies**: Phase 1 completion

#### Issue #25: Implement PromotionRule Engine
- **Priority**: P0
- **Type**: Story
- **Phase**: 2
- **Estimate**: 6 days
- **Description**:
  - Create `PromotionRule` and `AppliedPromotion` models
  - Condition JSON schema (minSubtotal, segmentId, items)
  - Action JSON schema (discountPercent, discountFixed)
  - Evaluation service with deterministic ordering
- **Acceptance Criteria**:
  - [ ] PromotionRule table
  - [ ] Evaluation service `evaluatePromotions(cart, customer)`
  - [ ] Support for complex conditions
  - [ ] Stacking rules enforced
  - [ ] Tests cover rule combinations
- **Dependencies**: #24

#### Issue #26: Promotion Builder UI
- **Priority**: P1
- **Type**: Story
- **Phase**: 2
- **Estimate**: 5 days
- **Description**:
  - Visual rule builder (condition chips)
  - Action editor (discount type and value)
  - Preview simulation
  - Active/inactive toggle
- **Acceptance Criteria**:
  - [ ] Promotion list page
  - [ ] Visual rule builder component
  - [ ] Discount preview with sample cart
  - [ ] Validation feedback
- **Dependencies**: #25

#### Issue #27: Discount Code Validation Endpoint
- **Priority**: P1
- **Type**: Task
- **Phase**: 2
- **Estimate**: 2 days
- **Description**:
  - POST /api/discount-codes/validate
  - Check code validity, usage limits, expiry
  - Return discount preview
- **Acceptance Criteria**:
  - [ ] Endpoint created
  - [ ] Validates against current date/time
  - [ ] Checks usage limit not exceeded
  - [ ] Returns applicable discount amount
- **Dependencies**: #24

---

### Epic: Tiered & Multi-Currency Pricing

#### Issue #28: Implement ProductPrice Table
- **Priority**: P1
- **Type**: Story
- **Phase**: 2
- **Estimate**: 4 days
- **Description**:
  - Create `ProductPrice` model
  - Keys: productId/variantId, currency, segmentId, minQty
  - Effective date and expiry support
  - Dual-write with legacy price fields
- **Acceptance Criteria**:
  - [ ] ProductPrice table
  - [ ] Indexes for efficient lookup
  - [ ] Dual-write service methods
  - [ ] Consistency verification job
- **Dependencies**: Phase 1 completion

#### Issue #29: Pricing Service Resolver
- **Priority**: P1
- **Type**: Story
- **Phase**: 2
- **Estimate**: 5 days
- **Description**:
  - Service `resolvePrice(productId, currency, segmentId, qty)`
  - Tier matching logic (highest minQty <= requested qty)
  - Segment-specific pricing
  - Currency conversion support
  - Cache pricing matrix
- **Acceptance Criteria**:
  - [ ] Pricing resolver service
  - [ ] Tests cover tier and segment scenarios
  - [ ] p95 latency < 120ms
  - [ ] Cache integration
- **Dependencies**: #28

#### Issue #30: Implement CurrencyRate Table and Sync Job
- **Priority**: P1
- **Type**: Story
- **Phase**: 2
- **Estimate**: 3 days
- **Description**:
  - Create `CurrencyRate` model
  - Daily sync job (external API)
  - Base currency (USD) to target currencies
  - Precision handling (Decimal type)
- **Acceptance Criteria**:
  - [ ] CurrencyRate table
  - [ ] Daily cron job updates rates
  - [ ] Conversion helper function
  - [ ] Fallback to cached rates on API failure
- **Dependencies**: None

#### Issue #31: Price Matrix UI
- **Priority**: P1
- **Type**: Story
- **Phase**: 2
- **Estimate**: 4 days
- **Description**:
  - UI grid showing prices by currency/tier/segment
  - Add/remove rows
  - Inline validation (no overlapping tiers)
  - Bulk import from CSV
- **Acceptance Criteria**:
  - [ ] Price matrix component
  - [ ] Add/remove tier rows
  - [ ] Validation feedback
  - [ ] CSV import functionality
- **Dependencies**: #28, #29

---

### Epic: Product Images & Media

#### Issue #32: Implement ProductImage Table
- **Priority**: P1
- **Type**: Story
- **Phase**: 2
- **Estimate**: 3 days
- **Description**:
  - Create `ProductImage` model
  - Normalized fields (url, alt, position)
  - Migration from JSON images field
- **Acceptance Criteria**:
  - [ ] ProductImage table
  - [ ] Backfill script from existing data
  - [ ] Index on (productId, position)
- **Dependencies**: None

#### Issue #33: Image Gallery Component
- **Priority**: P1
- **Type**: Task
- **Phase**: 2
- **Estimate**: 4 days
- **Description**:
  - Gallery component with thumbnails
  - Lazy loading and blur placeholders
  - Lightbox on click
  - Responsive sizes
- **Acceptance Criteria**:
  - [ ] Gallery component created
  - [ ] Lazy loading implemented
  - [ ] Blur placeholders reduce CLS
  - [ ] Mobile-optimized layout
- **Dependencies**: #32

#### Issue #34: Image Optimization Pipeline
- **Priority**: P1
- **Type**: Task
- **Phase**: 2
- **Estimate**: 3 days
- **Description**:
  - AVIF/WebP conversion
  - Responsive srcset generation
  - CDN integration
  - Precompute dimensions for CLS
- **Acceptance Criteria**:
  - [ ] Image upload generates AVIF/WebP
  - [ ] Responsive sizes configured
  - [ ] Avg payload reduction 40%
  - [ ] LCP < 2.5s
- **Dependencies**: #32

---

## Phase 3 Issues: Extensibility & Observability

### Epic: Webhook Infrastructure

#### Issue #35: Implement Webhook Tables
- **Priority**: P1
- **Type**: Story
- **Phase**: 3
- **Estimate**: 3 days
- **Description**:
  - Create `WebhookSubscription` and `WebhookDelivery` models
  - Fields: targetUrl, eventTypes[], secret, isActive
  - Delivery tracking (status, attempt, nextRetryAt)
- **Acceptance Criteria**:
  - [ ] Webhook tables created
  - [ ] Indexes for efficient queries
  - [ ] HMAC secret generation
- **Dependencies**: Phase 2 completion

#### Issue #36: Webhook Delivery Worker
- **Priority**: P1
- **Type**: Story
- **Phase**: 3
- **Estimate**: 5 days
- **Description**:
  - BullMQ queue setup
  - Worker with exponential backoff
  - HMAC signature generation (X-Webhook-Signature)
  - Retry limit and dead letter handling
- **Acceptance Criteria**:
  - [ ] BullMQ queue configured
  - [ ] Worker processes deliveries
  - [ ] Exponential backoff (1m, 5m, 30m, 2h, 12h)
  - [ ] HMAC signature in header
  - [ ] Delivery success rate > 98%
- **Dependencies**: #35

#### Issue #37: Webhook Management UI
- **Priority**: P1
- **Type**: Story
- **Phase**: 3
- **Estimate**: 4 days
- **Description**:
  - Subscription CRUD interface
  - Event type multi-select
  - Test webhook button
  - Delivery log viewer with retry action
- **Acceptance Criteria**:
  - [ ] Subscription list and form
  - [ ] Event type selection
  - [ ] Test delivery button
  - [ ] Delivery log table with filters
  - [ ] Manual retry button
- **Dependencies**: #35, #36

#### Issue #38: Webhook Host Validation (SSRF Prevention)
- **Priority**: P1
- **Type**: Task
- **Phase**: 3
- **Estimate**: 2 days
- **Description**:
  - Validate webhook URLs (no internal IPs)
  - Deny RFC1918 ranges (10.*, 192.168.*, 169.254.*, 127.*)
  - Optional verification ping
- **Acceptance Criteria**:
  - [ ] URL validation function
  - [ ] Blocks internal IPs
  - [ ] Tests verify blocked ranges
  - [ ] Optional handshake verification
- **Dependencies**: #35

---

### Epic: Domain Events & Automation

#### Issue #39: Implement DomainEvent Table
- **Priority**: P1
- **Type**: Story
- **Phase**: 3
- **Estimate**: 4 days
- **Description**:
  - Create `DomainEvent` model
  - Fields: eventType, entityType, entityId, payload (JSON), correlationId
  - Emit events on key transitions (order.created, product.updated, etc.)
- **Acceptance Criteria**:
  - [ ] DomainEvent table
  - [ ] Event emitter service
  - [ ] Events emitted on lifecycle transitions
  - [ ] CorrelationId tracked
- **Dependencies**: #16 (CorrelationId)

#### Issue #40: Event Catalog Documentation
- **Priority**: P2
- **Type**: Task
- **Phase**: 3
- **Estimate**: 2 days
- **Description**:
  - Document all event types
  - Payload schemas
  - Webhook consumption examples
- **Acceptance Criteria**:
  - [ ] Event catalog markdown file
  - [ ] Schema for each event type
  - [ ] Code examples for consumption
- **Dependencies**: #39

---

### Epic: Analytics Foundation

#### Issue #41: Implement Analytics Tables
- **Priority**: P1
- **Type**: Story
- **Phase**: 3
- **Estimate**: 4 days
- **Description**:
  - Create `AnalyticsEvent`, `DailyStoreMetrics`, `CohortMetrics` models
  - Event ingestion endpoint
  - Daily aggregation job
- **Acceptance Criteria**:
  - [ ] Analytics tables created
  - [ ] Event ingestion API
  - [ ] Daily aggregation cron job
  - [ ] Partitioning strategy for events
- **Dependencies**: Phase 2 completion

#### Issue #42: Analytics Dashboard UI
- **Priority**: P1
- **Type**: Story
- **Phase**: 3
- **Estimate**: 5 days
- **Description**:
  - Dashboard cards (GMV, AOV, Orders, Conversion)
  - Trend sparklines
  - Date range selector
  - Top products/categories widgets
- **Acceptance Criteria**:
  - [ ] Dashboard page created
  - [ ] Metric cards with trends
  - [ ] Interactive date range
  - [ ] Streaming data under Suspense
  - [ ] Load time < 1s
- **Dependencies**: #41

#### Issue #43: Order Attribution Tracking
- **Priority**: P2
- **Type**: Story
- **Phase**: 3
- **Estimate**: 3 days
- **Description**:
  - Create `OrderAttribution` model
  - Track marketing channel, campaign, referrer
  - Attribution UI widget
- **Acceptance Criteria**:
  - [ ] OrderAttribution table
  - [ ] Capture attribution on order create
  - [ ] Dashboard widget showing channel breakdown
- **Dependencies**: #41

---

### Epic: Observability Instrumentation

#### Issue #44: Prometheus Metrics Export
- **Priority**: P1
- **Type**: Task
- **Phase**: 3
- **Estimate**: 3 days
- **Description**:
  - Configure Prometheus exporter
  - Export key metrics (request duration, DB query, cache hit ratio)
  - Grafana dashboard setup
- **Acceptance Criteria**:
  - [ ] Prometheus endpoint /metrics
  - [ ] Key metrics exported
  - [ ] Grafana dashboard imported
- **Dependencies**: #18 (OpenTelemetry)

#### Issue #45: Sentry Error Tracking
- **Priority**: P1
- **Type**: Task
- **Phase**: 3
- **Estimate**: 2 days
- **Description**:
  - Sentry SDK integration
  - Error boundary components
  - Release tracking
  - Environment tagging
- **Acceptance Criteria**:
  - [ ] Sentry initialized
  - [ ] Errors captured with context
  - [ ] Release tagging configured
  - [ ] Error rate dashboard
- **Dependencies**: None

#### Issue #46: Synthetic Monitoring Scripts
- **Priority**: P2
- **Type**: Task
- **Phase**: 3
- **Estimate**: 3 days
- **Description**:
  - Checkout simulation script
  - Refund simulation script
  - Product browse simulation
  - Cron scheduling
- **Acceptance Criteria**:
  - [ ] Synthetic scripts created
  - [ ] Scheduled via cron/Vercel Cron
  - [ ] Results logged to metrics
  - [ ] Alerts on synthetic failure
- **Dependencies**: #44

---

### Epic: Rate Limiting & Security

#### Issue #47: Implement Rate Limiting Middleware
- **Priority**: P1
- **Type**: Story
- **Phase**: 3
- **Estimate**: 4 days
- **Description**:
  - Redis sliding window implementation
  - Per-store and per-user quotas
  - Return 429 with Retry-After header
  - Rate limit metrics
- **Acceptance Criteria**:
  - [ ] Rate limit middleware created
  - [ ] Applied to critical endpoints
  - [ ] Returns proper 429 responses
  - [ ] Tests verify rate limiting behavior
- **Dependencies**: Redis setup

---

## Phase 4 Issues: Intelligence & Internationalization

### Epic: Customer Segmentation & RFM

#### Issue #48: Implement Segmentation Tables
- **Priority**: P1
- **Type**: Story
- **Phase**: 4
- **Estimate**: 4 days
- **Description**:
  - Create `CustomerSegment`, `CustomerSegmentMember`, `CustomerRFMSnapshot` models
  - Segment criteria JSON schema
  - RFM calculation logic
- **Acceptance Criteria**:
  - [ ] Segmentation tables created
  - [ ] RFM scoring formula implemented
  - [ ] Segment membership calculation
- **Dependencies**: Phase 3 completion

#### Issue #49: RFM Snapshot Job
- **Priority**: P1
- **Type**: Task
- **Phase**: 4
- **Estimate**: 3 days
- **Description**:
  - Nightly job calculating RFM scores
  - Insert snapshots for all customers
  - Update segment memberships
  - Alert on significant population shifts
- **Acceptance Criteria**:
  - [ ] Cron job created
  - [ ] RFM scores calculated
  - [ ] Segment membership updated
  - [ ] Performance < 10m for 100K customers
- **Dependencies**: #48

#### Issue #50: Segment Builder UI
- **Priority**: P1
- **Type**: Story
- **Phase**: 4
- **Estimate**: 5 days
- **Description**:
  - Visual criteria editor (chips, dropdowns)
  - Preview segment size
  - Dynamic segment evaluation
  - Segment performance metrics
- **Acceptance Criteria**:
  - [ ] Segment builder component
  - [ ] Visual criteria editor
  - [ ] Live preview of member count
  - [ ] Segment analytics dashboard
- **Dependencies**: #48, #49

---

### Epic: Marketing Automation

#### Issue #51: Implement Cart & Marketing Campaign Tables
- **Priority**: P1
- **Type**: Story
- **Phase**: 4
- **Estimate**: 5 days
- **Description**:
  - Create `Cart`, `CartItem`, `MarketingCampaign`, `CampaignTemplate` models
  - Create `EmailCampaign`, `SMSCampaign`, `WhatsAppCampaign` models
  - Create `EmailEvent`, `SMSEvent`, `WhatsAppEvent` models for engagement tracking
  - Cart tracking for abandoned cart recovery
  - Multi-channel campaign support (Email, SMS, WhatsApp)
- **Acceptance Criteria**:
  - [ ] Cart tables created with proper indexes
  - [ ] MarketingCampaign table supports multiple channel types
  - [ ] CampaignTemplate table with 50+ Bangladesh-specific templates
  - [ ] EmailEvent/SMSEvent/WhatsAppEvent webhook ingestion configured
  - [ ] Campaign status tracking (draft, scheduled, sent, completed)
- **Dependencies**: Phase 3 completion
- **Reference**: docs/research/MARKETING_AUTOMATION_V2.md

#### Issue #52: Campaign Builder & Template System
- **Priority**: P1
- **Type**: Story
- **Phase**: 4
- **Estimate**: 6 days
- **Description**:
  - Visual campaign builder UI with drag-and-drop
  - Template library with Bangladesh-specific templates (Eid, Pohela Boishakh, Flash Sale, etc.)
  - Multi-channel message composer (Email, SMS, WhatsApp)
  - Campaign scheduling system
  - A/B testing framework for message variations
- **Acceptance Criteria**:
  - [ ] Campaign builder UI with template selection
  - [ ] 50+ pre-built templates (promotional, seasonal, product launch, loyalty)
  - [ ] Multi-channel content editor (character limits, emoji support)
  - [ ] Scheduling interface (immediate, scheduled, recurring)
  - [ ] A/B test configuration (split percentage, winner criteria)
  - [ ] Campaign preview across all channels
- **Dependencies**: #51
- **Reference**: docs/research/MARKETING_AUTOMATION_V2.md sections 4.1-4.2

#### Issue #53: Abandoned Cart Recovery Workflow
- **Priority**: P1
- **Type**: Story
- **Phase**: 4
- **Estimate**: 5 days
- **Description**:
  - Detect cart inactivity (1h threshold, configurable)
  - Multi-channel automation trigger (WhatsApp preferred, fallback to SMS/Email)
  - Personalized template with cart items and images
  - Track recovery conversions with attribution
  - Recovery rate optimization (target 20-30%)
- **Acceptance Criteria**:
  - [ ] Abandoned cart detection job (configurable threshold: 30m, 1h, 3h, 24h)
  - [ ] Multi-channel templates with cart item personalization
  - [ ] Automatic channel selection (WhatsApp → SMS → Email priority)
  - [ ] Recovery tracking with revenue attribution
  - [ ] Recovery rate > 12% (stretch goal: 20%+)
  - [ ] Discount code generation for recovery campaigns
- **Dependencies**: #51, #52
- **Reference**: docs/research/MARKETING_AUTOMATION_V2.md section 7.1

#### Issue #53a: SMS Gateway Integration (Bangladesh Focus)
- **Priority**: P1
- **Type**: Story
- **Phase**: 4
- **Estimate**: 4 days
- **Description**:
  - Integrate Bangladesh SMS gateways (SSL Wireless, Banglalink, Robi, GP)
  - SMS credit management system
  - bKash/Nagad payment integration for SMS credits
  - SMS delivery tracking and status webhooks
  - Bangla Unicode (UTF-8) support
- **Acceptance Criteria**:
  - [ ] SMS gateway abstraction layer supporting multiple providers
  - [ ] SSL Wireless integration (primary)
  - [ ] SMS credit purchase via bKash/Nagad
  - [ ] Credit packages: 500, 1000, 5000, 10000 SMS with bonus structure
  - [ ] Delivery status tracking (sent, delivered, failed)
  - [ ] Bangla text support with proper encoding
  - [ ] SMS length calculator (160 chars standard, 70 chars Bangla)
- **Dependencies**: #51
- **Reference**: docs/research/MARKETING_AUTOMATION_V2.md section 3.2

#### Issue #53b: WhatsApp Business API Integration
- **Priority**: P1
- **Type**: Story
- **Phase**: 4
- **Estimate**: 5 days
- **Description**:
  - WhatsApp Business API integration
  - Template message approval workflow
  - Rich media support (images, product catalogs)
  - Interactive buttons and quick replies
  - Delivery and read receipts tracking
- **Acceptance Criteria**:
  - [ ] WhatsApp Business API connection setup
  - [ ] Template submission and approval workflow UI
  - [ ] Rich media attachment support (images up to 5MB)
  - [ ] Interactive message builder (buttons, lists, quick replies)
  - [ ] Delivery status tracking (sent, delivered, read)
  - [ ] Conversation 24-hour window management
  - [ ] Product catalog integration for shopping messages
- **Dependencies**: #51
- **Reference**: docs/research/MARKETING_AUTOMATION_V2.md section 6.2

#### Issue #54: Churn Risk Win-Back Campaign
- **Priority**: P1
- **Type**: Story
- **Phase**: 4
- **Estimate**: 4 days
- **Description**:
  - Identify churn risk customers (45+ days inactive, configurable)
  - Multi-channel win-back campaigns
  - Dynamic discount code generation
  - Track reactivation and revenue impact
- **Acceptance Criteria**:
  - [ ] Churn detection logic with configurable thresholds (30d, 45d, 60d, 90d)
  - [ ] Win-back campaign templates (email, SMS, WhatsApp)
  - [ ] Dynamic discount code generation (10%, 15%, 20%, 25%)
  - [ ] Reactivation tracking with revenue attribution
  - [ ] Win-back rate > 8%
  - [ ] Automated scheduling (weekly, bi-weekly, monthly)
- **Dependencies**: #48 (Segmentation), #51, #52
- **Reference**: docs/research/MARKETING_AUTOMATION_V2.md section 7.4

#### Issue #54a: Campaign Analytics & Attribution Dashboard
- **Priority**: P1
- **Type**: Story
- **Phase**: 4
- **Estimate**: 5 days
- **Description**:
  - Real-time campaign analytics dashboard
  - Multi-channel performance comparison
  - Revenue attribution tracking
  - ROI calculator
  - Export reports (CSV, PDF, Excel)
- **Acceptance Criteria**:
  - [ ] Real-time metrics (sent, delivered, opened, clicked, converted)
  - [ ] Channel comparison charts (SMS vs WhatsApp vs Email effectiveness)
  - [ ] Revenue attribution per campaign with conversion tracking
  - [ ] ROI calculator (campaign cost vs revenue generated)
  - [ ] Customer journey visualization
  - [ ] Export functionality (CSV, PDF, Excel formats)
  - [ ] Date range filtering and comparison
- **Dependencies**: #51, #52, #53
- **Reference**: docs/research/MARKETING_AUTOMATION_V2.md section 8

#### Issue #54b: Bangladesh-Specific Features
- **Priority**: P2
- **Type**: Story
- **Phase**: 4
- **Estimate**: 4 days
- **Description**:
  - Bangladesh city/district targeting
  - Seasonal campaign templates (Eid, Pohela Boishakh, Victory Day)
  - Cash-on-delivery (COD) preference targeting
  - Mobile number validation (Bangladesh format)
  - Bangla language support throughout platform
- **Acceptance Criteria**:
  - [ ] Geographic targeting by division/district/upazila
  - [ ] 20+ Bangladesh seasonal templates
  - [ ] COD preference segmentation filter
  - [ ] Bangladesh mobile number validation (+880, 01X format)
  - [ ] Bangla calendar integration for campaigns
  - [ ] Cultural sensitivity guidelines in template library
  - [ ] Local payment method integration (bKash, Nagad, Rocket)
- **Dependencies**: #51, #52
- **Reference**: docs/research/MARKETING_AUTOMATION_V2.md section 9

---

### Epic: Product Recommendations

#### Issue #54: Implement ProductEmbedding Table
- **Priority**: P1
- **Type**: Story
- **Phase**: 4
- **Estimate**: 3 days
- **Description**:
  - Create `ProductEmbedding` model
  - Vector storage for product representations
  - Similarity search queries
- **Acceptance Criteria**:
  - [ ] ProductEmbedding table
  - [ ] Vector similarity index
  - [ ] Query function `findSimilar(productId, limit)`
- **Dependencies**: Phase 3 completion

#### Issue #55: Recommendation Engine (Rule-Based)
- **Priority**: P1
- **Type**: Story
- **Phase**: 4
- **Estimate**: 4 days
- **Description**:
  - Rule-based recommendations (same category, top-selling)
  - RecommendationEvent tracking
  - Cache recommendations daily
- **Acceptance Criteria**:
  - [ ] Recommendation service created
  - [ ] Rules: same category, complementary, top-selling
  - [ ] Cache per product context
  - [ ] Tests verify rule logic
- **Dependencies**: None

#### Issue #56: Recommendation UI Ribbon
- **Priority**: P1
- **Type**: Task
- **Phase**: 4
- **Estimate**: 3 days
- **Description**:
  - "You may also like" component
  - Product cards in horizontal scroll
  - Tracking clicks for CTR
- **Acceptance Criteria**:
  - [ ] Recommendation ribbon component
  - [ ] Horizontal scroll UI
  - [ ] Click tracking
  - [ ] Recommendation CTR > 8%
- **Dependencies**: #55

---

### Epic: Internationalization

#### Issue #57: Implement Translation Tables
- **Priority**: P1
- **Type**: Story
- **Phase**: 4
- **Estimate**: 4 days
- **Description**:
  - Create `ProductTranslation`, `CategoryTranslation`, `BrandTranslation` models
  - Locale field (en-US, es-ES, etc.)
  - Fallback to default locale logic
- **Acceptance Criteria**:
  - [ ] Translation tables created
  - [ ] Locale field indexed
  - [ ] Fallback logic implemented
- **Dependencies**: Phase 3 completion

#### Issue #58: Locale Switcher UI
- **Priority**: P1
- **Type**: Task
- **Phase**: 4
- **Estimate**: 3 days
- **Description**:
  - Locale selector component
  - Persist locale preference
  - Set <html lang> attribute
  - Route param integration
- **Acceptance Criteria**:
  - [ ] Locale switcher in header
  - [ ] Preference stored per user/session
  - [ ] Dynamic <html lang>
  - [ ] Route param /[locale]/...
- **Dependencies**: #57

#### Issue #59: Translation Editor UI
- **Priority**: P2
- **Type**: Task
- **Phase**: 4
- **Estimate**: 4 days
- **Description**:
  - Translation management interface
  - Side-by-side editor (source + target locale)
  - Bulk import from CSV
- **Acceptance Criteria**:
  - [ ] Translation editor component
  - [ ] Side-by-side layout
  - [ ] CSV import/export
  - [ ] Missing translation indicator
- **Dependencies**: #57

#### Issue #60: Currency Display Formatting
- **Priority**: P1
- **Type**: Task
- **Phase**: 4
- **Estimate**: 2 days
- **Description**:
  - Intl.NumberFormat integration
  - Display prices in store currency
  - Locale-aware formatting (thousands separators)
- **Acceptance Criteria**:
  - [ ] Currency formatter utility
  - [ ] Used across all price displays
  - [ ] Locale-aware formatting
- **Dependencies**: #30 (CurrencyRate)

---

### Epic: Advanced Search & Discovery

#### Issue #61: PostgreSQL Full-Text Search Setup
- **Priority**: P1
- **Type**: Task
- **Phase**: 4
- **Estimate**: 3 days
- **Description**:
  - Enable pg_trgm extension
  - Add GIN indexes for fuzzy search
  - Search endpoint with relevance scoring
- **Acceptance Criteria**:
  - [ ] pg_trgm extension enabled
  - [ ] GIN indexes created
  - [ ] Search endpoint returns ranked results
  - [ ] p95 latency < 150ms
- **Dependencies**: None

#### Issue #62: Product Embedding Generation Job
- **Priority**: P2
- **Type**: Task
- **Phase**: 4
- **Estimate**: 4 days
- **Description**:
  - Background job generating embeddings
  - Use open-source model (sentence-transformers)
  - Queue-based processing
  - Store in ProductEmbedding table
- **Acceptance Criteria**:
  - [ ] Embedding generation job
  - [ ] Queue processing
  - [ ] Embeddings stored
  - [ ] Re-generation on product update
- **Dependencies**: #54 (ProductEmbedding)

---

## Phase 5 Issues: Advanced Reliability & Automation

### Epic: Event Sourcing Core Entities

#### Issue #63: Inventory Projection Rebuild Script
- **Priority**: P2
- **Type**: Task
- **Phase**: 5
- **Estimate**: 3 days
- **Description**:
  - Script to rebuild Product.inventoryQty from InventoryAdjustment events
  - Verification against current state
  - Rollback/replay capability
- **Acceptance Criteria**:
  - [ ] Rebuild script created
  - [ ] Verification logic
  - [ ] Tests ensure accuracy
- **Dependencies**: #7 (InventoryAdjustment)

#### Issue #64: Order State Replay Capability
- **Priority**: P2
- **Type**: Story
- **Phase**: 5
- **Estimate**: 5 days
- **Description**:
  - Capture order state transitions as events
  - Replay script for debugging
  - Verification against current state
- **Acceptance Criteria**:
  - [ ] Order events captured
  - [ ] Replay script implemented
  - [ ] State consistency tests
- **Dependencies**: #39 (DomainEvent)

---

### Epic: Workflow Orchestration

#### Issue #65: Returns Workflow Automation
- **Priority**: P2
- **Type**: Story
- **Phase**: 5
- **Estimate**: 5 days
- **Description**:
  - Automated state transitions (received → inspected → refunded)
  - Conditional logic based on return condition
  - Notification triggers
- **Acceptance Criteria**:
  - [ ] Workflow state machine
  - [ ] Auto-transitions configured
  - [ ] Manual intervention points
  - [ ] > 70% automated handling
- **Dependencies**: #5 (ReturnRequest)

#### Issue #66: Temporal Integration (Optional)
- **Priority**: P3
- **Type**: Research
- **Phase**: 5
- **Estimate**: 8 days
- **Description**:
  - Evaluate Temporal for complex workflows
  - Proof-of-concept integration
  - Migration path from current jobs
- **Acceptance Criteria**:
  - [ ] Temporal evaluated
  - [ ] POC workflow created
  - [ ] Decision documented
- **Dependencies**: None

---

### Epic: Fraud Assessment

#### Issue #67: Implement FraudAssessment Table
- **Priority**: P2
- **Type**: Story
- **Phase**: 5
- **Estimate**: 3 days
- **Description**:
  - Create `FraudAssessment` model
  - Fraud score field (0-100)
  - Risk level enum (low, medium, high)
  - Link to Order
- **Acceptance Criteria**:
  - [ ] FraudAssessment table
  - [ ] Index on (orderId)
  - [ ] Risk level calculation
- **Dependencies**: Phase 4 completion

#### Issue #68: Fraud Scoring Pipeline
- **Priority**: P2
- **Type**: Story
- **Phase**: 5
- **Estimate**: 6 days
- **Description**:
  - Rule-based fraud detection (velocity, mismatch patterns)
  - Score calculation on order creation
  - Flag high-risk orders for review
  - Manual review queue
- **Acceptance Criteria**:
  - [ ] Scoring service created
  - [ ] Rules: velocity, address mismatch, high value
  - [ ] Orders flagged automatically
  - [ ] Review queue UI
  - [ ] Fraud detection accuracy > 90%
- **Dependencies**: #67

---

### Epic: Predictive Metrics

#### Issue #69: CLV Prediction Model
- **Priority**: P3
- **Type**: Story
- **Phase**: 5
- **Estimate**: 8 days
- **Description**:
  - Customer Lifetime Value model
  - Training on historical order data
  - Prediction API
  - Dashboard widget
- **Acceptance Criteria**:
  - [ ] CLV model trained
  - [ ] Prediction service
  - [ ] Dashboard displays predicted CLV
  - [ ] Model AUC > 0.75
- **Dependencies**: #41 (Analytics)

#### Issue #70: Churn Risk Prediction
- **Priority**: P3
- **Type**: Story
- **Phase**: 5
- **Estimate**: 6 days
- **Description**:
  - Churn prediction model
  - Features: RFM, engagement, last order date
  - Prediction score (0-1)
  - Proactive retention campaigns
- **Acceptance Criteria**:
  - [ ] Churn model trained
  - [ ] Prediction service
  - [ ] High-risk customer list
  - [ ] Model AUC > 0.75
- **Dependencies**: #48 (Segmentation)

---

### Epic: Marketplace Plugin Foundation

#### Issue #71: Implement AppIntegration Table
- **Priority**: P3
- **Type**: Story
- **Phase**: 5
- **Estimate**: 4 days
- **Description**:
  - Create `AppIntegration` model
  - Fields: appId, storeId, config (JSON), isActive
  - OAuth2 integration support
- **Acceptance Criteria**:
  - [ ] AppIntegration table
  - [ ] OAuth2 flow setup
  - [ ] App installation UI
- **Dependencies**: Phase 4 completion

#### Issue #72: Plugin SDK Documentation
- **Priority**: P3
- **Type**: Task
- **Phase**: 5
- **Estimate**: 5 days
- **Description**:
  - Plugin development guide
  - API reference
  - Sample plugin
  - Submission process
- **Acceptance Criteria**:
  - [ ] SDK documentation published
  - [ ] Sample plugin code
  - [ ] API reference complete
  - [ ] Submission guidelines
- **Dependencies**: #71

---

## Summary Statistics

### Total Issues by Phase
- **Phase 1**: 20 issues (6 epics)
- **Phase 2**: 14 issues (3 epics)
- **Phase 3**: 13 issues (4 epics)
- **Phase 4**: 20 issues (4 epics) - *Updated: Enhanced marketing automation with multi-channel support*
- **Phase 5**: 10 issues (4 epics)
- **Total**: 77+ issues across 21 epics

### Priority Distribution
- **P0 (Critical)**: 25 issues
- **P1 (High)**: 42 issues - *Updated: +7 marketing automation issues*
- **P2 (Medium)**: 9 issues - *Updated: +1 Bangladesh-specific features*
- **P3 (Low)**: 2 issues

### Estimated Timeline
- **Phase 1**: 6 weeks (60 person-days)
- **Phase 2**: 6 weeks (50 person-days)
- **Phase 3**: 6 weeks (45 person-days)
- **Phase 4**: 9 weeks (68 person-days) - *Updated: +13 days for enhanced marketing automation*
- **Phase 5**: 9 weeks (50 person-days)
- **Total**: ~36 weeks (9 months) with 2-3 full-stack engineers

### Recent Updates (2025-11-24)
- Added comprehensive marketing automation suite based on MARKETING_AUTOMATION_V2.md
- Integrated Bangladesh-specific features (SMS gateways, bKash/Nagad, Bangla support)
- Enhanced multi-channel campaigns (Email, SMS, WhatsApp)
- Added campaign builder with 50+ templates
- Included analytics dashboard with ROI tracking
- Total new issues: 7 additional stories in Phase 4

---

## GitHub Project Setup Instructions

### Create Project Structure
1. Navigate to https://github.com/orgs/CodeStorm-Hub/projects/7
2. Create custom fields:
   - **Phase**: Single select (1, 2, 3, 4, 5)
   - **Epic**: Text field
   - **Estimate**: Number (days)
   - **Priority**: Single select (P0, P1, P2, P3)
3. Create views:
   - **By Phase**: Board grouped by Phase
   - **By Priority**: Board grouped by Priority
   - **Timeline**: Roadmap view
   - **Backlog**: Table view with all issues

### Create Labels
```
priority: P0
priority: P1
priority: P2
priority: P3
type: epic
type: story
type: task
type: research
phase: 1
phase: 2
phase: 3
phase: 4
phase: 5
```

### Create Milestones
- Phase 1: Lifecycle & Security
- Phase 2: Merchandising & Pricing
- Phase 3: Extensibility & Observability
- Phase 4: Intelligence & i18n
- Phase 5: Advanced Reliability

### Automation Rules
- Auto-add to project when issue created
- Auto-move to "In Progress" when assigned
- Auto-move to "Done" when closed
- Auto-label based on title keywords

---

## Next Steps

1. **Review & Approve** this issue plan
2. **Create GitHub Issues** from this template (can be automated via script)
3. **Assign Team Members** to Phase 1 issues
4. **Setup Development Environment** (PostgreSQL, Redis, etc.)
5. **Begin Sprint Planning** for first 2-week sprint

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-24  
**Owner**: StormCom Engineering Team
