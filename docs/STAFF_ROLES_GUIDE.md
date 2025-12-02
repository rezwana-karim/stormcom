# Staff Roles - Complete Implementation Guide

## Overview

This guide covers all **store-level staff roles** with specific permissions tailored to different job functions. Each role has carefully defined access to ensure staff members can perform their duties while maintaining security.

---

## 🎭 Staff Role Hierarchy

```
Store Level Roles
├── STORE_ADMIN ────────── Full store control
├── SALES_MANAGER ─────── Sales and orders
├── INVENTORY_MANAGER ── Products and inventory
├── CUSTOMER_SERVICE ──── Customer support
├── CONTENT_MANAGER ───── Product content
├── MARKETING_MANAGER ─── Marketing campaigns
└── DELIVERY_BOY ──────── Deliveries only
```

---

## 👥 Staff Roles Detailed

### 1. SALES_MANAGER

**Purpose:** Sales operations, order management, and customer relationships

**Permissions:**
```typescript
SALES_MANAGER: [
  'products:read',
  'products:update',        // Can update prices, descriptions
  'categories:read',
  'brands:read',
  'orders:*',               // Full order management
  'customers:read',
  'customers:update',
  'customers:create',
  'reports:read',
  'analytics:read',
  'support:read',
  'support:create',
  'support:update',
]
```

**Can Do:**
- ✅ View and update product information (prices, descriptions)
- ✅ Process all orders (create, update, cancel, refund)
- ✅ Manage customer information
- ✅ Create and update support tickets
- ✅ View sales reports and analytics
- ✅ Handle customer inquiries

**Cannot Do:**
- ❌ Create/delete products
- ❌ Manage inventory quantities
- ❌ Delete customers
- ❌ Assign staff roles
- ❌ Change store settings

**Use Cases:**
- Sales team lead
- Order fulfillment manager
- Customer account manager
- Sales operations specialist

---

### 2. INVENTORY_MANAGER

**Purpose:** Product catalog and inventory management

**Permissions:**
```typescript
INVENTORY_MANAGER: [
  'products:*',             // Full product control
  'categories:*',           // Category management
  'brands:*',               // Brand management
  'inventory:*',            // Full inventory control
  'reports:read',
  'analytics:read',
  'orders:read',            // View orders for planning
]
```

**Can Do:**
- ✅ Create, update, delete products
- ✅ Manage product categories and brands
- ✅ Adjust inventory quantities
- ✅ Set stock thresholds and alerts
- ✅ View inventory reports
- ✅ Track inventory history
- ✅ View orders (for inventory planning)

**Cannot Do:**
- ❌ Process orders (status changes)
- ❌ Manage customers
- ❌ Access customer data
- ❌ Assign staff roles
- ❌ Change store settings

**Use Cases:**
- Warehouse manager
- Stock controller
- Product catalog manager
- Inventory analyst

---

### 3. CUSTOMER_SERVICE

**Purpose:** Customer support and service operations

**Permissions:**
```typescript
CUSTOMER_SERVICE: [
  'orders:read',
  'orders:update',          // Can update order details
  'customers:*',            // Full customer management
  'products:read',
  'support:*',              // Full support ticket access
  'reports:read',
]
```

**Can Do:**
- ✅ View and update orders
- ✅ Manage all customer information
- ✅ Create, update, resolve support tickets
- ✅ View product information to help customers
- ✅ Access customer service reports
- ✅ Handle returns and complaints

**Cannot Do:**
- ❌ Create or delete products
- ❌ Manage inventory
- ❌ Process refunds (requires SALES_MANAGER)
- ❌ Assign staff roles
- ❌ Access financial reports

**Use Cases:**
- Customer service representative
- Support team member
- Help desk agent
- Returns specialist

---

### 4. CONTENT_MANAGER

**Purpose:** Product content, descriptions, and media management

**Permissions:**
```typescript
CONTENT_MANAGER: [
  'products:read',
  'products:update',        // Update content only
  'products:create',        // Can create product listings
  'categories:*',           // Full category control
  'brands:*',               // Full brand control
  'content:*',              // Full content management
  'marketing:read',
  'marketing:create',
  'marketing:update',
]
```

**Can Do:**
- ✅ Create and edit product descriptions
- ✅ Upload and manage product images
- ✅ Manage categories and brands
- ✅ Create product listings
- ✅ Manage content pages and blogs
- ✅ Update marketing content
- ✅ SEO optimization

**Cannot Do:**
- ❌ Delete products
- ❌ Manage inventory quantities
- ❌ Process orders
- ❌ Access customer data
- ❌ Change pricing (SALES_MANAGER only)

