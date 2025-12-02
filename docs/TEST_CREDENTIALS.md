# StormCom - Test Credentials

## 🔑 Authentication Credentials

### Regular User (Organization Owner)
```
Email:    test@example.com
Password: Test123!@#
Role:     OWNER (Organization level)
Access:   Demo Company organization and Demo Store
```

**Permissions:**
- Full control over "Demo Company" organization
- Manage Demo Store (products, orders, customers, inventory)
- Billing and subscription management for own organization
- Team member management
- Can assign Store Admin and other staff roles

---

### Store Admin (Store Manager)
```
Email:    storeadmin@example.com
Password: StoreAdmin123!@#
Role:     STORE_ADMIN (Store level)
Access:   Demo Store only (full control)
```

**Permissions:**
- ✅ **Full Store Control** - Complete management of assigned store
- ✅ **Product Management** - Create, update, delete products
- ✅ **Inventory Management** - Track stock, adjust quantities, set alerts
- ✅ **Order Processing** - View, process, fulfill, cancel orders
- ✅ **Customer Management** - View, update customer information
- ✅ **Reports & Analytics** - Access all store reports and analytics
- ✅ **Staff Management** - Assign staff roles (except STORE_ADMIN)
- ✅ **Store Settings** - Update store configuration
- ❌ Organization-level settings (limited to assigned store)
- ❌ Billing management (organization level only)
- ❌ Cannot assign another STORE_ADMIN (requires OWNER/ADMIN)

**Scope:**
- Store-level only (cannot access other stores without explicit assignment)
- Can be assigned to multiple stores (separate StoreStaff records)
- Full control within assigned store boundaries

---

### Super Admin (Platform Administrator)
```
Email:    superadmin@example.com
Password: SuperAdmin123!@#
Role:     SUPER_ADMIN (Platform level)
Access:   ALL - Unrestricted platform-wide access
```

**Permissions:**
- ✅ **ALL PERMISSIONS** - Wildcard `*` permission
- ✅ Manage all organizations
- ✅ Manage all stores
- ✅ System configuration and module management
- ✅ Cross-tenant support and emergency access

---

## 👥 Store Staff Members

### Sales Manager
```
Email:    sales@example.com
Password: Sales123!@#
Role:     SALES_MANAGER (Store level)
Access:   Orders, customers, sales operations
```

**Permissions:**
- ✅ **Order Management** - Full order processing (create, update, cancel, refund)
- ✅ **Customer Management** - View, create, update customers
- ✅ **Product Updates** - Update product info (prices, descriptions)
- ✅ **Sales Reports** - View sales and analytics reports
- ✅ **Support Tickets** - Create and manage support tickets
- ❌ Cannot create/delete products
- ❌ Cannot manage inventory quantities
- ❌ Cannot assign staff

**Use Cases:** Sales team lead, order fulfillment, customer account management

---

### Inventory Manager
```
Email:    inventory@example.com
Password: Inventory123!@#
Role:     INVENTORY_MANAGER (Store level)
Access:   Products, inventory, stock management
```

**Permissions:**
- ✅ **Product Management** - Full control (create, update, delete products)
- ✅ **Inventory Control** - Adjust stock, set thresholds, track history
- ✅ **Category & Brand Management** - Full control
- ✅ **Inventory Reports** - View inventory and product reports
- ✅ **Order Viewing** - View orders for inventory planning
- ❌ Cannot process orders (status changes)
- ❌ Cannot manage customers
- ❌ Cannot assign staff

**Use Cases:** Warehouse manager, stock controller, product catalog management

---

### Customer Service
```
Email:    support@example.com
Password: Support123!@#
Role:     CUSTOMER_SERVICE (Store level)
Access:   Customers, support tickets, order assistance
```

**Permissions:**
- ✅ **Customer Management** - Full control (view, create, update, delete)
- ✅ **Support Tickets** - Full support ticket management
- ✅ **Order Viewing** - View and update order details
- ✅ **Product Viewing** - View products to help customers
- ✅ **Service Reports** - View customer service reports
- ❌ Cannot process refunds (SALES_MANAGER only)
- ❌ Cannot manage products or inventory
- ❌ Cannot access financial reports

**Use Cases:** Customer service rep, help desk agent, returns specialist

---

### Content Manager
```
Email:    content@example.com
Password: Content123!@#
Role:     CONTENT_MANAGER (Store level)
Access:   Product content, descriptions, media
```

**Permissions:**
- ✅ **Product Content** - Create and edit product descriptions, images
- ✅ **Category Management** - Full control over categories
- ✅ **Brand Management** - Full control over brands
- ✅ **Content Pages** - Manage content pages and blogs
- ✅ **Marketing Content** - Create and update marketing materials
- ❌ Cannot delete products
- ❌ Cannot manage inventory quantities
- ❌ Cannot process orders
- ❌ Cannot change pricing (SALES_MANAGER only)

