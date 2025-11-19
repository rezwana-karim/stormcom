# 🔗 API to Dashboard UI Mapping - StormCom

**Last Updated:** November 19, 2025

This document provides a visual mapping between backend APIs and frontend dashboard pages, highlighting integration gaps and missing connections.

---

## 📊 Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully implemented and connected |
| 🔄 | API exists but UI missing |
| 🎨 | UI exists but API missing |
| ⚠️ | Partial implementation |
| ❌ | Both API and UI missing |

---

## 🗺️ Complete Mapping Matrix

### 1. Authentication Module

| UI Component | Dashboard Page | API Endpoint | Status | Notes |
|--------------|----------------|--------------|--------|-------|
| Login Form | `/login` | `POST /api/auth/signin` | ✅ | NextAuth magic link |
| Login Form | `/login` | `POST /api/auth/callback/credentials` | ✅ | Password auth |
| Signup Form | `/signup` | `POST /api/auth/signup` | ⚠️ | Server action exists, no REST API |
| Email Verification | `/verify-email` | `POST /api/auth/verify` | ⚠️ | Handled by NextAuth |
| Logout | Header | `POST /api/auth/signout` | ✅ | NextAuth |

**Overall Status:** ✅ Complete

---

### 2. Products Module

| UI Component | Dashboard Page | API Endpoint | Status | Notes |
|--------------|----------------|--------------|--------|-------|
| Products List | `/dashboard/products` | `GET /api/products` | ✅ | Pagination, filters work |
| Product Detail | `/dashboard/products/[id]` | `GET /api/products/[id]` | ✅ | Full data loaded |
| Create Product Form | `/dashboard/products/new` | `POST /api/products` | ✅ | Form validation working |
| Edit Product Form | `/dashboard/products/[id]` | `PATCH /api/products/[id]` | ✅ | Update works |
| Delete Product Button | `/dashboard/products/[id]` | `DELETE /api/products/[id]` | 🎨 | **UI exists, API missing** |
| Product Search | `/dashboard/products` | `GET /api/products?search=` | ✅ | Search works |
| Filter by Category | `/dashboard/products` | `GET /api/products?categoryId=` | ✅ | Filter works |
| Filter by Brand | `/dashboard/products` | `GET /api/products?brandId=` | ✅ | Filter works |
| Filter by Status | `/dashboard/products` | `GET /api/products?status=` | ✅ | Filter works |
| Product Variants | `/dashboard/products/[id]` | `GET /api/products/[id]/variants` | 🎨 | **DB exists, no API/UI** |
| Bulk Actions | `/dashboard/products` | `POST /api/products/bulk` | ❌ | **Both missing** |
| Import CSV | `/dashboard/products` | `POST /api/products/import` | ❌ | **Both missing** |
| Export CSV | `/dashboard/products` | `GET /api/products/export` | ❌ | **Both missing** |

**Overall Status:** ⚠️ Core CRUD complete, advanced features missing

**Missing Integrations:**
1. Delete product API endpoint
2. Product variants management UI and API
3. Bulk operations (select multiple, bulk edit, bulk delete)
4. CSV import/export

---

### 3. Categories Module

| UI Component | Dashboard Page | API Endpoint | Status | Notes |
|--------------|----------------|--------------|--------|-------|
| Categories List | `/dashboard/categories` | `GET /api/categories` | ✅ | List works |
| Category Tree View | `/dashboard/categories` | `GET /api/categories/tree` | ✅ | Hierarchical tree |
| Category Detail | `/dashboard/categories/[slug]` | `GET /api/categories/[slug]` | ✅ | Full data loaded |
| Create Category Form | `/dashboard/categories/new` | `POST /api/categories` | ✅ | Form works |
| Edit Category Form | `/dashboard/categories/[slug]` | `PATCH /api/categories/[slug]` | ✅ | Update works |
| Delete Category Button | `/dashboard/categories/[slug]` | `DELETE /api/categories/[slug]` | ✅ | Soft delete works |
| Parent Category Selector | Forms | `GET /api/categories?parent=null` | ✅ | Loads parents |
| Category Reordering | `/dashboard/categories` | `PATCH /api/categories/reorder` | ❌ | **Both missing** |
| Category Products Count | `/dashboard/categories` | `GET /api/categories/[slug]/stats` | ❌ | **Both missing** |

