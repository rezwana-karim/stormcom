# API-to-UI Mapping Analysis
**Generated**: November 23, 2024  
**Current Status**: 46 API routes, Partial UI coverage

## Overview
This document maps all 46 existing API endpoints to their corresponding UI components, identifying gaps where UI implementation is needed.

---

## ✅ Complete Modules (API + UI)

### 1. **Products Module** (5 APIs, UI Complete)
**APIs**:
- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `GET /api/products/[id]` - Get product details
- `PATCH /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

**UI**:
- ✅ `/dashboard/products` - Product list page
- ✅ `/dashboard/products/new` - Create product page
- ✅ `/dashboard/products/[id]` - Edit product page

---

### 2. **Stores Module** (5 APIs, UI Complete)
**APIs**:
- `GET /api/stores` - List stores
- `POST /api/stores` - Create store
- `GET /api/stores/[id]` - Get store details
- `PATCH /api/stores/[id]` - Update store
- `DELETE /api/stores/[id]` - Delete store

**UI**:
- ✅ `/dashboard/stores` - Stores management page

---

### 3. **Categories Module** (5 APIs, UI Complete)
**APIs**:
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `GET /api/categories/[slug]` - Get category
- `PATCH /api/categories/[slug]` - Update category
- `DELETE /api/categories/[slug]` - Delete category
- `GET /api/categories/tree` - Category hierarchy

**UI**:
- ✅ `/dashboard/categories` - Categories list
- ✅ `/dashboard/categories/new` - Create category
- ✅ `/dashboard/categories/[slug]` - Edit category

---

### 4. **Brands Module** (5 APIs, UI Complete)
**APIs**:
- `GET /api/brands` - List brands
- `POST /api/brands` - Create brand
- `GET /api/brands/[slug]` - Get brand
- `PATCH /api/brands/[slug]` - Update brand
- `DELETE /api/brands/[slug]` - Delete brand

**UI**:
- ✅ `/dashboard/brands` - Brands list
- ✅ `/dashboard/brands/new` - Create brand
- ✅ `/dashboard/brands/[slug]` - Edit brand

---

### 5. **Attributes Module** (5 APIs, UI Complete)
**APIs**:
- `GET /api/attributes` - List attributes
- `POST /api/attributes` - Create attribute
- `GET /api/attributes/[id]` - Get attribute
- `PATCH /api/attributes/[id]` - Update attribute
- `DELETE /api/attributes/[id]` - Delete attribute

**UI**:
- ✅ `/dashboard/attributes` - Attributes list
- ✅ `/dashboard/attributes/new` - Create attribute
- ✅ `/dashboard/attributes/[id]` - Edit attribute

---

### 6. **Inventory Module** (2 APIs, UI Complete)
**APIs**:
- `GET /api/inventory` - List inventory levels
- `POST /api/inventory/adjust` - Adjust stock levels

**UI**:
- ✅ `/dashboard/inventory` - Inventory management page

---

### 7. **Orders Module** (6 APIs, UI Partial)
**APIs**:
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `GET /api/orders/[id]` - Get order details
- `POST /api/orders/[id]/cancel` - Cancel order
- `POST /api/orders/[id]/refund` - Refund order
- `PATCH /api/orders/[id]/status` - Update order status ✅ **NEW**
- `GET /api/orders/[id]/invoice` - Generate PDF invoice ✅ **NEW**

**UI**:
- ✅ `/dashboard/orders` - Orders list page
- ✅ `/dashboard/orders/[id]` - Order detail page
- ⚠️ **NEEDS ENHANCEMENT**:
  - Add invoice download button (connect to `/api/orders/[id]/invoice`)
  - Add status update dropdown (connect to `/api/orders/[id]/status`)
  - Add tracking information display
  - Enhance cancel/refund action buttons

---

## ❌ Missing UI Modules (APIs exist, UI needed)

### 8. **Analytics Module** (5 APIs, ❌ NO UI)
**APIs**:
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/revenue` - Revenue analytics
- `GET /api/analytics/sales` - Sales analytics
- `GET /api/analytics/products/top` - Top products
- `GET /api/analytics/customers` - Customer metrics ✅ **NEW**