**Use Cases:** Content writer, product info specialist, media manager, SEO

---

### Marketing Manager
```
Email:    marketing@example.com
Password: Marketing123!@#
Role:     MARKETING_MANAGER (Store level)
Access:   Marketing campaigns, analytics, customer insights
```

**Permissions:**
- ✅ **Marketing Campaigns** - Full campaign management
- ✅ **Analytics** - Full access to analytics and insights
- ✅ **Customer Insights** - View customer data for segmentation
- ✅ **Promotions** - Create and manage discounts, promotions
- ✅ **Email Marketing** - Campaign creation and management
- ✅ **Marketing Content** - Create marketing materials
- ❌ Cannot update products or inventory
- ❌ Cannot process orders
- ❌ Cannot modify customer data
- ❌ Cannot access financial data

**Use Cases:** Marketing manager, campaign specialist, growth marketer

---

## 🛍️ Customer Accounts

### Customer (Registered #1)
```
Email:    customer1@example.com
Password: Customer123!@#
Role:     CUSTOMER (End-user)
Access:   Browse products, place orders, manage profile
```

**Permissions:**
- ✅ **Browse Products** - View product catalog, search, filter
- ✅ **Place Orders** - Create new orders, add to cart
- ✅ **Order Tracking** - View own order history and tracking
- ✅ **Profile Management** - Update personal information, addresses
- ✅ **Wishlist** - Add/remove products from wishlist
- ✅ **Reviews** - Write and manage product reviews
- ✅ **Support Tickets** - Submit and track support requests
- ❌ Cannot view other customers' data
- ❌ Cannot access admin interfaces
- ❌ Cannot view inventory or analytics
- ❌ Cannot manage other users

**Profile Info:**
- First Name: John
- Last Name: Customer
- Phone: +1-555-0101
- Marketing Opt-in: Yes
- Registered user (linked to User account)

---

### Customer (Registered #2)
```
Email:    customer2@example.com
Password: Customer123!@#
Role:     CUSTOMER (End-user)
Access:   Browse products, place orders, manage profile
```

**Permissions:**
- ✅ **Browse Products** - View product catalog, search, filter
- ✅ **Place Orders** - Create new orders, add to cart
- ✅ **Order Tracking** - View own order history and tracking
- ✅ **Profile Management** - Update personal information, addresses
- ✅ **Wishlist** - Add/remove products from wishlist
- ✅ **Reviews** - Write and manage product reviews
- ✅ **Support Tickets** - Submit and track support requests
- ❌ Cannot view other customers' data
- ❌ Cannot access admin interfaces
- ❌ Cannot view inventory or analytics
- ❌ Cannot manage other users

**Profile Info:**
- First Name: Jane
- Last Name: Shopper
- Phone: +1-555-0102
- Marketing Opt-in: No
- Registered user (linked to User account)

---

### Guest Customers
**Note**: The following customers are "guest checkout" customers (no user account, cannot log in):
- john.doe@example.com - Guest customer (has orders, no login)
- jane.smith@example.com - Guest customer
- bob.wilson@example.com - Guest customer

---

## 🏢 Organization & Platform Roles
```
Email:    superadmin@example.com
Password: SuperAdmin123!@#
Role:     SUPER_ADMIN (Platform level)
Access:   ALL - Unrestricted platform-wide access
```

**Permissions:**
- ✅ **ALL PERMISSIONS** - Wildcard `*` permission
- ✅ Manage all organizations (view, create, update, delete any org)
- ✅ Manage all stores (access any store across all tenants)
- ✅ User management (administer all users globally)
- ✅ System configuration (platform-wide settings)
- ✅ Module management (enable/disable features globally)
- ✅ Billing oversight (view/manage all subscription plans)
- ✅ Security administration (audit logs, access controls)
- ✅ Cross-tenant support (help customers across organizations)
- ✅ Emergency access (account recovery, data restoration)

**Security Features:**
- Cannot be assigned via API or UI
- Must be set directly in database
- Bypasses all permission checks
- Platform-level administrator flag (`isSuperAdmin: true`)

---

## 🏪 Store Information

```
Store Name: Demo Store
Store ID:   clqm1j4k00000l8dw8z8r8z8r
Store Slug: demo-store
Currency:   USD
Timezone:   America/Los_Angeles
```

---

## 📊 Seeded Data

### Categories (3)
- Electronics
- Clothing
- Accessories

### Brands (3)
- Apple
- Nike
- Samsung