**Overall Status:** ✅ Complete for basic CRUD, missing advanced features

**Missing Integrations:**
1. Drag-and-drop reordering UI and API
2. Category statistics (product count, revenue)

---

### 4. Brands Module

| UI Component | Dashboard Page | API Endpoint | Status | Notes |
|--------------|----------------|--------------|--------|-------|
| Brands List | `/dashboard/brands` | `GET /api/brands` | ✅ | List works |
| Brand Detail | `/dashboard/brands/[slug]` | `GET /api/brands/[slug]` | ✅ | Full data loaded |
| Create Brand Form | `/dashboard/brands/new` | `POST /api/brands` | ✅ | Form works |
| Edit Brand Form | `/dashboard/brands/[slug]` | `PATCH /api/brands/[slug]` | ✅ | Update works |
| Delete Brand Button | `/dashboard/brands/[slug]` | `DELETE /api/brands/[slug]` | ✅ | Soft delete works |
| Brand Logo Upload | Forms | `POST /api/brands/upload` | 🎨 | **UI placeholder, no upload** |
| Brand Products List | `/dashboard/brands/[slug]` | `GET /api/brands/[slug]/products` | ❌ | **Both missing** |
| Brand Stats | `/dashboard/brands/[slug]` | `GET /api/brands/[slug]/stats` | ❌ | **Both missing** |

**Overall Status:** ✅ Complete for basic CRUD

**Missing Integrations:**
1. Logo upload functionality (storage + API)
2. Brand products listing
3. Brand statistics

---

### 5. Orders Module

| UI Component | Dashboard Page | API Endpoint | Status | Notes |
|--------------|----------------|--------------|--------|-------|
| Orders List | `/dashboard/orders` | `GET /api/orders` | ✅ | Pagination works |
| Order Detail | `/dashboard/orders/[id]` | `GET /api/orders/[id]` | ✅ | Full data with items |
| Filter by Status | `/dashboard/orders` | `GET /api/orders?status=` | ✅ | Filter works |
| Search Orders | `/dashboard/orders` | `GET /api/orders?search=` | ✅ | Search works |
| Date Range Filter | `/dashboard/orders` | `GET /api/orders?dateFrom=&dateTo=` | ✅ | Filter works |
| Update Order Status | `/dashboard/orders/[id]` | `PATCH /api/orders/[id]/status` | 🔄 | **API exists, UI basic** |
| Create Order (Admin) | `/dashboard/orders/new` | `POST /api/orders` | ❌ | **Both missing** |
| Cancel Order | `/dashboard/orders/[id]` | `POST /api/orders/[id]/cancel` | ❌ | **Both missing** |
| Refund Order | `/dashboard/orders/[id]` | `POST /api/orders/[id]/refund` | ❌ | **Both missing** |
| Print Invoice | `/dashboard/orders/[id]` | `GET /api/orders/[id]/invoice.pdf` | ❌ | **Both missing** |
| Order Timeline | `/dashboard/orders/[id]` | `GET /api/orders/[id]/timeline` | 🎨 | **UI basic, API missing** |
| Shipping Label | `/dashboard/orders/[id]` | `POST /api/orders/[id]/shipping-label` | ❌ | **Both missing** |

**Overall Status:** ⚠️ Viewing works, management features missing

**Missing Integrations:**
1. Admin order creation
2. Cancel/refund workflows with reason tracking
3. Invoice generation (PDF)
4. Shipping label generation
5. Email notifications on status changes

---

### 6. Customers Module

| UI Component | Dashboard Page | API Endpoint | Status | Notes |
|--------------|----------------|--------------|--------|-------|
| Customers List | `/dashboard/customers` | `GET /api/customers` | ❌ | **Both missing** |
| Customer Detail | `/dashboard/customers/[id]` | `GET /api/customers/[id]` | ❌ | **Both missing** |
| Create Customer | `/dashboard/customers/new` | `POST /api/customers` | ❌ | **Both missing** |
| Edit Customer | `/dashboard/customers/[id]` | `PATCH /api/customers/[id]` | ❌ | **Both missing** |
| Customer Orders | `/dashboard/customers/[id]` | `GET /api/customers/[id]/orders` | ❌ | **Both missing** |
| Customer Stats | `/dashboard/customers/[id]` | `GET /api/customers/[id]/stats` | ❌ | **Both missing** |
| Customer Reviews | `/dashboard/customers/[id]` | `GET /api/customers/[id]/reviews` | ❌ | **Both missing** |