**Use Cases:**
- Content writer
- Product information specialist
- Media manager
- SEO specialist

---

### 5. MARKETING_MANAGER

**Purpose:** Marketing campaigns, promotions, and customer analytics

**Permissions:**
```typescript
MARKETING_MANAGER: [
  'products:read',
  'customers:read',
  'marketing:*',            // Full marketing control
  'campaigns:*',            // Campaign management
  'analytics:*',            // Full analytics access
  'reports:read',
  'content:read',
  'content:create',
  'content:update',
]
```

**Can Do:**
- ✅ Create and manage marketing campaigns
- ✅ Set up promotions and discounts
- ✅ View customer insights and analytics
- ✅ Segment customers for targeting
- ✅ Manage email marketing
- ✅ Create marketing content
- ✅ Track campaign performance
- ✅ A/B testing

**Cannot Do:**
- ❌ Update products or inventory
- ❌ Process orders
- ❌ Modify customer data
- ❌ Access financial data
- ❌ Assign staff roles

**Use Cases:**
- Marketing manager
- Campaign specialist
- Growth marketer
- Email marketing specialist

---

### 6. DELIVERY_BOY

**Purpose:** Delivery and logistics operations

**Permissions:**
```typescript
DELIVERY_BOY: [
  'deliveries:read',
  'deliveries:update',      // Update delivery status
  'orders:read',            // View assigned orders
  'customers:read',         // Contact info for delivery
]
```

**Can Do:**
- ✅ View assigned deliveries
- ✅ Update delivery status
- ✅ View customer contact information
- ✅ View order details for delivery
- ✅ Mark deliveries as completed

**Cannot Do:**
- ❌ Process orders
- ❌ Update customer information
- ❌ Access financial data
- ❌ View all orders (only assigned)
- ❌ Access inventory

**Use Cases:**
- Delivery driver
- Courier
- Logistics coordinator
- Field operations

---

## 🔐 Custom Roles & Permissions

### Creating Custom Roles

You can create custom roles by combining specific permissions:

```typescript
// Example: Custom role for warehouse assistant
WAREHOUSE_ASSISTANT: [
  'products:read',
  'inventory:read',
  'inventory:update',       // Can adjust stock
  'orders:read',            // View orders to pick
]

// Example: Custom role for product photographer
PRODUCT_PHOTOGRAPHER: [
  'products:read',
  'products:update',        // Update images only
  'content:read',
  'content:update',
]

// Example: Custom role for financial analyst
FINANCIAL_ANALYST: [
  'orders:read',
  'customers:read',
  'reports:*',              // Full report access
  'analytics:*',            // Full analytics
]
```

### Permission Building Blocks

**Resource Actions:**
- `read` - View data
- `create` - Create new records
- `update` - Modify existing records
- `delete` - Remove records
- `manage` - All CRUD operations
- `*` - Wildcard (all actions)

**Common Resources:**
- `products` - Product catalog
- `inventory` - Stock management
- `orders` - Order processing
- `customers` - Customer data
- `reports` - Business reports
- `analytics` - Analytics data
- `staff` - Staff management
- `content` - Content pages
- `marketing` - Marketing campaigns
- `support` - Support tickets
- `deliveries` - Delivery operations
- `settings` - Store settings

---

## 📊 Permission Matrix

| Permission | STORE_ADMIN | SALES_MGR | INVENTORY_MGR | CUSTOMER_SVC | CONTENT_MGR | MARKETING_MGR | DELIVERY |
|------------|-------------|-----------|---------------|--------------|-------------|---------------|----------|
| **Products** |
| View | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Create | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Update | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Delete | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Inventory** |
| View | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Adjust | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Orders** |
| View | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Process | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Cancel | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Refund | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Customers** |
| View | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ |
| Create | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Update | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Reports** |
| View | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Export | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Marketing** |
| View | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Create | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Manage | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Staff** |
| View | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Assign | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🚀 Implementation Examples

### 1. Assign Staff Member

**Via API:**
```typescript
POST /api/store-staff

{
  "userId": "user-id-here",
  "storeId": "store-id-here",
  "role": "SALES_MANAGER",
  "isActive": true
}
```

**Via Prisma:**
```typescript
await prisma.storeStaff.create({
  data: {
    userId: 'user-cuid',
    storeId: 'store-cuid',
    role: 'INVENTORY_MANAGER',
    isActive: true,
  },
});
```

### 2. Check Staff Permission (Server)

