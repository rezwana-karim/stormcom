# StormCom API Refactor & Design Plan

## Current State (Inferred)
- Next.js App Router route handlers for auth; other domain operations likely using server actions or planned route handlers.
- No explicit mention of tRPC/GraphQL in current code snapshot; RESTful patterns not fully established.

## Strategic Goals
1. Support internal dashboard with strongly-typed rapid iteration.
2. Provide public, stable external integration surface (webhooks + REST).
3. Enable storefront composition queries (multi-entity fetch) efficiently.
4. Enforce multi-tenant security (tenant scoping + rate limiting + RBAC).
5. Provide idempotency and observability for critical financial/order endpoints.

## Recommended Layered Architecture
```
[Client Components]
   ↳ Call → [Typed Client SDK (tRPC or Fetch wrappers)]
       ↳ [API Gateway Layer]
           ↳ Internal Services (CatalogService, OrderService, PricingService, PromotionService)
               ↳ Prisma Repositories (enforcing tenant scope) 
```

### Option Mix
| Layer | Technology | Rationale |
|-------|------------|-----------|
| Internal Dashboard | tRPC | End-to-end TypeScript & fast iteration |
| Public API | REST (JSON) | Simplicity for third parties / webhooks |
| Storefront Composition | GraphQL Gateway | Flexible client-driven selection |

### Tenant Scoping Enforcement
Implement a repository factory:
```ts
function createScopedRepos(storeId: string, userPermissions: PermissionSet) {
  return {
    productRepo: new ProductRepo(storeId, prisma),
    orderRepo: new OrderRepo(storeId, prisma),
    // ...
  };
}
```
Each repo adds implicit `WHERE storeId = ? AND deletedAt IS NULL`.
Add a test suite (later) verifying no accidental unscoped queries.

### Idempotency Pattern
Applicable endpoints: Order creation, payment capture, refund, inventory adjustment bulk operations.
1. Client sends `Idempotency-Key` header.
2. Middleware checks `IdempotentRequest` table:
```prisma
model IdempotentRequest {
  id            String @id @default(cuid())
  key           String @unique
  endpoint      String
  requestHash   String // hash(body)
  status        String // pending|completed|error
  responseBody  String?
  createdAt     DateTime @default(now())
}
```
3. If completed & hash matches, return cached response.
4. If pending and processing time > timeout, return retryable error.

### Error Classification
Standardize error shape:
```json
{
  "error": {
    "type": "validation|auth|not_found|conflict|rate_limit|internal",
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found",
    "correlationId": "uuid"
  }
}
```
Use correlationId to tie logs, audit entries, and distributed traces.

### Rate Limiting Strategy
Redis sliding window per key pattern:
- `rl:store:{storeId}:user:{userId}:ep:{endpoint}`
- Quotas: e.g. 300/min per dashboard user, 120/min for public API keys.
Return `429` with `Retry-After` header.

### Versioning Approach
- REST: `/api/v1/...` root. Introduce `/v2` only for breaking changes.
- tRPC: Maintain backward compatibility by additive changes; deprecate procedures via wrappers.
- GraphQL: Use deprecation directives; avoid hard removal until usage metrics minimal.

### Pagination & Filtering
Implement consistent query parameters:
```
GET /api/v1/products?cursor=encoded&limit=50&filter[status]=ACTIVE&sort=-createdAt
```
Cursor structure: base64 JSON `{ "createdAt": "2025-11-24T...", "id": "..." }`.
Use index `(storeId, status, createdAt DESC, id)` for stable ordering.

### Search & Recommendation APIs
- `/api/v1/search/products?q=term&f[category]=slug&f[brand]=slug`
- Integrate pg_trgm for fuzzy; future: `/api/v1/recommendations/products?context=product:{id}` using embeddings.

### Webhook Delivery Pipeline
Webhook event emission on domain changes (order.created, product.updated, inventory.low_stock):
```prisma
model WebhookSubscription {
  id        String @id @default(cuid())
  storeId   String
  targetUrl String
  eventTypes String // JSON array
  secret    String
  isActive  Boolean @default(true)
  createdAt DateTime @default(now())
}

model WebhookDelivery {
  id        String @id @default(cuid())
  subscriptionId String
  subscription WebhookSubscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  eventType String
  payload   String
  attempt   Int @default(0)
  status    String @default("pending") // pending|success|failed|retrying
  responseCode Int?
  nextRetryAt DateTime?
  createdAt DateTime @default(now())
}
```
Delivery worker (BullMQ) handles exponential backoff + signature header (`X-StormCom-Signature` HMAC).

### Promotion Engine Integration Flow
1. Load applicable active `PromotionRule` + `DiscountCode` (code validation).
2. Evaluate conditions against cart context (subtotal, segment membership, items).
3. Produce list of `AppliedPromotion` entries, compute discount totals.
4. Persist with order atomically.

