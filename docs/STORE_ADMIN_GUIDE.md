# Store Admin Role - Complete Implementation Guide

## Overview

**STORE_ADMIN** is the highest-level role at the **store level**, providing full control over an assigned store including products, inventory, orders, customers, reports, and staff management.

---

## 🔑 Store Admin Capabilities

### Full Store Control
- ✅ **Product Management** - Create, read, update, delete all products
- ✅ **Inventory Management** - Track stock, adjust quantities, set thresholds
- ✅ **Order Processing** - View, process, fulfill, cancel orders
- ✅ **Customer Management** - View, update customer information and history
- ✅ **Reports & Analytics** - Access all store reports and analytics
- ✅ **Staff Management** - Assign and manage store staff roles
- ✅ **Store Settings** - Update store configuration and preferences

### Permission Model

```typescript
STORE_ADMIN: [
  'store:read',
  'store:update',
  'products:*',          // Full product control
  'categories:*',        // Manage categories
  'brands:*',            // Manage brands
  'inventory:*',         // Full inventory control
  'orders:*',            // Complete order management
  'customers:*',         // Full customer management
  'reports:*',           // All reports
  'analytics:*',         // All analytics
  'staff:*',             // Staff management
  'content:*',           // Content management
  'marketing:*',         // Marketing campaigns
  'support:*',           // Customer support
  'settings:read',       // View settings
  'settings:update',     // Update settings
]
```

**Scope**: Store-level only (cannot access other stores without explicit assignment)

---

## 📊 Role Hierarchy

```
Platform Level
└── SUPER_ADMIN
    └── Organization Level
        ├── OWNER
        ├── ADMIN
        └── MEMBER
            └── Store Level
                ├── STORE_ADMIN ← Full store control
                ├── SALES_MANAGER
                ├── INVENTORY_MANAGER
                ├── CUSTOMER_SERVICE
                ├── CONTENT_MANAGER
                ├── MARKETING_MANAGER
                └── DELIVERY_BOY
```

**Key Difference from OWNER:**
- OWNER: Organization-level, can manage multiple stores
- STORE_ADMIN: Store-level, full control of ONE assigned store

---

## 🗄️ Database Schema

### StoreStaff Model

```prisma
model StoreStaff {
  id        String   @id @default(cuid())
  userId    String
  storeId   String
  role      Role     // STORE_ADMIN, SALES_MANAGER, etc.
  isActive  Boolean  @default(true)
  
  user      User     @relation(fields: [userId], references: [id])
  store     Store    @relation(fields: [storeId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([userId, storeId])  // One role per user per store
}
```

**Key Points:**
- Users can be Store Admin for MULTIPLE stores (separate StoreStaff records)
- `isActive` flag allows temporary deactivation without deletion
- Unique constraint prevents duplicate assignments
- Cascading deletes when user or store is removed

---

## 🛠️ Store Admin Features

### 1. Product Management

**Capabilities:**
- Create new products with all details
- Update product information (name, description, pricing)
- Manage product variants and attributes
- Upload and manage product images
- Set product status (draft, active, archived)
- Bulk operations (import, export, update)

**API Endpoints:**
```typescript
POST   /api/products              // Create product
GET    /api/products              // List all store products
GET    /api/products/{id}         // Get product details
PATCH  /api/products/{id}         // Update product
DELETE /api/products/{id}         // Delete product
POST   /api/products/bulk         // Bulk operations
```

**Permission Check:**
```typescript
await requirePermission('products:create');
```

### 2. Inventory Management

**Capabilities:**
- View real-time inventory levels
- Adjust stock quantities (receive, adjust, transfer)
- Set low stock thresholds and alerts
- Track inventory history and audit logs
- Manage inventory across multiple locations (if enabled)
- Generate inventory reports

**Inventory Status:**
- `IN_STOCK` - Available for sale
- `LOW_STOCK` - Below threshold
- `OUT_OF_STOCK` - Zero quantity
- `DISCONTINUED` - No longer available

**API Endpoints:**
```typescript
GET    /api/inventory             // View inventory
POST   /api/inventory/adjust      // Adjust quantities
GET    /api/inventory/logs        // Audit trail
POST   /api/inventory/alerts      // Configure alerts
```

**Permission Check:**
```typescript
await requirePermission('inventory:manage');
```

### 3. Order Processing

**Capabilities:**
- View all store orders (all statuses)
- Process payments and confirmations
- Update order status (pending → paid → processing → shipped → delivered)
- Cancel and refund orders
- Add tracking information
- Communicate with customers
- Generate invoices and packing slips

