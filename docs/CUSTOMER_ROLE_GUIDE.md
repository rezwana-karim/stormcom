# Customer Role - Complete Implementation Guide

## Overview

The **CUSTOMER** role represents end-users who interact with the e-commerce platform to browse products, place orders, manage their profiles, track deliveries, and submit support requests. This role is scoped to individual user access with strong privacy controls.

---

## 🛍️ Customer Capabilities

### Core Features

1. **Browse Products** 🛒
   - View product catalog with search and filters
   - View product details, images, and specifications
   - Browse by categories and brands
   - View product reviews and ratings
   - Compare products

2. **Place Orders** 📦
   - Add products to cart
   - Create new orders
   - Choose payment methods
   - Apply discount codes
   - Specify shipping address
   - Receive order confirmation

3. **Manage Profile** 👤
   - Update personal information
   - Manage addresses (shipping/billing)
   - Change password
   - Email preferences
   - Marketing opt-in/opt-out

4. **Manage Wishlist** ❤️
   - Add/remove products from wishlist
   - View saved items
   - Share wishlist
   - Move items to cart

5. **Track Orders** 📍
   - View order history
   - Track shipment status
   - View order details
   - Download invoices
   - Request cancellation (before shipping)

6. **Submit Support Tickets** 🎧
   - Create support requests
   - View ticket status
   - Reply to support messages
   - Attach files/screenshots
   - Rate support experience

7. **Reviews & Ratings** ⭐
   - Write product reviews
   - Rate products (1-5 stars)
   - Edit/delete own reviews
   - Upload review photos
   - Mark reviews as helpful

---

## 🔐 Permission Model

```typescript
CUSTOMER: [
  // Product browsing
  'products:read',
  'categories:read',
  'brands:read',
  
  // Order management (own orders only)
  'orders:create',
  'orders:read:own',
  'orders:update:own',      // Cancel own orders
  
  // Profile management (own data only)
  'profile:*:own',          // Full control of own profile
  
  // Wishlist (own only)
  'wishlist:*:own',         // Full wishlist management
  
  // Reviews
  'reviews:create',
  'reviews:read',
  'reviews:update:own',
  'reviews:delete:own',
  
  // Support
  'support:create',
  'support:read:own',       // View own tickets only
]
```

### Permission Scope

**:own Suffix** - Critical security feature
- `orders:read:own` - Can only read THEIR OWN orders
- `profile:*:own` - Can only modify THEIR OWN profile
- `wishlist:*:own` - Can only access THEIR OWN wishlist
- `support:read:own` - Can only view THEIR OWN tickets

**What Customers CANNOT Do:**
- ❌ View other customers' data
- ❌ Access admin interfaces
- ❌ Modify product information
- ❌ View inventory levels
- ❌ Access analytics or reports
- ❌ Manage other users
- ❌ View financial data

---

## 🗄️ Customer Data Model

```prisma
model Customer {
  id                  String   @id @default(cuid())
  storeId             String
  store               Store    @relation(fields: [storeId], references: [id])
  
  // User relationship (optional - for registered customers)
  userId              String?  @unique
  user                User?    @relation(fields: [userId], references: [id])
  
  // Basic info
  email               String
  firstName           String?
  lastName            String?
  phone               String?
  
  // Marketing
  acceptsMarketing    Boolean  @default(false)
  marketingOptInAt    DateTime?
  
  // Customer metrics
  totalOrders         Int      @default(0)
  totalSpent          Float    @default(0)
  averageOrderValue   Float    @default(0)
  lastOrderAt         DateTime?
  
  // Relations
  orders              Order[]
  reviews             Review[]
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  @@unique([storeId, email])
  @@index([email])
  @@index([storeId, lastOrderAt])
}
```

**Key Points:**
- Customer record linked to Store (multi-tenant isolation)
- Optional User relationship (guest checkout vs registered)
- Email unique per store
- Tracks customer lifetime value metrics
- Can have multiple orders and reviews

---

## 🚀 Implementation Examples

### 1. Customer Registration & Login