**Overall Status:** ❌ Completely missing (Critical Gap)

**Priority:** 🔥 High - Core e-commerce feature

---

### 7. Inventory Module

| UI Component | Dashboard Page | API Endpoint | Status | Notes |
|--------------|----------------|--------------|--------|-------|
| Inventory List | `/dashboard/inventory` | `GET /api/inventory` | ❌ | **Both missing** |
| Stock Levels | `/dashboard/inventory` | `GET /api/inventory?storeId=` | ❌ | **Both missing** |
| Adjust Stock Modal | `/dashboard/inventory` | `POST /api/inventory/adjust` | ❌ | **Both missing** |
| Low Stock Alerts | `/dashboard/inventory` | `GET /api/inventory/low-stock` | ❌ | **Both missing** |
| Movement History | `/dashboard/inventory/movements` | `GET /api/inventory/movements` | ❌ | **Both missing** |
| Bulk Stock Update | `/dashboard/inventory` | `POST /api/inventory/bulk-update` | ❌ | **Both missing** |

**Overall Status:** ❌ Completely missing (Critical Gap)

**Priority:** 🔥 High - Core e-commerce feature

---

### 8. Dashboard / Analytics

| UI Component | Dashboard Page | API Endpoint | Status | Notes |
|--------------|----------------|--------------|--------|-------|
| Revenue Card | `/dashboard` | `GET /api/analytics/revenue` | 🎨 | **Using mock data.json** |
| Orders Card | `/dashboard` | `GET /api/analytics/orders` | 🎨 | **Using mock data.json** |
| Customers Card | `/dashboard` | `GET /api/analytics/customers` | 🎨 | **Using mock data.json** |
| Conversion Card | `/dashboard` | `GET /api/analytics/conversion` | 🎨 | **Using mock data.json** |
| Sales Chart | `/dashboard` | `GET /api/analytics/sales` | 🎨 | **Using mock data.json** |
| Recent Orders Table | `/dashboard` | `GET /api/orders?perPage=10` | ✅ | **Can use existing API** |
| Top Products | `/dashboard` | `GET /api/analytics/products/top` | ❌ | **Both missing** |
| Date Range Filter | `/dashboard` | All analytics APIs | ❌ | **No date filter support** |

**Overall Status:** 🎨 UI exists with mock data, real APIs needed

**Priority:** 🔥 High - First impression, business intelligence

**Action Items:**
1. Create `AnalyticsService`
2. Implement 6+ analytics endpoints
3. Replace mock data with API calls
4. Add date range picker

---

### 9. Checkout Flow

| UI Component | Dashboard Page | API Endpoint | Status | Notes |
|--------------|----------------|--------------|--------|-------|
| Cart | `/cart` (frontend) | `GET /api/cart` | ❌ | **Both missing** |
| Add to Cart | Product pages | `POST /api/cart/items` | ❌ | **Both missing** |
| Update Quantity | Cart | `PATCH /api/cart/items/[id]` | ❌ | **Both missing** |
| Remove Item | Cart | `DELETE /api/cart/items/[id]` | ❌ | **Both missing** |
| Apply Discount | Cart | `POST /api/cart/apply-discount` | ❌ | **Both missing** |
| Validate Cart | Checkout | `POST /api/checkout/validate` | 🔄 | **Service exists, route missing** |
| Calculate Shipping | Checkout | `POST /api/checkout/shipping` | 🔄 | **Service exists, route missing** |
| Create Payment Intent | Checkout | `POST /api/checkout/payment-intent` | ❌ | **Both missing** |
| Complete Order | Checkout | `POST /api/checkout/complete` | 🔄 | **Service exists, route missing** |

**Overall Status:** 🔄 Backend logic exists, APIs not exposed, frontend missing

**Priority:** 🔥 Critical - Cannot sell anything without checkout

**Action Items:**
1. Create route files for checkout APIs (validate, shipping, complete)
2. Build frontend checkout flow
3. Implement cart database model and APIs
4. Integrate Stripe payment