**Order Statuses:**
- `PENDING` - Awaiting payment
- `PAID` - Payment received
- `PROCESSING` - Being prepared
- `SHIPPED` - In transit
- `DELIVERED` - Completed
- `CANCELED` - Canceled/refunded

**API Endpoints:**
```typescript
GET    /api/orders                // List all orders
GET    /api/orders/{id}           // Order details
PATCH  /api/orders/{id}/status    // Update status
POST   /api/orders/{id}/cancel    // Cancel order
POST   /api/orders/{id}/refund    // Process refund
PATCH  /api/orders/{id}/tracking  // Add tracking
```

**Permission Check:**
```typescript
await requirePermission('orders:manage');
```

### 4. Customer Management

**Capabilities:**
- View all store customers
- View customer order history
- Update customer information
- Tag and segment customers
- View customer lifetime value
- Export customer data
- Manage customer support tickets

**Customer Data:**
- Contact information
- Order history
- Total spent
- Average order value
- Marketing preferences
- Support interactions

**API Endpoints:**
```typescript
GET    /api/customers             // List customers
GET    /api/customers/{id}        // Customer profile
PATCH  /api/customers/{id}        // Update customer
GET    /api/customers/{id}/orders // Customer orders
POST   /api/customers/{id}/notes  // Add notes
```

**Permission Check:**
```typescript
await requirePermission('customers:read');
```

### 5. Reports & Analytics

**Capabilities:**
- Sales reports (daily, weekly, monthly)
- Product performance analytics
- Inventory turnover reports
- Customer analytics and segmentation
- Revenue and profit analysis
- Order fulfillment metrics
- Staff performance reports

**Available Reports:**
- Sales Overview
- Product Sales
- Category Performance
- Customer Acquisition
- Inventory Status
- Order Fulfillment Rate
- Revenue by Channel
- Refund Analysis

**API Endpoints:**
```typescript
GET    /api/reports/sales         // Sales reports
GET    /api/reports/products      // Product analytics
GET    /api/reports/inventory     // Inventory reports
GET    /api/reports/customers     // Customer insights
GET    /api/analytics/dashboard   // Dashboard data
```

**Permission Check:**
```typescript
await requirePermission('reports:read');
await requirePermission('analytics:read');
```

### 6. Staff Management

**Capabilities:**
- Assign staff to store
- Set staff roles (SALES_MANAGER, INVENTORY_MANAGER, etc.)
- Activate/deactivate staff members
- View staff permissions
- Monitor staff activity (if audit logs enabled)

**Assignable Roles:**
- `SALES_MANAGER` - Sales and orders
- `INVENTORY_MANAGER` - Products and inventory
- `CUSTOMER_SERVICE` - Customer support
- `CONTENT_MANAGER` - Product content
- `MARKETING_MANAGER` - Marketing campaigns
- `DELIVERY_BOY` - Deliveries

**API Endpoints:**
```typescript
GET    /api/store-staff           // List staff
POST   /api/store-staff           // Assign staff
PATCH  /api/store-staff/{id}      // Update staff role
DELETE /api/store-staff/{id}      // Remove staff
```

**Permission Check:**
```typescript
await requirePermission('staff:create');
```

**Security Note:** Store Admin CANNOT assign:
- `SUPER_ADMIN` (platform level)
- `OWNER` (organization level)
- Another `STORE_ADMIN` (requires OWNER/ADMIN permission)

---

## 🔐 Security & Access Control

### 1. Store Isolation

**CRITICAL**: All data queries MUST filter by `storeId`:

```typescript
// ✅ CORRECT - Filtered by storeId
const products = await prisma.product.findMany({
  where: {
    storeId: context.storeId,  // REQUIRED
    status: 'ACTIVE',
  },
});

// ❌ WRONG - No store filter (security vulnerability)
const products = await prisma.product.findMany({
  where: { status: 'ACTIVE' },
});
```

### 2. Permission Validation

```typescript
// Server-side API route
export async function POST(request: NextRequest) {
  // 1. Authenticate user
  const context = await requireAuth();
  
  // 2. Check permission
  const canCreate = await checkPermission('products:create');
  if (!canCreate) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // 3. Validate storeId
  if (!context.storeId) {
    return NextResponse.json({ error: 'No store assigned' }, { status: 400 });
  }
  
  // 4. Create product with storeId
  const product = await prisma.product.create({
    data: {
      ...productData,
      storeId: context.storeId,  // Auto-assigned from context
    },
  });
  
  return NextResponse.json(product);
}
```