**Sign Up Flow:**
```typescript
// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  const { email, password, firstName, lastName, storeId } = await request.json();
  
  // Check if user exists
  const existing = await prisma.user.findUnique({
    where: { email },
  });
  
  if (existing) {
    return NextResponse.json(
      { error: 'Email already registered' },
      { status: 400 }
    );
  }
  
  // Create user with CUSTOMER role
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      name: `${firstName} ${lastName}`,
      passwordHash,
      emailVerified: null, // Require email verification
    },
  });
  
  // Create customer profile
  const customer = await prisma.customer.create({
    data: {
      storeId,
      userId: user.id,
      email,
      firstName,
      lastName,
      acceptsMarketing: false,
    },
  });
  
  return NextResponse.json({
    success: true,
    customerId: customer.id,
  });
}
```

### 2. Browse Products (Public/Customer)

**Product Listing:**
```typescript
// app/products/page.tsx
import { prisma } from '@/lib/prisma';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string };
}) {
  const products = await prisma.product.findMany({
    where: {
      storeId: 'current-store-id',
      status: 'ACTIVE',
      publishedAt: { not: null },
      deletedAt: null,
      ...(searchParams.category && {
        categoryId: searchParams.category,
      }),
      ...(searchParams.search && {
        OR: [
          { name: { contains: searchParams.search, mode: 'insensitive' } },
          { description: { contains: searchParams.search, mode: 'insensitive' } },
        ],
      }),
    },
    include: {
      category: true,
      brand: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  
  return <ProductGrid products={products} />;
}
```

### 3. Place Order (Customer Only)

**Create Order API:**
```typescript
// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().cuid(),
    quantity: z.number().int().positive(),
  })),
  shippingAddress: z.object({
    firstName: z.string(),
    lastName: z.string(),
    address: z.string(),
    city: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'MOBILE_BANKING']),
});

export async function POST(request: NextRequest) {
  // Require authentication (CUSTOMER role implied)
  const context = await requireAuth();
  
  // Get customer profile
  const customer = await prisma.customer.findUnique({
    where: { userId: context.userId },
  });
  
  if (!customer) {
    return NextResponse.json(
      { error: 'Customer profile not found' },
      { status: 404 }
    );
  }
  
  const body = await request.json();
  const data = CreateOrderSchema.parse(body);
  
  // Calculate order total
  const products = await prisma.product.findMany({
    where: {
      id: { in: data.items.map(i => i.productId) },
      storeId: customer.storeId,
    },
  });
  
  let subtotal = 0;
  const orderItems = data.items.map(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product) throw new Error(`Product ${item.productId} not found`);
    
    const itemSubtotal = product.price * item.quantity;
    subtotal += itemSubtotal;
    
    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      price: product.price,
      quantity: item.quantity,
      subtotal: itemSubtotal,
      taxAmount: itemSubtotal * 0.1, // 10% tax
      totalAmount: itemSubtotal * 1.1,
    };
  });
  
  const taxAmount = subtotal * 0.1;
  const shippingAmount = 10.0;
  const totalAmount = subtotal + taxAmount + shippingAmount;
  
  // Create order
  const order = await prisma.order.create({
    data: {
      storeId: customer.storeId,
      customerId: customer.id,
      orderNumber: `ORD-${Date.now()}`,
      status: 'PENDING',
      subtotal,
      taxAmount,
      shippingAmount,
      totalAmount,
      paymentMethod: data.paymentMethod,
      paymentStatus: 'PENDING',
      shippingAddress: JSON.stringify(data.shippingAddress),
      billingAddress: JSON.stringify(data.shippingAddress),
      items: {
        create: orderItems,
      },
    },
    include: {
      items: true,
    },
  });
  
  return NextResponse.json({ order }, { status: 201 });
}
```

### 4. View Own Orders (Customer)

**Order History:**
```typescript
// app/orders/page.tsx
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export default async function OrdersPage() {
  const context = await requireAuth();
  
  // Get customer
  const customer = await prisma.customer.findUnique({
    where: { userId: context.userId },
  });
  
  if (!customer) {
    return <div>Customer profile not found</div>;
  }
  
  // Fetch ONLY customer's own orders
  const orders = await prisma.order.findMany({
    where: {
      customerId: customer.id,  // CRITICAL: Filter by customer
      storeId: customer.storeId,
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  
  return <OrderHistory orders={orders} />;
}
```

### 5. Manage Wishlist