---

### 10. Store Settings

| UI Component | Dashboard Page | API Endpoint | Status | Notes |
|--------------|----------------|--------------|--------|-------|
| Store Info Form | `/dashboard/settings/store` | `PATCH /api/stores/[id]` | ❌ | **Both missing** |
| Store Logo Upload | `/dashboard/settings/store` | `POST /api/stores/[id]/logo` | ❌ | **Both missing** |
| Payment Gateway Config | `/dashboard/settings/payment` | `PATCH /api/stores/[id]/payment` | ❌ | **Both missing** |
| Shipping Settings | `/dashboard/settings/shipping` | `GET /api/shipping-methods` | ❌ | **Both missing** |
| Tax Settings | `/dashboard/settings/tax` | `PATCH /api/stores/[id]/tax` | ❌ | **Both missing** |
| Currency Settings | `/dashboard/settings/currency` | `PATCH /api/stores/[id]/currency` | ❌ | **Both missing** |

**Overall Status:** ❌ Completely missing

**Priority:** ⚠️ Medium - Needed for multi-store setup

---

### 11. Discounts & Coupons

| UI Component | Dashboard Page | API Endpoint | Status | Notes |
|--------------|----------------|--------------|--------|-------|
| Discounts List | `/dashboard/discounts` | `GET /api/discounts` | ❌ | **Both missing** |
| Create Discount | `/dashboard/discounts/new` | `POST /api/discounts` | ❌ | **Both missing** |
| Edit Discount | `/dashboard/discounts/[id]` | `PATCH /api/discounts/[id]` | ❌ | **Both missing** |
| Delete Discount | `/dashboard/discounts/[id]` | `DELETE /api/discounts/[id]` | ❌ | **Both missing** |
| Validate Coupon Code | Checkout | `POST /api/discounts/validate` | ❌ | **Both missing** |
| Discount Usage Stats | `/dashboard/discounts/[id]` | `GET /api/discounts/[id]/stats` | ❌ | **Both missing** |

**Overall Status:** ❌ Completely missing

**Priority:** ⚠️ Medium - Marketing feature

---

### 12. Reviews Management

| UI Component | Dashboard Page | API Endpoint | Status | Notes |
|--------------|----------------|--------------|--------|-------|
| Reviews List (Admin) | `/dashboard/reviews` | `GET /api/reviews` | ❌ | **Both missing** |
| Approve Review | `/dashboard/reviews` | `PATCH /api/reviews/[id]/approve` | ❌ | **Both missing** |
| Reject Review | `/dashboard/reviews` | `DELETE /api/reviews/[id]` | ❌ | **Both missing** |
| Product Reviews (Frontend) | Product page | `GET /api/products/[id]/reviews` | ❌ | **Both missing** |
| Submit Review | Product page | `POST /api/reviews` | ❌ | **Both missing** |
| Review Stats | Product detail | `GET /api/products/[id]/review-stats` | ❌ | **Both missing** |

**Overall Status:** ❌ Completely missing

**Priority:** 📊 Medium - Social proof feature

---

### 13. Shipping Methods

| UI Component | Dashboard Page | API Endpoint | Status | Notes |
|--------------|----------------|--------------|--------|-------|
| Shipping Methods List | `/dashboard/settings/shipping` | `GET /api/shipping-methods` | ❌ | **Both missing** |
| Create Shipping Method | `/dashboard/settings/shipping/new` | `POST /api/shipping-methods` | ❌ | **Both missing** |
| Edit Shipping Method | `/dashboard/settings/shipping/[id]` | `PATCH /api/shipping-methods/[id]` | ❌ | **Both missing** |
| Delete Shipping Method | `/dashboard/settings/shipping/[id]` | `DELETE /api/shipping-methods/[id]` | ❌ | **Both missing** |
| Shipping Zones | `/dashboard/settings/shipping/zones` | `GET /api/shipping-zones` | ❌ | **Both missing** |

**Overall Status:** ❌ Completely missing

**Priority:** ⚠️ High - Required for order fulfillment

---

### 14. Product Attributes