### Products (7)
- iPhone 15 Pro ($999.99) - IN_STOCK
- Samsung Galaxy S24 ($899.99) - IN_STOCK
- Nike Air Max 270 ($150.00) - IN_STOCK
- Nike Dri-FIT T-Shirt ($35.00) - IN_STOCK
- Wireless Earbuds Pro ($199.99) - LOW_STOCK
- Smart Watch Ultra ($449.99) - OUT_OF_STOCK
- MacBook Pro 16" ($2499.99) - DRAFT (not published)

### Customers (5)
- customer1@example.com - **Registered** (can log in)
- customer2@example.com - **Registered** (can log in)
- john.doe@example.com - Guest (no login)
- jane.smith@example.com - Guest (no login)
- bob.wilson@example.com - Guest (no login)

### Orders (7)
- ORD-00001: PENDING ($1099.98)
- ORD-00002: PAID ($945.98)
- ORD-00003: PROCESSING ($375.15)
- ORD-00004: SHIPPED ($227.98)
- ORD-00005: DELIVERED ($173.50)
- ORD-00006: CANCELED ($500.48 - refunded)
- ORD-00007: PROCESSING ($1206.62 - multi-item)

---

## 🚀 How to Login

### Method 1: Magic Link (Email)
1. Navigate to `/login`
2. Enter email address
3. Click "Email me a login link"
4. Check console logs for magic link (dev mode)
5. Click the magic link to authenticate

**Note**: In development, Resend API key is dummy, so magic links are logged to console instead of sent via email.

### Method 2: Credentials (Password) - Preferred
1. Navigate to `/login`
2. Select "Sign in with Credentials"
3. Enter email and password
4. Click "Sign in"

**Regular User:**
- Email: `test@example.com`
- Password: `Test123!@#`

**Super Admin:**
- Email: `superadmin@example.com`
- Password: `SuperAdmin123!@#`

---

## 🔐 Super Admin Verification

After logging in as Super Admin, verify platform-level access:

### 1. Check Session
```typescript
// Client component
import { useSession } from 'next-auth/react';

const { data: session } = useSession();
console.log('Is Super Admin:', session?.user?.isSuperAdmin);
// Should log: true
```

### 2. Check Permissions
```typescript
// Client component
import { usePermissions } from '@/hooks/use-permissions';

const { isSuperAdmin, can } = usePermissions();
console.log('Super Admin:', isSuperAdmin); // true
console.log('Can delete orgs:', can('organizations:delete')); // true
console.log('Can configure system:', can('system:configure')); // true
```

### 3. API Access Test
```bash
# Should return platform-wide stats
curl http://localhost:3000/api/admin/platform/stats \
  -H "Cookie: your-session-cookie"
```

---

## ⚠️ Security Notes

### Super Admin Account
- **Use responsibly** - Has unrestricted access to entire platform
- **Audit all actions** - Every Super Admin operation should be logged
- **Enforce 2FA** - Use two-factor authentication in production
- **Minimal accounts** - Create only 1-2 Super Admin accounts
- **Never share credentials** - Super Admin credentials should never be shared

### Password Requirements (Planned)
Current passwords are for development only. In production, enforce:
- Minimum 12 characters
- Uppercase and lowercase letters
- Numbers
- Special characters
- Password history (no reuse)
- Regular rotation (90 days)

---

## 📖 Related Documentation

- **Super Admin Guide**: `docs/SUPER_ADMIN_GUIDE.md`
- **Permissions System**: `docs/ROLE_BASED_PERMISSIONS_IMPLEMENTATION.md`
- **Security Audit**: `docs/SECURITY_AUDIT_REPORT.md`
- **Database Schema**: `docs/DATABASE_SCHEMA_QUICK_REFERENCE.md`

---

## 🧪 Testing Different Roles

To test different roles, you can create additional users with different role assignments:

```typescript
// Create ADMIN user
await prisma.user.create({
  data: {
    email: 'admin@example.com',
    name: 'Admin User',
    passwordHash: await bcrypt.hash('Admin123!@#', 12),
    emailVerified: new Date(),
    memberships: {
      create: {
        organizationId: 'your-org-id',
        role: 'ADMIN',
      },
    },
  },
});

// Create STORE_MANAGER user
await prisma.user.create({
  data: {
    email: 'manager@example.com',
    name: 'Store Manager',
    passwordHash: await bcrypt.hash('Manager123!@#', 12),
    emailVerified: new Date(),
  },
});

// Then create StoreStaff assignment
await prisma.storeStaff.create({
  data: {
    userId: 'manager-user-id',
    storeId: 'your-store-id',
    role: 'STORE_MANAGER',
    isActive: true,
  },
});
```

---

**Last Updated**: November 29, 2025  
**Database Seeded**: ✅ Yes  
**Super Admin Created**: ✅ Yes  
**Ready for Testing**: ✅ Yes