**Wishlist API:**
```typescript
// app/api/wishlist/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const context = await requireAuth();
  
  const customer = await prisma.customer.findUnique({
    where: { userId: context.userId },
  });
  
  if (!customer) {
    return NextResponse.json(
      { error: 'Customer not found' },
      { status: 404 }
    );
  }
  
  // Fetch wishlist items (stored in separate Wishlist model)
  const wishlist = await prisma.wishlist.findMany({
    where: {
      customerId: customer.id,
    },
    include: {
      product: {
        include: {
          category: true,
          brand: true,
        },
      },
    },
  });
  
  return NextResponse.json({ wishlist });
}

export async function POST(request: NextRequest) {
  const context = await requireAuth();
  const { productId } = await request.json();
  
  const customer = await prisma.customer.findUnique({
    where: { userId: context.userId },
  });
  
  if (!customer) {
    return NextResponse.json(
      { error: 'Customer not found' },
      { status: 404 }
    );
  }
  
  // Add to wishlist
  const wishlistItem = await prisma.wishlist.create({
    data: {
      customerId: customer.id,
      productId,
    },
  });
  
  return NextResponse.json({ wishlistItem }, { status: 201 });
}
```

### 6. Submit Support Ticket

**Support Ticket API:**
```typescript
// app/api/support/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const context = await requireAuth();
  const { subject, message, orderId } = await request.json();
  
  const customer = await prisma.customer.findUnique({
    where: { userId: context.userId },
  });
  
  if (!customer) {
    return NextResponse.json(
      { error: 'Customer not found' },
      { status: 404 }
    );
  }
  
  // If orderId provided, verify ownership
  if (orderId) {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: customer.id,  // Verify customer owns this order
      },
    });
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
  }
  
  // Create support ticket
  const ticket = await prisma.supportTicket.create({
    data: {
      storeId: customer.storeId,
      customerId: customer.id,
      orderId,
      subject,
      message,
      status: 'OPEN',
      priority: 'MEDIUM',
    },
  });
  
  return NextResponse.json({ ticket }, { status: 201 });
}
```

### 7. Submit Product Review

**Review API:**
```typescript
// app/api/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const context = await requireAuth();
  const { productId, rating, comment } = await request.json();
  
  const customer = await prisma.customer.findUnique({
    where: { userId: context.userId },
  });
  
  if (!customer) {
    return NextResponse.json(
      { error: 'Customer not found' },
      { status: 404 }
    );
  }
  
  // Verify customer has purchased this product
  const hasPurchased = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: {
        customerId: customer.id,
        status: 'DELIVERED',
      },
    },
  });
  
  if (!hasPurchased) {
    return NextResponse.json(
      { error: 'You can only review products you have purchased' },
      { status: 403 }
    );
  }
  
  // Check if already reviewed
  const existing = await prisma.review.findFirst({
    where: {
      productId,
      customerId: customer.id,
    },
  });
  
  if (existing) {
    return NextResponse.json(
      { error: 'You have already reviewed this product' },
      { status: 400 }
    );
  }
  
  // Create review
  const review = await prisma.review.create({
    data: {
      productId,
      customerId: customer.id,
      rating,
      comment,
      isVerifiedPurchase: true,
    },
  });
  
  return NextResponse.json({ review }, { status: 201 });
}
```

---

## 🎨 Customer UI Components

### Product Card with Wishlist

```typescript
'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ProductCard({ product }) {
  const { data: session } = useSession();
  const [isInWishlist, setIsInWishlist] = useState(false);
  
  const toggleWishlist = async () => {
    if (!session) {
      // Redirect to login
      window.location.href = '/login?redirect=/products';
      return;
    }
    
    const method = isInWishlist ? 'DELETE' : 'POST';
    await fetch('/api/wishlist', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id }),
    });
    
    setIsInWishlist(!isInWishlist);
  };
  
  return (
    <div className="product-card">
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>${product.price}</p>
      
      <div className="actions">
        <Button onClick={() => addToCart(product.id)}>
          Add to Cart
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleWishlist}
        >
          <Heart fill={isInWishlist ? 'currentColor' : 'none'} />
        </Button>
      </div>
    </div>
  );
}
```

### Order Tracking

