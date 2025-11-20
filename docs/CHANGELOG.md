# StormCom UI Changelog

All notable changes to this repository are documented here. This log includes prior stabilization fixes and the current dashboard/API debugging task.

## 2025-11-20

### Fixed – Attributes module
- Edit page params (Next.js 16 dynamic params): Updated `src/app/dashboard/attributes/[id]/page.tsx`
  - Change: Treat `params` as a Promise per Next.js 16. `params: Promise<{ id: string }>` and `const { id } = await params;`
  - Reason: Avoided runtime error "Route used `params.id`. `params` is a Promise" and eliminated undefined `id` in client.
- Switched to client-side data fetch on Edit page
  - Added `src/components/attribute-edit-client.tsx` to fetch `/api/attributes/:id` client-side and render `AttributeForm` when ready.
  - Reason: Avoid Prisma usage during SSR and cookie forwarding complexity; ensures robust loading on Node runtime without Edge constraints.
- API param handling fix for dynamic routes
  - Updated `src/app/api/attributes/[id]/route.ts` to use proper handler signature `(req, { params })` and added fallback extraction from `request.nextUrl.pathname`.
  - Reason: `params.id` was resolving to `undefined` in route context, causing Prisma to be called with `id: undefined` and 500s. Fallback ensures resilience.
- Improved error responses for diagnostics
  - Enhanced GET `/api/attributes/[id]` 500 response to include `details` with the error message for faster debugging.
- Attributes list/new verified end-to-end
  - Created attribute "Color" with values `[Red, Green, Yellow]` via UI; verified presence on list and successfully loaded on Edit page.

### Prior stabilization work (from previous session)
- Attribute service typing and JSON handling
  - File: `src/lib/services/attribute.service.ts`
  - Change: Explicitly typed Prisma results; ensured `values` is parsed to `string[]`; included `_count.productValues` in list/get/update responses.
  - Reason: Removed implicit anys and ensured API/UI get consistent typed data.
- Attribute routes safety and validation
  - Files: `src/app/api/attributes/route.ts`, `src/app/api/attributes/[id]/route.ts`
  - Change: Safer `catch` blocks with `unknown` narrowing; preserved Zod `.issues` on 400 responses; conflict/not-found errors mapped to 409/404.
- Product service update shape and normalization
  - File: `src/lib/services/product.service.ts`
  - Change: Stringified `images` for Prisma update input; improved `normalizeProductFields` signature (`unknown` → typed casts).
  - Reason: Fixed Prisma input type mismatch and avoided spreading arrays into Prisma update.
- Category service typing cleanup
  - File: `src/lib/services/category.service.ts`
  - Change: Cast certain Prisma find results to `CategoryWithRelations | null` to avoid implicit anys.
- Brand/Category form props alignment
  - Files: `src/components/brand-form-client.tsx`, `src/components/category-form-client.tsx` and calling pages
  - Change: Aligned prop names (`_storeId`) and used `void _storeId` to avoid unused var linting.

### Known issues and follow-ups
- Brands and Categories pages are UI stubs (from dashboard template)
  - Current: List pages show "Loading …" and New pages render forms, but no API wiring exists (`/api/brands`, `/api/categories` missing).
  - Action: Implement Brand/Category APIs and wire form submissions; add list/fetch handlers and tables.
- Products and Orders modules need full verification
  - Current: Not fully exercised in this pass.
  - Action: Walk through creation/edit flows after API wiring; ensure Prisma models align with inputs.
- Source map warnings during dev (non-blocking)
  - Logged: "Invalid source map" warnings from dev chunks; informational only.

---

## 2025-11-19

- Attributes list/create endpoints verified functional.
- Implemented `AttributeForm` and pages: list and new; validated create flow via browser automation.
- General lint and types cleanup across services and route handlers.