### Fulfillment Lifecycle API
Endpoints:
- `POST /api/v1/orders/{id}/fulfillments` (create with items & quantities)
- `POST /api/v1/fulfillments/{id}/ship` (tracking details)
- `POST /api/v1/fulfillments/{id}/deliver`
- `POST /api/v1/orders/{id}/cancel` (with reason, cascades to fulfillments not shipped)

### Returns & Refunds Flow
1. Customer initiates return: `POST /api/v1/orders/{id}/returns` (items & quantities).
2. Staff approves and issues RMA number.
3. On receiving items: validate, compute refund amount, create `Refund`.
4. Update order status or maintain separate return status path.

### Security & RBAC Middleware
- Extract API token from header `X-Api-Key` (for integration endpoints) → map to `ApiToken` → derive scopes.
- Runtime permission check matrix:
```ts
can(user, "product.write") // checks role permissions + overrides
```
- Deny by default; explicit allow list per endpoint.

### Observability
- Inject `correlationId` into response headers.
- Log structured events (JSON) with keys: `ts`, `lvl`, `cid`, `storeId`, `userId`, `event`, `durationMs`.
- Use OpenTelemetry for traces around DB-heavy endpoints (product search, order creation).

### Example Endpoint Definitions (REST)
```http
POST /api/v1/orders
Headers:
  Idempotency-Key: 8b3e...
Body:
{
  "items": [{"productId": "p123", "variantId": "v1", "quantity": 2}],
  "discountCode": "SUMMER10",
  "shippingAddress": {...},
  "billingAddress": {...},
  "paymentMethod": "STRIPE"
}
Response 201:
{
  "order": {
    "id": "o123",
    "status": "PENDING",
    "subtotal": 100.00,
    "discountAmount": 10.00,
    "totalAmount": 95.00,
    "appliedPromotions": [...]
  }
}
```

### tRPC Procedure Sketch
```ts
// catalogRouter.ts
export const catalogRouter = t.router({
  listProducts: t.procedure.input(listProductSchema).query(async ({ ctx, input }) => {
    return ctx.repos.productRepo.list(input);
  }),
  createProduct: t.procedure.input(createProductSchema).mutation(async ({ ctx, input }) => {
    ctx.authz.require("product.write");
    return ctx.repos.productRepo.create(input);
  })
});
```

### GraphQL Schema Excerpt
```graphql
type Product {
  id: ID!
  name: String!
  slug: String!
  description: String
  variants: [ProductVariant!]!
  prices(currency: String, segmentId: ID, minQty: Int): [ProductPrice!]!
  collections: [Collection!]!
}

type Query {
  product(slug: String!, storeSlug: String!): Product
  searchProducts(query: String!, storeSlug: String!, first: Int, after: String): ProductConnection
}
```

### Caching & Revalidation Strategy
- Tagging: `product:{id}`, `category:{id}`, `collection:{id}`, `price:{productId}`.
- On product update: invalidate product + category + collection tags.
- Use `generateStaticParams` for top N products & categories; fallback dynamic with streaming.
- Private caches for segment-based pricing (`use cache: private`).

### Implementation Phases
| Phase | Focus | Deliverables |
|-------|-------|-------------|
| 1 | Repository pattern + tRPC internal | Scoped repos, initial procedures |
| 2 | REST public baseline | `/products`, `/orders`, `/customers` endpoints |
| 3 | Idempotency + rate limiting | IdempotentRequest table, Redis integration |
| 4 | Promotions & pricing | DiscountCode, PromotionRule evaluation in order pipeline |
| 5 | Fulfillment & returns | Fulfillment API, ReturnRequest workflow |
| 6 | Webhooks & GraphQL | Event emission, GraphQL gateway, query resolvers |
| 7 | Observability & optimization | OpenTelemetry, structured logging, performance budgets |

## Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| Over-complexity early | Phase-based rollout, maintain minimal viable endpoints |
| Data race (inventory) | Transactional reservation + decrement logic |
| Promotion stacking errors | Deterministic evaluation order + unit validation layer |
| Idempotency abuse | TTL on stored responses; limit key cardinality |

## Success Metrics
- P95 order creation latency < 400ms after phase 3.
- Zero unscoped queries detected by repository audit tests.
- <1% failed webhook deliveries after retries.
- <2% payment attempt failure ratio (excluding declined cards) after implementing retries.

## Conclusion
This refactor plan introduces a robust, layered API foundation balancing developer velocity (tRPC) with external integrability (REST + webhooks) and rich composition (GraphQL). Guardrails (tenant scoping, idempotency, rate limiting, RBAC) ensure operational security while enabling future scaling and advanced personalization.