**Missing UI**: **HIGH PRIORITY**
- ❌ `/dashboard/analytics` - Analytics dashboard page
- **Components Needed**:
  - Revenue chart (line/bar chart)
  - Sales trends chart
  - Top products table
  - Customer acquisition/retention metrics
  - Dashboard grid with stat cards
- **shadcn-ui Components**: Card, Chart (recharts), Table, Tabs

---

### 9. **Customers Module** (5 APIs, ❌ NO UI)
**APIs**:
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET /api/customers/[id]` - Get customer details
- `PATCH /api/customers/[id]` - Update customer
- `DELETE /api/customers/[id]` - Delete customer

**Missing UI**: **HIGH PRIORITY**
- ❌ `/dashboard/customers` - Customers management page
- **Components Needed**:
  - Customer list DataTable
  - Search and filters (name, email, order count)
  - Customer detail dialog
  - Customer metrics summary cards
  - Export to CSV button
- **Similar To**: Products/Stores pages (use existing patterns)

---

### 10. **Checkout Module** (4 APIs, ❌ NO UI)
**APIs**:
- `POST /api/checkout/validate` - Validate cart
- `POST /api/checkout/shipping` - Calculate shipping
- `POST /api/checkout/payment-intent` - Create payment intent ✅ **NEW**
- `POST /api/checkout/complete` - Finalize order

**Missing UI**: **CRITICAL** (Revenue-blocking)
- ❌ `/checkout` - Multi-step checkout flow
- **Pages Needed**:
  1. `/checkout/cart` - Cart review
  2. `/checkout/shipping` - Shipping details form
  3. `/checkout/payment` - Payment method (Stripe Elements)
  4. `/checkout/confirmation` - Order confirmation
- **Components Needed**:
  - Multi-step progress indicator
  - Cart summary sidebar
  - Shipping address form
  - Payment form (Stripe integration)
  - Order summary review
- **shadcn-ui Components**: Form, Input, Select, Button, Card, Stepper

---

### 11. **Reviews Module** (5 APIs, ❌ NO UI)
**APIs**:
- `GET /api/reviews` - List reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/[id]` - Get review details
- `PATCH /api/reviews/[id]` - Update review
- `DELETE /api/reviews/[id]` - Delete review
- `POST /api/reviews/[id]/approve` - Approve review

**Missing UI**: **MEDIUM PRIORITY**
- ❌ `/dashboard/reviews` - Reviews management page
- **Components Needed**:
  - Reviews list with moderation actions
  - Review detail modal
  - Approve/reject buttons
  - Star rating display
  - Bulk actions (approve, delete)
- **Integration**: Add review section to product detail pages

---

### 12. **Subscriptions Module** (2 APIs, ❌ NO UI)
**APIs**:
- `GET /api/subscriptions` - Get subscription details ✅ **NEW**
- `POST /api/subscriptions` - Create checkout session ✅ **NEW**
- `PATCH /api/subscriptions/[id]` - Update subscription ✅ **NEW**

**Missing UI**: **HIGH PRIORITY**
- ❌ `/settings/subscription` - Subscription management page
- **Components Needed**:
  - Current plan card (FREE, BASIC, PRO, ENTERPRISE)
  - Plan comparison table
  - Upgrade/downgrade buttons
  - Usage metrics (products, orders vs limits)
  - Trial/subscription expiration countdown
  - Billing history
- **Note**: Connects to monetization strategy

---

### 13. **Themes Module** (1 API, ❌ NO UI)
**APIs**:
- `GET /api/themes` - List available themes ✅ **NEW**

**Missing UI**: **LOW PRIORITY**
- ❌ `/settings/themes` - Theme customization page
- **Components Needed**:
  - Theme preview cards
  - Apply theme button
  - Color picker for customization
  - Font selector
  - Live preview iframe
- **Note**: Premium feature, can be deferred