| UI Component | Dashboard Page | API Endpoint | Status | Notes |
|--------------|----------------|--------------|--------|-------|
| Attributes List | `/dashboard/attributes` | `GET /api/attributes` | ❌ | **Both missing** |
| Create Attribute | `/dashboard/attributes/new` | `POST /api/attributes` | ❌ | **Both missing** |
| Edit Attribute | `/dashboard/attributes/[id]` | `PATCH /api/attributes/[id]` | ❌ | **Both missing** |
| Delete Attribute | `/dashboard/attributes/[id]` | `DELETE /api/attributes/[id]` | ❌ | **Both missing** |
| Product Attribute Values | Product form | `GET /api/products/[id]/attributes` | ❌ | **Both missing** |

**Overall Status:** ❌ Completely missing (DB schema exists)

**Priority:** 📦 Medium - Advanced product features

---

### 15. Organizations & Teams

| UI Component | Dashboard Page | API Endpoint | Status | Notes |
|--------------|----------------|--------------|--------|-------|
| Organization Selector | Header | `GET /api/organizations` | ⚠️ | **Partial - needs list endpoint** |
| Create Organization | Onboarding | `POST /api/organizations` | ✅ | Works |
| Team Members List | `/team` | `GET /api/organizations/[slug]/members` | ❌ | **UI placeholder** |
| Invite Member | `/team` | `POST /api/organizations/[slug]/invite` | ✅ | API exists |
| Remove Member | `/team` | `DELETE /api/organizations/[slug]/members/[id]` | ❌ | **Both missing** |
| Update Member Role | `/team` | `PATCH /api/organizations/[slug]/members/[id]` | ❌ | **Both missing** |

**Overall Status:** ⚠️ Basic create/invite works, full management missing

**Priority:** ⚠️ Medium - Multi-tenant feature

---

### 16. User Settings

| UI Component | Dashboard Page | API Endpoint | Status | Notes |
|--------------|----------------|--------------|--------|-------|
| Profile Form | `/settings` | `PATCH /api/user/profile` | ❌ | **Both missing** |
| Change Password | `/settings` | `POST /api/user/change-password` | ❌ | **Both missing** |
| Email Settings | `/settings` | `PATCH /api/user/email-preferences` | ❌ | **Both missing** |
| Avatar Upload | `/settings` | `POST /api/user/avatar` | ❌ | **Both missing** |
| Delete Account | `/settings` | `DELETE /api/user` | ❌ | **Both missing** |

**Overall Status:** ⚠️ Settings page exists, no functionality

**Priority:** 📊 Medium - User experience

---

### 17. Projects (Placeholder)

| UI Component | Dashboard Page | API Endpoint | Status | Notes |
|--------------|----------------|--------------|--------|-------|
| Projects List | `/projects` | `GET /api/projects` | ❌ | **Both missing** |
| Create Project | `/projects/new` | `POST /api/projects` | ❌ | **Both missing** |
| Project Detail | `/projects/[id]` | `GET /api/projects/[id]` | ❌ | **Both missing** |

**Overall Status:** ❌ Placeholder page only (DB schema exists)

**Priority:** 📦 Low - Not clear what "Projects" means in e-commerce context

---

## 📈 Summary Statistics

### Implementation Status

| Category | ✅ Complete | ⚠️ Partial | 🔄 Service Only | 🎨 UI Only | ❌ Missing | Total |
|----------|-------------|------------|-----------------|-----------|-----------|-------|
| **Products** | 9 | 0 | 0 | 1 | 4 | 14 |
| **Categories** | 7 | 0 | 0 | 0 | 2 | 9 |
| **Brands** | 5 | 0 | 0 | 1 | 3 | 9 |
| **Orders** | 5 | 1 | 0 | 1 | 6 | 13 |
| **Customers** | 0 | 0 | 0 | 0 | 7 | 7 |
| **Inventory** | 0 | 0 | 0 | 0 | 6 | 6 |
| **Dashboard** | 1 | 0 | 0 | 7 | 1 | 9 |
| **Checkout** | 0 | 0 | 3 | 0 | 6 | 9 |
| **Store Settings** | 0 | 0 | 0 | 0 | 6 | 6 |
| **Discounts** | 0 | 0 | 0 | 0 | 6 | 6 |
| **Reviews** | 0 | 0 | 0 | 0 | 6 | 6 |
| **Shipping** | 0 | 0 | 0 | 0 | 5 | 5 |
| **Attributes** | 0 | 0 | 0 | 0 | 5 | 5 |
| **Organizations** | 2 | 1 | 0 | 0 | 3 | 6 |
| **User Settings** | 0 | 1 | 0 | 0 | 5 | 6 |
| **Projects** | 0 | 0 | 0 | 0 | 3 | 3 |
| **TOTAL** | **29** | **3** | **3** | **10** | **68** | **113** |