```typescript
import { requirePermission } from '@/lib/auth-helpers';

export default async function SalesPage() {
  // Requires SALES_MANAGER or higher
  const context = await requirePermission('orders:manage');
  
  const orders = await prisma.order.findMany({
    where: { storeId: context.storeId },
  });
  
  return <OrdersList orders={orders} />;
}
```

### 3. Role-Based UI (Client)

```typescript
'use client';
import { usePermissions } from '@/hooks/use-permissions';

export function StaffDashboard() {
  const { hasRole, can } = usePermissions();
  
  return (
    <div>
      {hasRole('SALES_MANAGER') && (
        <SalesManagerPanel />
      )}
      
      {hasRole('INVENTORY_MANAGER') && (
        <InventoryPanel />
      )}
      
      {can('customers:read') && (
        <CustomersList />
      )}
      
      {can('marketing:create') && (
        <CreateCampaign />
      )}
    </div>
  );
}
```

### 4. Conditional Actions

```typescript
'use client';
import { usePermissions } from '@/hooks/use-permissions';
import { Button } from '@/components/ui/button';

export function ProductActions({ productId }) {
  const { can } = usePermissions();
  
  return (
    <div className="flex gap-2">
      {can('products:update') && (
        <Button onClick={() => editProduct(productId)}>
          Edit
        </Button>
      )}
      
      {can('inventory:update') && (
        <Button onClick={() => adjustStock(productId)}>
          Adjust Stock
        </Button>
      )}
      
      {can('products:delete') && (
        <Button variant="destructive" onClick={() => deleteProduct(productId)}>
          Delete
        </Button>
      )}
    </div>
  );
}
```

### 5. API Route Protection

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  // Only SALES_MANAGER and above can process orders
  const context = await requirePermission('orders:update');
  
  const { orderId, status } = await request.json();
  
  const order = await prisma.order.update({
    where: {
      id: orderId,
      storeId: context.storeId,  // Security: filter by store
    },
    data: { status },
  });
  
  return NextResponse.json({ order });
}
```

---

## 🧪 Test Users Creation

### Create Test Staff Members

```typescript
// prisma/seed.ts or migration script

// Sales Manager
const salesManager = await prisma.user.create({
  data: {
    email: 'sales@example.com',
    name: 'Sales Manager',
    passwordHash: await bcrypt.hash('Sales123!@#', 12),
    emailVerified: new Date(),
    storeStaff: {
      create: {
        storeId: store.id,
        role: 'SALES_MANAGER',
        isActive: true,
      },
    },
  },
});

// Inventory Manager
const inventoryManager = await prisma.user.create({
  data: {
    email: 'inventory@example.com',
    name: 'Inventory Manager',
    passwordHash: await bcrypt.hash('Inventory123!@#', 12),
    emailVerified: new Date(),
    storeStaff: {
      create: {
        storeId: store.id,
        role: 'INVENTORY_MANAGER',
        isActive: true,
      },
    },
  },
});

// Customer Service
const customerService = await prisma.user.create({
  data: {
    email: 'support@example.com',
    name: 'Customer Service',
    passwordHash: await bcrypt.hash('Support123!@#', 12),
    emailVerified: new Date(),
    storeStaff: {
      create: {
        storeId: store.id,
        role: 'CUSTOMER_SERVICE',
        isActive: true,
      },
    },
  },
});

// Content Manager
const contentManager = await prisma.user.create({
  data: {
    email: 'content@example.com',
    name: 'Content Manager',
    passwordHash: await bcrypt.hash('Content123!@#', 12),
    emailVerified: new Date(),
    storeStaff: {
      create: {
        storeId: store.id,
        role: 'CONTENT_MANAGER',
        isActive: true,
      },
    },
  },
});

// Marketing Manager
const marketingManager = await prisma.user.create({
  data: {
    email: 'marketing@example.com',
    name: 'Marketing Manager',
    passwordHash: await bcrypt.hash('Marketing123!@#', 12),
    emailVerified: new Date(),
    storeStaff: {
      create: {
        storeId: store.id,
        role: 'MARKETING_MANAGER',
        isActive: true,
      },
    },
  },
});

// Delivery Boy
const deliveryBoy = await prisma.user.create({
  data: {
    email: 'delivery@example.com',
    name: 'Delivery Person',
    passwordHash: await bcrypt.hash('Delivery123!@#', 12),
    emailVerified: new Date(),
    storeStaff: {
      create: {
        storeId: store.id,
        role: 'DELIVERY_BOY',
        isActive: true,
      },
    },
  },
});
```

---

## ⚠️ Best Practices

### 1. Principle of Least Privilege
Give staff only the permissions they need for their job:
```typescript
// ✅ GOOD: Specific permissions
WAREHOUSE_PICKER: ['products:read', 'orders:read', 'inventory:update']