---

### 14. **Notifications Module** (2 APIs, ❌ NO UI)
**APIs**:
- `GET /api/notifications` - List notifications ✅ **NEW**
- `PATCH /api/notifications/[id]/read` - Mark as read ✅ **NEW**

**Missing UI**: **MEDIUM PRIORITY**
- ❌ Notification bell icon in header
- ❌ Notification dropdown popover
- **Components Needed**:
  - Bell icon with unread count badge
  - Dropdown popover with notification list
  - "Mark all as read" button
  - Notification type icons (order, system, review)
  - Timestamp display (relative time)
- **shadcn-ui Components**: Popover, Badge, Button, ScrollArea

---

## 🔧 Utility APIs (No dedicated UI needed)

### 15. **Authentication** (1 API)
- `POST /api/auth/[...nextauth]` - NextAuth handler
- **UI**: Login/Signup pages already exist ✅

### 16. **CSRF Protection** (1 API)
- `GET /api/csrf-token` - Get CSRF token
- **UI**: Not needed (used internally)

### 17. **Organizations** (2 APIs)
- `GET /api/organizations` - List organizations
- `POST /api/organizations/[slug]/invite` - Invite member
- **UI**: Exists in `/team` page ✅

### 18. **Audit Logs** (1 API)
- `GET /api/audit-logs` - List audit logs
- **UI**: Could add to `/settings/security` (low priority)

---

## Implementation Priority

### **Phase 1: Critical for MVP** (Must Have)
1. **Checkout Flow UI** - Revenue-blocking, 4 pages
2. **Analytics Dashboard UI** - Business insights, 1 page
3. **Customers Dashboard UI** - Customer management, 1 page

**Estimated Effort**: ~3 hours

---

### **Phase 2: High Value** (Should Have)
4. **Subscriptions UI** - Monetization, 1 page
5. **Notifications UI** - User engagement, header component
6. **Reviews Management UI** - Product quality, 1 page
7. **Orders Enhancement** - Better fulfillment UX, existing page updates

**Estimated Effort**: ~3 hours

---

### **Phase 3: Nice to Have** (Could Have)
8. **Themes UI** - Customization, 1 page
9. **Audit Logs UI** - Security/compliance, 1 page

**Estimated Effort**: ~1 hour

---

## Summary Statistics

| Metric | Count | Notes |
|--------|-------|-------|
| **Total API Routes** | 46 | Up from 35 at session start |
| **APIs Added This Session** | 11 | 6 before this request, 5 just now |
| **Complete Modules** | 7 | Products, Stores, Categories, Brands, Attributes, Inventory, Auth |
| **Partial Modules** | 2 | Orders (needs enhancements), Organizations (basic UI) |
| **Missing UI Modules** | 7 | Analytics, Customers, Checkout, Reviews, Subscriptions, Themes, Notifications |
| **Critical Missing UI** | 3 | Checkout, Analytics, Customers |
| **Total Estimated UI Work** | ~7 hours | 3h critical + 3h high + 1h nice-to-have |

---

## Next Actions

1. ✅ **Completed**: Added Subscriptions (2), Themes (1), Notifications (2) APIs - 46 routes total
2. ✅ **Completed**: API-to-UI mapping analysis (this document)
3. **NOW**: Implement **Checkout Flow UI** (critical, revenue-blocking)
4. **THEN**: Implement **Analytics Dashboard UI** (high value)
5. **THEN**: Implement **Customers Dashboard UI** (high value)

---

## Technical Notes

- **Reusable Patterns**: Customers UI can copy from Stores/Products pages (DataTable, dialogs, filters)
- **shadcn-ui Components**: All needed components already installed (Card, Table, Form, Dialog, Chart)
- **Mock Data**: Some APIs use mock data (Themes, Notifications) - clearly marked with TODOs
- **Stripe Integration**: Checkout and Subscriptions use placeholder Stripe code - needs real SDK
- **Data Consistency**: All APIs follow multi-tenant isolation (storeId filtering)