### Coverage Percentages

- **Fully Complete:** 29/113 = **25.7%**
- **Has Backend:** 32/113 = **28.3%** (Complete + Partial + Service Only)
- **Has Frontend:** 39/113 = **34.5%** (Complete + Partial + UI Only)
- **No Implementation:** 68/113 = **60.2%**

---

## 🎯 Critical Integration Gaps (Priority Order)

### 🔥 P0: Blocks Core Functionality

1. **Checkout APIs** (3 endpoints)
   - Expose existing `CheckoutService` methods
   - Required for: Order creation
   - Effort: 4 hours

2. **Product Delete** (1 endpoint)
   - Add `DELETE /api/products/[id]`
   - Required for: Product management
   - Effort: 2 hours

3. **Dashboard Analytics** (6 endpoints)
   - Create `AnalyticsService`
   - Replace mock data
   - Required for: Business insights
   - Effort: 1 week

### 🔥 P1: Essential E-commerce Features

4. **Inventory Management** (6 endpoints + UI)
   - Create database models, service, APIs, dashboard page
   - Required for: Stock tracking, preventing overselling
   - Effort: 1 week

5. **Customer Management** (7 endpoints + UI)
   - Create service, APIs, dashboard page
   - Required for: Customer database, order history
   - Effort: 1 week

6. **Cart & Session** (4 endpoints + UI)
   - Create database models, service, APIs, checkout flow
   - Required for: Shopping experience
   - Effort: 1 week

### ⚠️ P2: Important Business Features

7. **Store Settings** (6 endpoints + UI)
   - Enable store configuration
   - Required for: Multi-store setup
   - Effort: 1 week

8. **Shipping Methods** (5 endpoints + UI)
   - Configure delivery options
   - Required for: Order fulfillment
   - Effort: 1 week

9. **Discounts** (6 endpoints + UI)
   - Coupon management
   - Required for: Marketing campaigns
   - Effort: 1 week

### 📊 P3: Advanced Features

10. **Reviews** (6 endpoints + UI)
    - Product reviews and moderation
    - Required for: Social proof
    - Effort: 1 week

11. **Attributes** (5 endpoints + UI)
    - Product attributes and variants
    - Required for: Complex products
    - Effort: 1 week

12. **Bulk Operations** (6 endpoints + UI)
    - Import/export, bulk edit
    - Required for: Efficiency
    - Effort: 1 week

---

## 🔍 Quick Action Items

### Immediate Fixes (< 1 day)

1. ✅ Expose checkout routes (4 hours)
2. ✅ Add product delete endpoint (2 hours)
3. ✅ Fix TypeScript error in categories API (15 min)
4. ✅ Add loading skeletons to pages (3 hours)

### This Week (1-2 days)

5. ✅ Create analytics APIs (2 days)
6. ✅ Connect dashboard to real data (1 day)
7. ✅ Implement image upload (storage + component) (2 days)

### Next Sprint (1-2 weeks)

8. ✅ Inventory module (1 week)
9. ✅ Customer module (1 week)
10. ✅ Cart & checkout flow (1 week)

---

## 📋 Testing Checklist

For each completed integration:

- [ ] API endpoint responds with correct status codes
- [ ] API validates input with Zod schemas
- [ ] API enforces multi-tenant isolation (storeId checks)
- [ ] API has rate limiting (where applicable)
- [ ] UI displays loading state during API call
- [ ] UI handles API errors gracefully
- [ ] UI shows success feedback (toast notification)
- [ ] Form validation matches API validation
- [ ] Data refreshes after mutations
- [ ] Pagination works (if applicable)
- [ ] Search/filters work (if applicable)
- [ ] Mobile responsive
- [ ] Keyboard accessible
- [ ] Screen reader tested

---

**End of Mapping Document**  
**Generated:** November 19, 2025
