# Database Schema Analysis & Issues Report

**Date**: November 23, 2025  
**Schema**: Prisma SQLite (Development)  
**Status**: 70% Complete - Critical Issues Identified  
**Total Models**: 22 (NextAuth: 4, Multi-tenant: 4, E-commerce: 14)

---

## Executive Summary

The StormCom database schema provides a solid foundation for multi-tenant SaaS e-commerce but contains **2 critical errors**, **6 high-priority missing features**, and **15+ data integrity issues** that must be addressed before production deployment.

### Critical Findings

🔴 **BLOCKER**: Review model has broken foreign key (Prisma validation will fail)  
🔴 **BLOCKER**: User→Customer 1:1 relationship prevents multi-store customer accounts  
🟡 **HIGH**: No Cart/CartItem tables (fundamental e-commerce requirement)  
🟡 **HIGH**: Float used for prices (precision errors inevitable)  
🟡 **HIGH**: No payment transaction audit trail  
🟡 **HIGH**: No coupon validation system

---

## Table of Contents

1. [Critical Schema Errors (P0)](#1-critical-schema-errors-p0)
2. [Missing Core Features (P1)](#2-missing-core-features-p1)
3. [Data Integrity Issues (P2)](#3-data-integrity-issues-p2)
4. [Business Logic Gaps (P2)](#4-business-logic-gaps-p2)
5. [Performance & Indexing (P3)](#5-performance--indexing-p3)
6. [Security & Compliance (P3)](#6-security--compliance-p3)
7. [Normalization Issues (P4)](#7-normalization-issues-p4)
8. [PostgreSQL Migration Prep (P4)](#8-postgresql-migration-prep-p4)
9. [Recommended ERD (See Separate File)](#9-recommended-erd)
10. [Migration Roadmap](#10-migration-roadmap)

---

## 1. Critical Schema Errors (P0)

### Issue 1.1: Review Model - Broken Foreign Key Relation

**Current State**:
```prisma
model Review {
  id        String   @id @default(cuid())
  storeId   String   // ❌ Field exists but no relation defined
  productId String
  product   Product  @relation(...)
  // Missing: store Store @relation(...)
}

model Store {
  // Missing: reviews Review[]
}
```

**Problem**: 
- `storeId` field exists but has no foreign key constraint
- Prisma validation will fail or ignore the field
- Cannot query `store.reviews`
- Multi-tenancy data isolation not enforced at database level

**Impact**: 🔴 **CRITICAL** - Schema validation error, data integrity compromised

**Fix**:
```prisma
model Review {
  id        String   @id @default(cuid())
  storeId   String
  store     Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  // ... rest of fields
  
  @@index([storeId, productId])
  @@index([productId, isApproved, createdAt])
}

model Store {
  // Add to existing relations
  reviews   Review[]
}
```

---

### Issue 1.2: User-Customer Relationship - 1:1 Prevents Multi-Store Usage

**Current State**:
```prisma
model User {
  id       String    @id @default(cuid())
  customer Customer? // ❌ 1:1 relationship
}

model Customer {
  id       String  @id @default(cuid())
  userId   String? @unique // ❌ @unique enforces 1:1
  user     User?   @relation(...)
  storeId  String
  store    Store   @relation(...)
}
```

**Problem**:
- A user can only be a customer in ONE store
- Real-world scenario: User John shops at "Tech Store" and "Fashion Store" (both on StormCom platform)
- Current schema: John can only have customer profile in ONE store
- Forces creating separate user accounts for each store (terrible UX)

**Impact**: 🔴 **CRITICAL** - Breaks multi-tenant platform model

**Fix**:
```prisma
model User {
  id        String     @id @default(cuid())
  customers Customer[] // ✅ 1:many relationship
}

model Customer {
  id       String  @id @default(cuid())
  userId   String? // ✅ Removed @unique
  user     User?   @relation(fields: [userId], references: [id], onDelete: SetNull)
  storeId  String
  store    Store   @relation(...)
  
  @@unique([userId, storeId]) // ✅ User can be customer once per store
  @@index([storeId, userId])
}
```

**Migration Impact**: 
- Existing data may need migration if users exist in multiple stores
- Application code must be updated to handle multiple customer profiles per user

---

## 2. Missing Core Features (P1)

### Issue 2.1: No Cart System

**Current State**: ❌ Cart and CartItem models do not exist

**Business Impact**:
- Users cannot add products to cart before checkout
- No abandoned cart tracking
- No persistent cart across sessions
- Cannot implement "Save for Later" feature

**Required Models**:

```prisma
model Cart {
  id         String   @id @default(cuid())
  storeId    String
  store      Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  
  userId     String?
  user       User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessionId  String?  // For guest carts
  
  items      CartItem[]
  
  expiresAt  DateTime // Auto-cleanup old guest carts
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  @@unique([userId, storeId]) // One cart per user per store
  @@unique([sessionId, storeId]) // One guest cart per session per store
  @@index([storeId, userId])
  @@index([expiresAt]) // For cleanup job
}

model CartItem {
  id         String   @id @default(cuid())
  cartId     String
  cart       Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  
  productId  String
  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  variantId  String?
  variant    ProductVariant? @relation(fields: [variantId], references: [id], onDelete: Cascade)
  
  quantity   Int
  price      Float    // Snapshot at time of add (for price change detection)
  
  addedAt    DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  @@unique([cartId, productId, variantId])
  @@index([cartId])
  @@index([productId])
}
```

**Also Add to Store Model**:
```prisma
model Store {
  carts Cart[]
}
```

---

### Issue 2.2: No Coupon/Discount System

**Current State**: 
```prisma
model Order {
  discountCode   String? // ❌ String field with no validation
  discountAmount Float @default(0)
}
```

**Problems**:
- No coupon validation (any string accepted)
- No usage limits or expiration
- No tracking of coupon usage
- Cannot restrict by product/category
- No analytics on coupon effectiveness

**Required Models**:

```prisma
enum CouponType {
  PERCENTAGE
  FIXED_AMOUNT
  FREE_SHIPPING
  BUY_X_GET_Y
}

model Coupon {
  id             String      @id @default(cuid())
  storeId        String
  store          Store       @relation(fields: [storeId], references: [id], onDelete: Cascade)
  
  code           String      // e.g., "SUMMER2024"
  type           CouponType
  value          Float       // Percentage (0-100) or fixed amount
  
  // Restrictions
  minOrderValue  Float?
  maxDiscount    Float?      // Cap for percentage discounts
  
  // Usage limits
  maxUses        Int?        // Total uses allowed (null = unlimited)
  maxUsesPerUser Int         @default(1)
  usedCount      Int         @default(0)
  
  // Product/Category restrictions (JSON arrays of IDs)
  applicableProducts  String? // JSON: ["prod_id_1", "prod_id_2"]
  applicableCategories String? // JSON: ["cat_id_1"]
  excludedProducts    String?
  
  // Validity
  startsAt       DateTime
  expiresAt      DateTime
  isActive       Boolean     @default(true)
  
  usages         CouponUsage[]
  
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  
  @@unique([storeId, code])
  @@index([storeId, isActive, expiresAt])
  @@index([code])
}

model CouponUsage {
  id         String   @id @default(cuid())
  couponId   String
  coupon     Coupon   @relation(fields: [couponId], references: [id], onDelete: Cascade)
  
  orderId    String   @unique
  order      Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  userId     String?
  user       User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  discountAmount Float
  
  usedAt     DateTime @default(now())
  
  @@index([couponId, usedAt])
  @@index([userId, usedAt])
}

// Add to Order model
model Order {
  couponUsage CouponUsage?
}
```

---

### Issue 2.3: No Address Management

**Current State**:
```prisma
model Order {
  shippingAddress String? // ❌ JSON object
  billingAddress  String? // ❌ JSON object
}

model Customer {
  // ❌ No saved addresses
}
```

**Problems**:
- Customers cannot save addresses for reuse
- Cannot query orders by city/state/country
- Cannot validate addresses
- Cannot set default address
- Address format inconsistent (JSON structure varies)

**Required Model**:

```prisma
enum AddressType {
  SHIPPING
  BILLING
  BOTH
}

model Address {
  id         String      @id @default(cuid())
  
  // Can belong to Customer or User
  customerId String?
  customer   Customer?   @relation(fields: [customerId], references: [id], onDelete: Cascade)
  userId     String?
  user       User?       @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type       AddressType @default(BOTH)
  
  firstName  String
  lastName   String
  company    String?
  
  address1   String
  address2   String?
  city       String
  state      String      // Province/State
  postalCode String
  country    String      @default("US")
  phone      String?
  
  isDefault  Boolean     @default(false)
  
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
  
  @@index([customerId, isDefault])
  @@index([userId, isDefault])
}

// Update Order model
model Order {
  shippingAddressId String?
  shippingAddress   Address? @relation("OrderShippingAddress", fields: [shippingAddressId], references: [id])
  billingAddressId  String?
  billingAddress    Address? @relation("OrderBillingAddress", fields: [billingAddressId], references: [id])
}
```

---

### Issue 2.4: No Payment Transaction Tracking

**Current State**:
```prisma
model Order {
  paymentMethod  PaymentMethod?
  paymentGateway PaymentGateway?
  paymentStatus  PaymentStatus @default(PENDING)
  // ❌ No transaction ID, gateway response, or refund tracking
}
```

**Problems**:
- No audit trail of payment attempts
- Cannot track refunds separately from orders
- No gateway transaction ID for reconciliation
- Cannot handle partial refunds
- Cannot track authorization vs capture

**Required Models**:

```prisma
enum TransactionType {
  AUTHORIZE
  CAPTURE
  CHARGE
  REFUND
  VOID
}

enum TransactionStatus {
  PENDING
  PROCESSING
  SUCCESS
  FAILED
  CANCELED
}

model PaymentTransaction {
  id                    String            @id @default(cuid())
  orderId               String
  order                 Order             @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  type                  TransactionType
  status                TransactionStatus @default(PENDING)
  
  amount                Float
  currency              String            @default("USD")
  
  paymentMethod         PaymentMethod
  paymentGateway        PaymentGateway
  
  // Gateway data
  gatewayTransactionId  String?           // Stripe payment_intent, etc.
  gatewayResponse       String?           // JSON response from gateway
  gatewayErrorCode      String?
  gatewayErrorMessage   String?
  
  // Metadata
  ipAddress             String?
  userAgent             String?
  
  processedAt           DateTime?
  failedAt              DateTime?
  
  createdAt             DateTime          @default(now())
  
  @@index([orderId, type, createdAt])
  @@index([gatewayTransactionId])
  @@index([status, createdAt])
}

// Add to Order model
model Order {
  transactions PaymentTransaction[]
}
```

---

### Issue 2.5: No Wishlist Feature

**Current State**: ❌ No Wishlist models exist

**Business Impact**:
- Cannot implement "Save for Later" feature
- Lost sales from users who want to bookmark products
- No wishlist sharing functionality

**Required Models**:

```prisma
model Wishlist {
  id        String        @id @default(cuid())
  storeId   String
  store     Store         @relation(fields: [storeId], references: [id], onDelete: Cascade)
  
  userId    String
  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name      String        @default("My Wishlist")
  isPublic  Boolean       @default(false)
  
  items     WishlistItem[]
  
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
  
  @@unique([userId, storeId, name])
  @@index([storeId, userId])
}

model WishlistItem {
  id         String   @id @default(cuid())
  wishlistId String
  wishlist   Wishlist @relation(fields: [wishlistId], references: [id], onDelete: Cascade)
  
  productId  String
  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  variantId  String?
  variant    ProductVariant? @relation(fields: [variantId], references: [id], onDelete: Cascade)
  
  note       String?
  
  addedAt    DateTime @default(now())
  
  @@unique([wishlistId, productId, variantId])
  @@index([wishlistId])
  @@index([productId])
}
```

---

### Issue 2.6: No Notification System

**Current State**: ❌ No notification models

**Business Impact**:
- Cannot send order status updates
- No low stock alerts
- No abandoned cart emails
- No review request emails

**Required Models**:

```prisma
enum NotificationType {
  ORDER_CONFIRMATION
  ORDER_SHIPPED
  ORDER_DELIVERED
  ORDER_CANCELED
  LOW_STOCK_ALERT
  REVIEW_REQUEST
  ABANDONED_CART
  PRICE_DROP
  BACK_IN_STOCK
}

enum NotificationChannel {
  EMAIL
  SMS
  PUSH
  IN_APP
}

enum NotificationStatus {
  PENDING
  SENT
  FAILED
  READ
}

model NotificationTemplate {
  id          String            @id @default(cuid())
  storeId     String
  store       Store             @relation(fields: [storeId], references: [id], onDelete: Cascade)
  
  type        NotificationType
  channel     NotificationChannel
  
  subject     String?           // For email
  body        String            // Template with variables: {{order_number}}
  
  isActive    Boolean           @default(true)
  
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  
  @@unique([storeId, type, channel])
}

model Notification {
  id          String             @id @default(cuid())
  storeId     String?
  store       Store?             @relation(fields: [storeId], references: [id], onDelete: Cascade)
  
  userId      String?
  user        User?              @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type        NotificationType
  channel     NotificationChannel
  status      NotificationStatus @default(PENDING)
  
  subject     String?
  body        String
  data        String?            // JSON metadata
  
  sentAt      DateTime?
  readAt      DateTime?
  failedAt    DateTime?
  errorMessage String?
  
  createdAt   DateTime           @default(now())
  
  @@index([userId, status, createdAt])
  @@index([storeId, status, createdAt])
}
```

---

## 3. Data Integrity Issues (P2)

### Issue 3.1: Float Used for Money Fields

**Current State**:
```prisma
model Product {
  price          Float
  compareAtPrice Float?
  costPrice      Float?
}

model Order {
  subtotal       Float
  taxAmount      Float
  shippingAmount Float
  discountAmount Float
  totalAmount    Float
}
```

**Problem**:
- Floating-point arithmetic causes rounding errors
- Example: `0.1 + 0.2 = 0.30000000000000004` in JavaScript
- Currency calculations become inaccurate over time
- Cannot reliably compare prices

**Impact**: 🔴 **HIGH** - Financial calculation errors

**Fix Option 1 - Decimal Type** (Recommended for PostgreSQL):
```prisma
model Product {
  price          Decimal @db.Decimal(10, 2) // 10 digits, 2 decimal places
  compareAtPrice Decimal? @db.Decimal(10, 2)
  costPrice      Decimal? @db.Decimal(10, 2)
}
```

**Fix Option 2 - Integer (Cents)** (Works for SQLite):
```prisma
model Product {
  priceInCents   Int // Store $19.99 as 1999
  // Application layer converts: price = priceInCents / 100
}
```

**Migration Strategy**:
```sql
-- Convert existing Float to Int (cents)
UPDATE Product SET priceInCents = CAST(price * 100 AS INTEGER);
UPDATE Order SET subtotalInCents = CAST(subtotal * 100 AS INTEGER);
```

---

### Issue 3.2: No String Length Constraints

**Current State**:
```prisma
model Product {
  name        String // ❌ No max length
  description String? // ❌ Could be 1MB of text
  sku         String // ❌ No max length
}
```

**Problems**:
- No validation at database level
- Can store arbitrarily long strings (memory issues)
- Poor query performance on unconstrained text fields
- Inconsistent with PostgreSQL best practices

**Fix**:
```prisma
model Product {
  name        String  @db.VarChar(255)
  description String? @db.Text
  shortDescription String? @db.VarChar(500)
  sku         String  @db.VarChar(100)
  barcode     String? @db.VarChar(100)
  slug        String  @db.VarChar(255)
  
  metaTitle       String? @db.VarChar(255)
  metaDescription String? @db.VarChar(500)
  metaKeywords    String? @db.VarChar(500)
}

model User {
  name  String? @db.VarChar(255)
  email String? @db.VarChar(255)
  image String? @db.VarChar(500)
}

model Order {
  orderNumber     String @db.VarChar(50)
  trackingNumber  String? @db.VarChar(100)
  trackingUrl     String? @db.VarChar(500)
  customerNote    String? @db.Text
  adminNote       String? @db.Text
}
```

---

### Issue 3.3: JSON Fields Not Queryable

**Current State**:
```prisma
model Product {
  images String // ❌ JSON array stored as string
}

model Order {
  shippingAddress String? // ❌ JSON object
  billingAddress  String? // ❌ JSON object
}

model ProductAttribute {
  values String // ❌ JSON array
}

model ProductVariant {
  options String // ❌ JSON object
}
```

**Problems**:
- Cannot query: "Find all products with image X"
- Cannot query: "Orders shipped to California"
- Cannot validate JSON structure at DB level
- JSON parsing required for every read
- No referential integrity

**Fix Option 1 - Normalize Images**:
```prisma
model ProductImage {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  url       String   @db.VarChar(500)
  alt       String?  @db.VarChar(255)
  position  Int      @default(0)
  
  createdAt DateTime @default(now())
  
  @@index([productId, position])
}

model Product {
  images ProductImage[]
}
```

**Fix Option 2 - Use JSON Type** (PostgreSQL only):
```prisma
model Product {
  images String @db.JsonB // PostgreSQL can index and query JSONB
}
```

**Fix Option 3 - Keep String but Add Validation**:
```typescript
// Application-level validation
const imageSchema = z.array(z.string().url()).max(10);
```

---

### Issue 3.4: Order Calculation Not Enforced

**Current State**:
```prisma
model Order {
  subtotal       Float
  taxAmount      Float
  shippingAmount Float
  discountAmount Float
  totalAmount    Float
  // ❌ No constraint: totalAmount = subtotal + tax + shipping - discount
}
```

**Problem**:
- Application bug could save incorrect totals
- Data can become inconsistent
- No automatic recalculation on updates

**Fix Option 1 - Check Constraint** (PostgreSQL):
```prisma
model Order {
  subtotal       Decimal @db.Decimal(10, 2)
  taxAmount      Decimal @db.Decimal(10, 2)
  shippingAmount Decimal @db.Decimal(10, 2)
  discountAmount Decimal @db.Decimal(10, 2)
  totalAmount    Decimal @db.Decimal(10, 2)
  
  @@map("orders")
  @@check(totalAmount == subtotal + taxAmount + shippingAmount - discountAmount)
}
```

**Fix Option 2 - Computed Field** (Application):
```typescript
// Calculate on read, don't store
const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;
```

**Fix Option 3 - Database Trigger**:
```sql
CREATE TRIGGER calculate_order_total
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW
BEGIN
  SET NEW.totalAmount = NEW.subtotal + NEW.taxAmount + NEW.shippingAmount - NEW.discountAmount;
END;
```

---

### Issue 3.5: Customer Computed Fields Can Become Stale

**Current State**:
```prisma
model Customer {
  totalOrders       Int   @default(0)
  totalSpent        Float @default(0)
  averageOrderValue Float @default(0)
  lastOrderAt       DateTime?
  // ❌ These must be updated when orders change
}
```

**Problems**:
- If order deleted, these don't auto-update
- If order refunded, totalSpent incorrect
- Data duplication (also computed from Order table)
- Requires application-level triggers on every order change

**Fix Option 1 - Database View** (Recommended):
```sql
CREATE VIEW customer_metrics AS
SELECT 
  c.id,
  COUNT(o.id) as totalOrders,
  COALESCE(SUM(o.totalAmount), 0) as totalSpent,
  COALESCE(AVG(o.totalAmount), 0) as averageOrderValue,
  MAX(o.createdAt) as lastOrderAt
FROM Customer c
LEFT JOIN Order o ON o.customerId = c.id AND o.deletedAt IS NULL
GROUP BY c.id;
```

**Fix Option 2 - Compute On-Demand**:
```typescript
// Remove fields from schema, compute in application
const customerMetrics = await prisma.order.aggregate({
  where: { customerId, deletedAt: null },
  _count: true,
  _sum: { totalAmount: true },
  _avg: { totalAmount: true },
  _max: { createdAt: true }
});
```

**Fix Option 3 - Keep But Add Update Logic**:
```typescript
// Update customer metrics on every order change
await prisma.customer.update({
  where: { id: customerId },
  data: {
    totalOrders: { increment: 1 },
    totalSpent: { increment: order.totalAmount },
    lastOrderAt: new Date()
  }
});
```

---

## 4. Business Logic Gaps (P2)

### Issue 4.1: Inventory Tracking Confusion

**Current State**:
```prisma
model Product {
  trackInventory Boolean @default(true)
  inventoryQty   Int     @default(0)
  // ...
  variants ProductVariant[]
}

model ProductVariant {
  inventoryQty Int @default(0)
  // ...
}
```

**Problem**:
- Product has inventory AND variants have inventory
- Which is authoritative if product has variants?
- Should `product.inventoryQty = SUM(variant.inventoryQty)`?
- Current: Both are independent (confusing)

**Fix - Option 1: Variant-Level Only**:
```prisma
model Product {
  trackInventory Boolean @default(true)
  inventoryQty   Int?    // NULL if has variants, otherwise actual quantity
  lowStockThreshold Int  @default(5)
  
  // Add computed field
  computedInventoryQty Int? // SUM of variant inventories or inventoryQty
}

// Application logic
const inventory = product.variants.length > 0
  ? product.variants.reduce((sum, v) => sum + v.inventoryQty, 0)
  : product.inventoryQty;
```

**Fix - Option 2: Separate Simple vs Variant Products**:
```prisma
model Product {
  hasVariants Boolean @default(false)
  
  // Only used if hasVariants = false
  inventoryQty Int?
  
  variants ProductVariant[]
}
```

---

### Issue 4.2: Guest Checkout Not Well-Defined

**Current State**:
```prisma
model Order {
  customerId String?  // ❌ NULL for guest orders
  customer   Customer? @relation(...)
  // But then how to contact guest? Email stored where?
}
```

**Problem**:
- Guest orders have no customer record
- Guest email not stored (how to send confirmation?)
- Cannot track repeat guest customers
- Guest checkout flow undefined

**Fix**:
```prisma
model Customer {
  id     String  @id
  userId String? // NULL for guests
  user   User?   @relation(...)
  
  email     String
  firstName String
  lastName  String
  
  isGuest Boolean @default(false) // ✅ Explicit guest flag
  
  @@unique([storeId, email]) // Prevent duplicate guests
}

// Business Logic:
// 1. Guest checkout creates Customer with isGuest=true, userId=null
// 2. If guest registers later, update Customer.userId and isGuest=false
// 3. All orders always have customerId (no nulls)
```

---

### Issue 4.3: No Product Collections

**Current State**:
- Products can only be grouped by Category (hierarchical)
- Cannot create: "Summer Sale", "Editor's Picks", "New Arrivals"

**Required Models**:
```prisma
model Collection {
  id          String   @id @default(cuid())
  storeId     String
  store       Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  
  name        String
  slug        String
  description String?
  image       String?
  
  type        String   // MANUAL, AUTO
  conditions  String?  // JSON: {"category": "x", "brand": "y"} for auto
  
  products    ProductCollection[]
  
  isPublished Boolean  @default(true)
  publishedAt DateTime?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([storeId, slug])
  @@index([storeId, isPublished])
}

model ProductCollection {
  id           String     @id @default(cuid())
  productId    String
  product      Product    @relation(fields: [productId], references: [id], onDelete: Cascade)
  collectionId String
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  
  position     Int        @default(0)
  
  addedAt      DateTime   @default(now())
  
  @@unique([productId, collectionId])
  @@index([collectionId, position])
}
```

---

### Issue 4.4: No Tax Calculation System

**Current State**:
```prisma
model Order {
  taxAmount Float @default(0) // ❌ How is this calculated?
}

model OrderItem {
  taxAmount Float @default(0) // ❌ Same question
}
```

**Problem**:
- No tax rules defined
- Cannot calculate tax by location, product type, or threshold
- Tax compliance risk (incorrect rates)

**Required Models**:
```prisma
enum TaxBasis {
  PRICE_ONLY
  PRICE_PLUS_SHIPPING
}

model TaxRate {
  id        String   @id @default(cuid())
  storeId   String
  store     Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  
  name      String   // "US Sales Tax", "VAT", "GST"
  rate      Float    // Percentage: 8.5 for 8.5%
  
  country   String
  state     String?
  city      String?
  postalCode String?
  
  // Tax categories (e.g., some products tax-exempt)
  productCategories String? // JSON array of category IDs
  
  basis     TaxBasis @default(PRICE_ONLY)
  isActive  Boolean  @default(true)
  
  priority  Int      @default(0) // For overlapping rules
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([storeId, country, state])
  @@index([storeId, isActive])
}
```

---

### Issue 4.5: No Shipping Method Configuration

**Current State**:
```prisma
model Order {
  shippingMethod String? // ❌ Free-form string
  shippingAmount Float @default(0) // ❌ How calculated?
}
```

**Problem**:
- Shipping rates hard-coded in application
- Cannot offer multiple shipping options
- No zone-based or weight-based shipping

**Required Models**:
```prisma
model ShippingZone {
  id        String   @id @default(cuid())
  storeId   String
  store     Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  
  name      String
  countries String   // JSON array: ["US", "CA", "MX"]
  
  methods   ShippingMethod[]
  
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  
  @@index([storeId, isActive])
}

model ShippingMethod {
  id        String       @id @default(cuid())
  zoneId    String
  zone      ShippingZone @relation(fields: [zoneId], references: [id], onDelete: Cascade)
  
  name      String       // "Standard", "Express", "Overnight"
  
  // Rate calculation
  type      String       // FLAT_RATE, WEIGHT_BASED, PRICE_BASED, FREE
  rate      Float?       // Base rate
  
  // Conditions
  minOrderValue Float?    // Free shipping over $50
  maxWeight     Float?    // Max 50 lbs
  
  estimatedDays String?   // "3-5 business days"
  
  isActive  Boolean      @default(true)
  
  @@index([zoneId, isActive])
}
```

---

## 5. Performance & Indexing (P3)

### Issue 5.1: Missing Composite Indexes

**Current Indexes** (examples):
```prisma
model Product {
  @@index([storeId, status])
  @@index([storeId, categoryId])
  @@index([storeId, brandId])
  @@index([categoryId, status])
  @@index([brandId, status])
}
```

**Missing Indexes**:
```prisma
model Product {
  // Add these:
  @@index([storeId, isFeatured, status]) // Featured products query
  @@index([storeId, status, publishedAt]) // Recent products query
}

model Order {
  // Add these:
  @@index([customerId, status, createdAt]) // Customer order history
  @@index([storeId, paymentStatus, createdAt]) // Payment tracking
  @@index([storeId, status, createdAt]) // Order management
}

model Review {
  // Add these:
  @@index([storeId, isApproved, createdAt]) // Approved reviews
  @@index([productId, isApproved, rating]) // Product rating calculation
}

model Customer {
  // Add these:
  @@index([storeId, totalSpent]) // Top customers query
  @@index([storeId, createdAt]) // New customers
}
```

---

### Issue 5.2: Soft Delete Not Indexed

**Current State**:
```prisma
model Product {
  deletedAt DateTime?
  // ❌ Queries must filter: WHERE deletedAt IS NULL
  // ❌ No index on deletedAt
}
```

**Problem**:
- Every query must include `WHERE deletedAt IS NULL`
- Scanning deleted records on every query
- Poor performance as deleted records accumulate

**Fix**:
```prisma
model Product {
  deletedAt DateTime?
  
  @@index([storeId, deletedAt, status]) // Composite for active products
  @@index([deletedAt]) // For deleted records query
}

// Query optimization:
// Instead of: WHERE storeId = ? AND deletedAt IS NULL AND status = 'ACTIVE'
// Use: WHERE storeId = ? AND deletedAt IS NULL AND status = 'ACTIVE'
// Index can now do: Index Scan on product_storeid_deletedat_status
```

**Alternative - Partition Tables**:
```sql
-- PostgreSQL partitioning
CREATE TABLE products_active PARTITION OF products FOR VALUES FROM (NULL) TO (NULL);
CREATE TABLE products_deleted PARTITION OF products FOR VALUES FROM ('2020-01-01') TO (MAXVALUE);
```

---

### Issue 5.3: No Full-Text Search

**Current State**:
- Product search uses `LIKE '%keyword%'` queries
- Slow for large catalogs
- No relevance ranking

**Fix - PostgreSQL**:
```prisma
model Product {
  name        String @db.VarChar(255)
  description String? @db.Text
  
  searchVector String? // Computed column for FTS
  
  @@index([searchVector], type: GiST) // Full-text index
}
```

```sql
-- Create search vector
ALTER TABLE Product ADD COLUMN search_vector tsvector 
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED;

CREATE INDEX product_search_idx ON Product USING GIN(search_vector);

-- Query
SELECT * FROM Product 
WHERE search_vector @@ plainto_tsquery('english', 'laptop gaming');
```

---

### Issue 5.4: No Query Optimization for Common Patterns

**Slow Query Example 1 - Dashboard Analytics**:
```typescript
// Current: Multiple queries
const totalRevenue = await prisma.order.aggregate({
  where: { storeId, status: 'DELIVERED' },
  _sum: { totalAmount: true }
});

const totalOrders = await prisma.order.count({
  where: { storeId, status: { in: ['DELIVERED', 'SHIPPED'] } }
});

const totalCustomers = await prisma.customer.count({
  where: { storeId }
});
```

**Fix - Materialized View**:
```sql
CREATE MATERIALIZED VIEW store_analytics AS
SELECT 
  s.id as store_id,
  COUNT(DISTINCT o.id) as total_orders,
  COUNT(DISTINCT c.id) as total_customers,
  SUM(CASE WHEN o.status = 'DELIVERED' THEN o.totalAmount ELSE 0 END) as total_revenue,
  AVG(CASE WHEN o.status = 'DELIVERED' THEN o.totalAmount ELSE NULL END) as avg_order_value
FROM Store s
LEFT JOIN Order o ON o.storeId = s.id AND o.deletedAt IS NULL
LEFT JOIN Customer c ON c.storeId = s.id
GROUP BY s.id;

-- Refresh every hour
REFRESH MATERIALIZED VIEW store_analytics;
```

---

## 6. Security & Compliance (P3)

### Issue 6.1: PII Data Not Protected

**Current State**:
```prisma
model Customer {
  email     String
  firstName String
  lastName  String
  phone     String?
  // ❌ Stored in plain text
}

model Order {
  shippingAddress String? // ❌ Contains name, address, phone
  billingAddress  String? // ❌ Same
}
```

**GDPR Requirements**:
- Right to be forgotten (data deletion)
- Right to data export
- Encryption at rest
- Audit trail of access

**Partial Fix - Soft Delete**:
```prisma
model Customer {
  deletedAt DateTime? // Soft delete
  
  // On deletion, also anonymize
  // email → "deleted_user_<id>@example.com"
  // firstName → "Deleted"
  // lastName → "User"
}
```

**Better Fix - Encryption**:
```typescript
// Application-level encryption
import crypto from 'crypto';

const encrypt = (text: string) => {
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
};

// Store encrypted
await prisma.customer.create({
  data: {
    email: encrypt(email),
    firstName: encrypt(firstName),
    // ...
  }
});
```

---

### Issue 6.2: No Payment Method Tokenization

**Current State**:
- No saved payment methods
- User must re-enter card every order
- No recurring billing support

**Required** (DO NOT STORE RAW CARDS):
```prisma
model PaymentMethod {
  id         String   @id @default(cuid())
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  
  type       String   // "card", "bank_account"
  
  // Tokenized data from gateway (NOT raw card numbers)
  gatewayCustomerId String // Stripe customer ID
  gatewayPaymentMethodId String // Stripe payment method ID
  
  // Display info
  last4      String
  brand      String   // "visa", "mastercard"
  expiryMonth Int?
  expiryYear  Int?
  
  isDefault  Boolean  @default(false)
  
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  @@index([customerId, isDefault])
}
```

---

### Issue 6.3: Audit Trail Incomplete

**Current State**:
```prisma
model AuditLog {
  storeId   String?
  userId    String?
  action    String
  entityType String
  entityId  String
  changes   String? // JSON
  // ✅ Good start, but missing some events
}
```

**Missing Audit Events**:
- User login/logout
- Password changes
- Failed login attempts
- Sensitive data access (customer PII)
- Admin privilege changes

**Enhancement**:
```prisma
enum AuditAction {
  CREATE
  UPDATE
  DELETE
  VIEW      // For sensitive data access
  LOGIN
  LOGOUT
  PASSWORD_CHANGE
  PERMISSION_CHANGE
  EXPORT_DATA  // GDPR export
}

enum AuditSeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

model AuditLog {
  id        String         @id @default(cuid())
  
  action    AuditAction
  severity  AuditSeverity  @default(LOW)
  
  // Actor
  userId    String?
  user      User?          @relation(...)
  
  // Target
  storeId   String?
  store     Store?         @relation(...)
  entityType String
  entityId   String
  
  // Change details
  before    String?        // JSON snapshot before
  after     String?        // JSON snapshot after
  changes   String?        // JSON diff
  
  // Request context
  ipAddress String?
  userAgent String?
  sessionId String?
  
  // Compliance
  accessReason String?      // Why was sensitive data accessed?
  
  createdAt DateTime       @default(now())
  
  @@index([userId, createdAt])
  @@index([entityType, entityId, createdAt])
  @@index([severity, createdAt])
}
```

---

## 7. Normalization Issues (P4)

### Issue 7.1: ProductAttribute Values Not Normalized

**Current State**:
```prisma
model ProductAttribute {
  name   String
  values String // ❌ JSON: ["Small", "Medium", "Large"]
}
```

**Problem**:
- Cannot query: "All attributes with value 'Small'"
- Cannot rename "Small" → "S" globally
- Typos create duplicates ("Small" vs "small")

**Fix**:
```prisma
model ProductAttribute {
  id      String                 @id
  storeId String
  name    String                 // "Size"
  options ProductAttributeOption[]
}

model ProductAttributeOption {
  id          String           @id
  attributeId String
  attribute   ProductAttribute @relation(...)
  value       String           // "Small"
  sortOrder   Int              @default(0)
  
  @@unique([attributeId, value])
  @@index([attributeId, sortOrder])
}
```

---

### Issue 7.2: ProductVariant Options Not Normalized

**Current State**:
```prisma
model ProductVariant {
  options String // ❌ JSON: {"size": "L", "color": "Red"}
}
```

**Problem**:
- Cannot query: "All variants with size L"
- Cannot filter products by variant attributes
- Inconsistent option names

**Fix**:
```prisma
model ProductVariantOption {
  id        String         @id
  variantId String
  variant   ProductVariant @relation(...)
  
  attributeOptionId String
  attributeOption   ProductAttributeOption @relation(...)
  
  @@unique([variantId, attributeOptionId])
  @@index([variantId])
}
```

---

### Issue 7.3: Table Name Inconsistency

**Current State**:
```prisma
model User {} // Table: "User"
model Product {} // Table: "Product"
model AuditLog {
  @@map("audit_logs") // ❌ Table: "audit_logs" (snake_case)
}
```

**Fix - Use Consistent Convention**:
```prisma
// Option 1: All PascalCase (Prisma default)
model AuditLog {} // Table: "AuditLog"

// Option 2: All snake_case (SQL convention)
model User {
  @@map("users")
}
model Product {
  @@map("products")
}
```

---

## 8. PostgreSQL Migration Prep (P4)

**Current**: Schema is SQLite-specific  
**Target**: PostgreSQL for production

### Required Changes:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // Changed from sqlite
  url      = env("DATABASE_URL")
}

// Add PostgreSQL-specific types
model Product {
  name        String  @db.VarChar(255) // ✅ Add length
  description String? @db.Text         // ✅ Use Text type
  price       Decimal @db.Decimal(10, 2) // ✅ Use Decimal
  images      String  @db.JsonB        // ✅ Use JSONB for queries
}

model Order {
  shippingAddress String? @db.JsonB
  billingAddress  String? @db.JsonB
}

// Add UUID support (optional but recommended)
model User {
  id String @id @default(uuid()) @db.Uuid
}
```

---

## 9. Recommended ERD

**See separate file**: `DATABASE_ERD_REFINED.md`

The refined ERD includes:
- All current models (corrected)
- Missing models (Cart, Coupon, Address, PaymentTransaction, etc.)
- Proper relationships and cardinalities
- Complete business logic flow

---

## 10. Migration Roadmap

### Phase 1: Critical Fixes (1-2 days)
**Priority**: P0 - Must fix before any development

1. **Fix Review Model Foreign Key**
   ```bash
   npx prisma migrate dev --name fix-review-store-relation
   ```

2. **Fix User-Customer Relationship**
   ```bash
   # Remove @unique from Customer.userId
   npx prisma migrate dev --name fix-customer-user-relation
   # Update application code to handle multiple customers per user
   ```

### Phase 2: Core Features (1 week)
**Priority**: P1 - Required for MVP

3. **Add Cart System**
   ```bash
   npx prisma migrate dev --name add-cart-system
   ```

4. **Add Coupon System**
   ```bash
   npx prisma migrate dev --name add-coupon-system
   ```

5. **Add Address Management**
   ```bash
   npx prisma migrate dev --name add-address-management
   ```

6. **Add Payment Transactions**
   ```bash
   npx prisma migrate dev --name add-payment-transactions
   ```

### Phase 3: Data Integrity (3-5 days)
**Priority**: P2 - Important for production

7. **Migrate Float to Decimal**
   ```sql
   -- Backup first!
   -- Then migrate all price fields to Decimal
   ```

8. **Add String Length Constraints**
   ```bash
   npx prisma migrate dev --name add-string-constraints
   ```

9. **Normalize Product Images**
   ```bash
   npx prisma migrate dev --name normalize-product-images
   # Migrate existing JSON data to new table
   ```

10. **Add Order Address Relations**
    ```bash
    npx prisma migrate dev --name migrate-order-addresses
    ```

### Phase 4: Business Logic (3-5 days)
**Priority**: P2 - Enhance functionality

11. **Add Wishlist Feature**
12. **Add Notification System**
13. **Add Tax Rate Configuration**
14. **Add Shipping Method Configuration**
15. **Add Product Collections**

### Phase 5: Performance (2-3 days)
**Priority**: P3 - Optimize queries

16. **Add Missing Indexes**
17. **Add Full-Text Search**
18. **Create Materialized Views**
19. **Add Soft Delete Indexes**

### Phase 6: PostgreSQL Migration (1 week)
**Priority**: P4 - Production readiness

20. **Convert to PostgreSQL**
21. **Add PostgreSQL-specific optimizations**
22. **Test migration scripts**
23. **Set up backup/restore procedures**

---

## Summary Statistics

| Category | Count | Priority |
|----------|-------|----------|
| Critical Errors | 2 | P0 |
| Missing Core Features | 6 | P1 |
| Data Integrity Issues | 8 | P2 |
| Business Logic Gaps | 5 | P2 |
| Performance Issues | 4 | P3 |
| Security Issues | 3 | P3 |
| Normalization Issues | 3 | P4 |
| **Total Issues** | **31** | - |

**Estimated Time to Fix All Issues**: 4-6 weeks  
**Minimum for MVP (P0-P1)**: 1-2 weeks  
**Recommended for Production (P0-P2)**: 3-4 weeks

---

## Next Steps

1. ✅ Review this analysis
2. ⏳ Review refined ERD diagram (separate file)
3. ⏳ Prioritize fixes based on business needs
4. ⏳ Create migration scripts for Phase 1 (critical fixes)
5. ⏳ Update application code for relationship changes
6. ⏳ Test migrations on development database
7. ⏳ Deploy fixes incrementally

---

**Document Version**: 1.0  
**Last Updated**: November 23, 2025  
**Author**: Database Analysis Agent  
**Status**: Ready for Review