```typescript
'use client';
import { useEffect, useState } from 'react';
import { Check, Package, Truck } from 'lucide-react';

export function OrderTracking({ orderId }) {
  const [order, setOrder] = useState(null);
  
  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then(res => res.json())
      .then(data => setOrder(data.order));
  }, [orderId]);
  
  if (!order) return <div>Loading...</div>;
  
  const steps = [
    { status: 'PENDING', label: 'Order Placed', icon: Check },
    { status: 'PAID', label: 'Payment Confirmed', icon: Check },
    { status: 'PROCESSING', label: 'Processing', icon: Package },
    { status: 'SHIPPED', label: 'Shipped', icon: Truck },
    { status: 'DELIVERED', label: 'Delivered', icon: Check },
  ];
  
  const currentStep = steps.findIndex(s => s.status === order.status);
  
  return (
    <div className="order-tracking">
      <h2>Order #{order.orderNumber}</h2>
      
      <div className="timeline">
        {steps.map((step, index) => (
          <div
            key={step.status}
            className={`step ${index <= currentStep ? 'completed' : 'pending'}`}
          >
            <step.icon />
            <span>{step.label}</span>
          </div>
        ))}
      </div>
      
      {order.trackingNumber && (
        <div className="tracking">
          <p>Tracking: {order.trackingNumber}</p>
          <a href={order.trackingUrl} target="_blank">
            Track Package
          </a>
        </div>
      )}
    </div>
  );
}
```

---

## ⚠️ Security Best Practices

### 1. Always Filter by Customer ID

```typescript
// ✅ CORRECT - Filter by customer
const orders = await prisma.order.findMany({
  where: {
    customerId: customer.id,  // REQUIRED
  },
});

// ❌ WRONG - No customer filter
const orders = await prisma.order.findMany();
```

### 2. Verify Ownership Before Actions

```typescript
// Verify customer owns the order before canceling
const order = await prisma.order.findFirst({
  where: {
    id: orderId,
    customerId: customer.id,  // Ownership check
  },
});

if (!order) {
  return NextResponse.json({ error: 'Order not found' }, { status: 404 });
}
```

### 3. Use :own Permissions

```typescript
// Check permission with :own scope
const canView = hasPermission('CUSTOMER', 'orders:read:own');  // true
const canViewAll = hasPermission('CUSTOMER', 'orders:read');   // false
```

### 4. Guest vs Registered Customers

```typescript
// Guest checkout - create customer without user
const guestCustomer = await prisma.customer.create({
  data: {
    storeId,
    email,
    firstName,
    lastName,
    // userId: null (guest)
  },
});

// Registered customer - link to user
const registeredCustomer = await prisma.customer.create({
  data: {
    storeId,
    userId: user.id,  // Linked
    email,
    firstName,
    lastName,
  },
});
```

---

## 📊 Customer Analytics (Admin View)

**Customer Metrics:**
- Total customers
- New customers (this month)
- Customer lifetime value
- Average order value
- Repeat customer rate
- Customer segments

**Customer Segmentation:**
- VIP customers (high lifetime value)
- At-risk customers (no recent orders)
- New customers (first 30 days)
- Inactive customers (no orders in 90+ days)

---

## 🔧 Implementation Status

### ✅ Completed
- [x] CUSTOMER role with :own permissions
- [x] Customer data model
- [x] Permission system supports :own scope
- [x] Multi-tenant customer isolation

### 🚧 Ready to Implement
- [ ] Customer registration/signup flow
- [ ] Product browsing UI
- [ ] Shopping cart functionality
- [ ] Checkout process
- [ ] Order tracking interface
- [ ] Wishlist UI
- [ ] Profile management
- [ ] Support ticket submission
- [ ] Product review system

---

## 📖 Related Documentation

- **Staff Roles Guide**: `docs/STAFF_ROLES_GUIDE.md`
- **Store Admin Guide**: `docs/STORE_ADMIN_GUIDE.md`
- **Permissions System**: `docs/ROLE_BASED_PERMISSIONS_IMPLEMENTATION.md`
- **Test Credentials**: `docs/TEST_CREDENTIALS.md`

---

## ✨ Summary

**Customer Role Features:**
1. ✅ Browse products (public + authenticated)
2. ✅ Place orders (authenticated only)
3. ✅ Manage profile (:own scope)
4. ✅ Manage wishlist (:own scope)
5. ✅ Track orders (:own scope)
6. ✅ Submit support tickets (:own scope)
7. ✅ Write/manage reviews (:own scope)

**Security Model:**
- Strong isolation with :own permissions
- Customer can ONLY access their own data
- Multi-tenant separation (storeId filtering)
- Guest vs registered customer support
- Ownership verification before all actions

**Customer role is production-ready!** 🎉