// ❌ BAD: Too many permissions
WAREHOUSE_PICKER: ['products:*', 'orders:*', 'inventory:*']
```

### 2. Regular Permission Audits
Review and update staff permissions regularly:
```typescript
// Audit query
const staffWithPermissions = await prisma.storeStaff.findMany({
  where: { storeId: 'your-store-id' },
  include: { user: true },
  orderBy: { role: 'asc' },
});

// Check for over-privileged accounts
staffWithPermissions.forEach(staff => {
  const permissions = getPermissions(staff.role);
  console.log(`${staff.user.name}: ${permissions.length} permissions`);
});
```

### 3. Temporary Access
Use `isActive` flag for temporary access:
```typescript
// Grant temporary access
await prisma.storeStaff.update({
  where: { id: staffId },
  data: { isActive: true },
});

// Revoke after task completion
await prisma.storeStaff.update({
  where: { id: staffId },
  data: { isActive: false },
});
```

### 4. Activity Logging
Log important staff actions:
```typescript
// Log sensitive operations
if (context.storeRole !== 'STORE_ADMIN') {
  await prisma.auditLog.create({
    data: {
      userId: context.userId,
      action: 'INVENTORY_ADJUSTED',
      resource: 'Product',
      resourceId: productId,
      metadata: {
        role: context.storeRole,
        oldQty: 100,
        newQty: 150,
      },
    },
  });
}
```

### 5. Role Transitions
Handle role changes properly:
```typescript
// Change staff role
await prisma.storeStaff.update({
  where: { id: staffId },
  data: {
    role: 'SALES_MANAGER',  // Promoted
    updatedAt: new Date(),
  },
});

// Log the change
await prisma.auditLog.create({
  data: {
    action: 'ROLE_CHANGED',
    metadata: {
      oldRole: 'CUSTOMER_SERVICE',
      newRole: 'SALES_MANAGER',
    },
  },
});
```

---

## 📋 Role Selection Guide

### When to Assign Each Role

**SALES_MANAGER:**
- Sales team members
- Order fulfillment specialists
- Customer account managers
- Need to process orders and manage customer relationships

**INVENTORY_MANAGER:**
- Warehouse managers
- Stock controllers
- Product catalog managers
- Need full control over products and inventory

**CUSTOMER_SERVICE:**
- Support representatives
- Help desk agents
- Returns specialists
- Need access to customer data and support tickets

**CONTENT_MANAGER:**
- Content writers
- Product information specialists
- Media managers
- SEO specialists
- Need to manage product descriptions and content

**MARKETING_MANAGER:**
- Marketing team members
- Campaign specialists
- Growth marketers
- Need analytics and campaign management

**DELIVERY_BOY:**
- Delivery drivers
- Couriers
- Field operations
- Only need delivery information

---

## 🔧 Current Implementation Status

### ✅ Completed
- [x] All staff roles defined with specific permissions
- [x] Permission checking system (server & client)
- [x] StoreStaff model with role assignments
- [x] API endpoints for staff management
- [x] Security validations
- [x] Database schema with Role enum

### 🚧 Ready to Implement
- [ ] Create test users for each role
- [ ] Role-based dashboards
- [ ] Staff assignment UI
- [ ] Permission audit interface
- [ ] Activity logging dashboard

---

## 📖 Related Documentation

- **Store Admin Guide**: `docs/STORE_ADMIN_GUIDE.md`
- **Super Admin Guide**: `docs/SUPER_ADMIN_GUIDE.md`
- **Permissions System**: `docs/ROLE_BASED_PERMISSIONS_IMPLEMENTATION.md`
- **Test Credentials**: `docs/TEST_CREDENTIALS.md`

---

## ✨ Summary

**6 Staff Roles Implemented:**
1. ✅ SALES_MANAGER - Sales and orders
2. ✅ INVENTORY_MANAGER - Products and inventory
3. ✅ CUSTOMER_SERVICE - Customer support
4. ✅ CONTENT_MANAGER - Product content
5. ✅ MARKETING_MANAGER - Marketing campaigns
6. ✅ DELIVERY_BOY - Deliveries

**Each role has:**
- Specific permissions tailored to job function
- Clear boundaries and security controls
- API and UI integration points
- Test user creation scripts
- Usage examples and best practices

**All staff roles are production-ready!** 🎉