### 3. Multi-Store Assignment

Users can be Store Admin for multiple stores:

```typescript
// User has multiple StoreStaff assignments
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    storeStaff: {
      where: { isActive: true },
      include: { store: true },
    },
  },
});

// User can switch between stores
const stores = user.storeStaff.map(s => ({
  id: s.storeId,
  name: s.store.name,
  role: s.role,
}));
```

---

## 🚀 Implementation Examples

### Server Component

```typescript
// app/dashboard/products/page.tsx
import { requirePermission } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export default async function ProductsPage() {
  // Require products:read permission
  const context = await requirePermission('products:read');
  
  // Fetch products for current store
  const products = await prisma.product.findMany({
    where: {
      storeId: context.storeId,
      deletedAt: null,
    },
    include: {
      category: true,
      brand: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  
  return (
    <div>
      <h1>Products ({products.length})</h1>
      <ProductsTable products={products} />
    </div>
  );
}
```

### API Route

```typescript
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateProductSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1),
  price: z.number().positive(),
  sku: z.string().min(1),
  categoryId: z.string().cuid().optional(),
  brandId: z.string().cuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Require products:create permission
    const context = await requirePermission('products:create');
    
    // Parse and validate input
    const body = await request.json();
    const data = CreateProductSchema.parse(body);
    
    // Create product in current store
    const product = await prisma.product.create({
      data: {
        ...data,
        storeId: context.storeId,  // Auto-assigned
        status: 'DRAFT',
      },
      include: {
        category: true,
        brand: true,
      },
    });
    
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Client Component

```typescript
'use client';
import { usePermissions } from '@/hooks/use-permissions';
import { Button } from '@/components/ui/button';

export function ProductActions({ productId }: { productId: string }) {
  const { can } = usePermissions();
  
  const canUpdate = can('products:update');
  const canDelete = can('products:delete');
  
  return (
    <div className="flex gap-2">
      {canUpdate && (
        <Button variant="outline" onClick={() => editProduct(productId)}>
          Edit
        </Button>
      )}
      {canDelete && (
        <Button variant="destructive" onClick={() => deleteProduct(productId)}>
          Delete
        </Button>
      )}
    </div>
  );
}
```

---

## 📱 Store Admin Dashboard

### Dashboard Widgets

1. **Sales Overview**
   - Today's sales
   - This week's revenue
   - This month's orders
   - Comparison to previous period

2. **Quick Stats**
   - Total products
   - Active products
   - Low stock items
   - Pending orders

3. **Recent Orders**
   - Last 10 orders
   - Status distribution
   - Quick actions

4. **Inventory Alerts**
   - Low stock products
   - Out of stock items
   - Discontinued products

5. **Top Products**
   - Best sellers
   - Most viewed
   - Highest revenue

### Navigation Structure

```
Store Dashboard
├── Products
│   ├── All Products
│   ├── Add Product
│   ├── Categories
│   ├── Brands
│   └── Bulk Import
├── Inventory
│   ├── Stock Levels
│   ├── Adjust Stock
│   ├── Inventory Logs
│   └── Alerts
├── Orders
│   ├── All Orders
│   ├── Pending
│   ├── Processing
│   └── Shipped
├── Customers
│   ├── All Customers
│   ├── Segments
│   └── Export
├── Reports
│   ├── Sales Report
│   ├── Product Analytics
│   ├── Customer Insights
│   └── Inventory Report
├── Marketing
│   ├── Campaigns
│   ├── Discounts
│   └── Email Marketing
├── Staff
│   ├── Manage Staff
│   └── Assign Roles
└── Settings
    ├── Store Profile
    ├── Payment Methods
    └── Shipping Options
```

---

## 🧪 How to Assign Store Admin

### Method 1: Via API

```typescript
POST /api/store-staff

{
  "userId": "user-cuid-here",
  "storeId": "store-cuid-here",
  "role": "STORE_ADMIN",
  "isActive": true
}
```

### Method 2: Via Prisma Client

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Assign user as Store Admin
await prisma.storeStaff.create({
  data: {
    userId: 'clqm1j4k00000l8dw8z8r8z8a',
    storeId: 'clqm1j4k00000l8dw8z8r8z8r',
    role: 'STORE_ADMIN',
    isActive: true,
  },
});
```

### Method 3: Via Seed Script

```typescript
// prisma/seed.ts
const storeAdmin = await prisma.user.create({
  data: {
    email: 'storeadmin@example.com',
    name: 'Store Administrator',
    passwordHash: await bcrypt.hash('StoreAdmin123!@#', 12),
    emailVerified: new Date(),
    storeStaff: {
      create: {
        storeId: store.id,
        role: 'STORE_ADMIN',
        isActive: true,
      },
    },
  },
});
```

### Method 4: Organization Owner Assignment

Organization OWNER can assign Store Admin through UI:
1. Go to Team Management
2. Select user
3. Assign to store with STORE_ADMIN role

---

## ⚠️ Best Practices

### 1. Always Filter by Store

```typescript
// Every query MUST include storeId
const products = await prisma.product.findMany({
  where: {
    storeId: context.storeId,  // REQUIRED
    // other filters...
  },
});
```

### 2. Validate Store Access

```typescript
// Before operations, verify user has access
const storeStaff = await prisma.storeStaff.findUnique({
  where: {
    userId_storeId: {
      userId: context.userId,
      storeId: storeId,
    },
  },
});

if (!storeStaff || !storeStaff.isActive) {
  throw new Error('No access to this store');
}
```

### 3. Audit Important Actions

```typescript
// Log significant operations
await prisma.auditLog.create({
  data: {
    userId: context.userId,
    action: 'PRODUCT_DELETED',
    resource: 'Product',
    resourceId: productId,
    metadata: { productName, sku },
  },
});
```

### 4. Use Transactions for Complex Operations

```typescript
await prisma.$transaction(async (tx) => {
  // Update product
  await tx.product.update({ /* ... */ });
  
  // Adjust inventory
  await tx.inventoryLog.create({ /* ... */ });
  
  // Create audit log
  await tx.auditLog.create({ /* ... */ });
});
```

---

## 📊 Permission Comparison

| Feature | SUPER_ADMIN | OWNER | ADMIN | STORE_ADMIN |
|---------|-------------|-------|-------|-------------|
| **Manage All Stores** | ✅ | ✅ Org only | ✅ Org only | ❌ |
| **Assigned Store Products** | ✅ | ✅ | ✅ | ✅ |
| **Assigned Store Orders** | ✅ | ✅ | ✅ | ✅ |
| **Assigned Store Inventory** | ✅ | ✅ | ✅ | ✅ |
| **Assigned Store Customers** | ✅ | ✅ | ✅ | ✅ |
| **Assigned Store Reports** | ✅ | ✅ | ✅ | ✅ |
| **Assign Staff to Store** | ✅ | ✅ | ✅ | ✅ |
| **Assign Another STORE_ADMIN** | ✅ | ✅ | ✅ | ❌ |
| **Organization Settings** | ✅ | ✅ | ✅ | ❌ |
| **Billing** | ✅ | ✅ | ❌ | ❌ |
| **Multi-Store Access** | ✅ All | ✅ Org | ✅ Org | ⚠️ Assigned only |

---

## 🔧 Current Implementation Status

### ✅ Implemented
- [x] StoreStaff database model with relations
- [x] Role-based permission system
- [x] Store-level permission checks
- [x] API endpoints for staff management (`/api/store-staff`)
- [x] Permission utilities (`auth-helpers.ts`)
- [x] Client hooks (`use-permissions.ts`)
- [x] Store isolation in queries
- [x] Security validations (cannot assign SUPER_ADMIN/OWNER)

### 🚧 Ready to Implement
- [ ] Store Admin dashboard UI
- [ ] Product management interface
- [ ] Inventory management UI
- [ ] Order processing interface
- [ ] Customer management UI
- [ ] Reports and analytics dashboard
- [ ] Staff management interface
- [ ] Store switcher (for multi-store admins)

---

## 📖 Related Documentation

- **Permissions System**: `docs/ROLE_BASED_PERMISSIONS_IMPLEMENTATION.md`
- **Super Admin**: `docs/SUPER_ADMIN_GUIDE.md`
- **Security Audit**: `docs/SECURITY_AUDIT_REPORT.md`
- **Database Schema**: `docs/DATABASE_SCHEMA_QUICK_REFERENCE.md`
- **API Endpoints**: `docs/complete-implementations/API_ENDPOINTS_COMPREHENSIVE.md`

---

## 🚀 Next Steps

1. **Create Store Admin Test User**
   ```bash
   npm run seed  # Already creates test users
   ```

2. **Test Store Admin Login**
   - Use credentials from seed script
   - Verify `storeRole === 'STORE_ADMIN'`

3. **Build Dashboard UI**
   - Product management interface
   - Order processing workflow
   - Inventory management

4. **Implement Reports**
   - Sales analytics
   - Product performance
   - Customer insights

---

**Store Admin = Full Store Control** 🏪
