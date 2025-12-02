# Complete Login Credentials - All Roles

## Last Updated: January 2025
## Environment: Development (SQLite)
## Login URL: http://localhost:3000/login

---

## Quick Reference - All Working Credentials

| Role | Email | Password | Status |
|------|-------|----------|--------|
| Super Admin | superadmin@example.com | SuperAdmin123!@# | ✅ Verified |
| Store Owner | owner@example.com | Test123!@# | ✅ Verified |
| Store Admin | admin@example.com | Test123!@# | ✅ Verified |
| Store Member | member@example.com | Test123!@# | ✅ Verified |

---

## Platform Level Roles

### 1. SUPER_ADMIN (Platform Administrator)
**Full platform access, can create stores without organization**

```
Email: superadmin@example.com
Password: SuperAdmin123!@#
```

**Permissions:**
- ✅ All permissions (`*`)
- ✅ Can create stores without organization (auto-creates org)
- ✅ Access all organizations and stores
- ✅ Manage all users and roles
- ✅ View all system analytics

**What You Can Do:**
- Create/edit/delete any store
- Manage all organizations
- Access all dashboards
- Configure system settings
- View platform-wide analytics
- Access Admin Dashboard (/admin/*)

---

## Organization Level Roles

### 2. OWNER (Store Owner)
**Full control over Demo Company organization and Demo Store**

```
Email: owner@example.com
Password: Test123!@#
```

**Organization:** Demo Company  
**Store:** Demo Store (with seeded data - 15 products, 13 orders, 15 customers)
**Permissions:**
- ✅ All organization operations (`org:*`)
- ✅ All store operations (`stores:*`)
- ✅ Manage all users in organization
- ✅ Manage billing and subscriptions
- ✅ All store-level permissions

**What You Can Do:**
- Create/edit stores in your organization
- Manage organization members
- Assign roles to users
- Configure billing and subscriptions
- Access all store features
- Full sidebar menu access

---

### 3. ADMIN (Store Administrator)
**Management access for Acme Corp and Acme Store**

```
Email: admin@example.com
Password: Test123!@#
```

**Organization:** Acme Corp  
**Store:** Acme Store (empty - no seeded data)
**Permissions:**
- ✅ Read/update organization (`org:read`, `org:update`)
- ✅ All store operations (`stores:*`)
- ✅ Invite users (`users:invite`)
- ✅ Manage settings
- ✅ All store-level permissions
- ❌ No billing access

**What You Can Do:**
- Create/edit stores in organization
- Manage store operations
- Invite new members
- Full sidebar menu access
- Cannot modify billing settings

---

### 4. MEMBER (Store Member)
**Basic read access with limited menu**

```
Email: member@example.com
Password: Test123!@#
```

**Organization:** Acme Corp  
**Store:** Acme Store  
**Permissions:**
- ✅ View organization info (`org:read`)
- ✅ View stores (`stores:read`)
- ✅ View products, categories, brands
- ✅ View orders and customers
- ✅ View reports
- ❌ Limited sidebar (no Analytics, Stores, Marketing, Team)
- ❌ Cannot create or edit

**What You Can Do:**
- Browse organization details
- View store information
- See products and inventory (read-only)
- View reports and analytics (read-only)

---

### 5. VIEWER (Organization Viewer)
**Read-only access to public information**

```
Email: viewer@example.com
Password: OrgViewer123!@#
```

**Organization:** Demo Company  
**Permissions:**
- ✅ View organization (`org:read`)
- ✅ View stores (`stores:read`)
- ✅ View products, categories, brands
- ❌ No order or customer access
- ❌ Cannot edit anything

**What You Can Do:**
- View basic organization info
- Browse store catalog
- See product listings
- Very limited access (mostly public info)

---

## Store Level Roles

### 6. STORE_ADMIN (Store Administrator)
**Full control over Demo Store**

```
Email: storeadmin@example.com
Password: StoreAdmin123!@#
```

**Store:** Demo Store  
**Permissions:**
- ✅ All store operations except deletion
- ✅ Manage products, inventory, orders
- ✅ Manage staff assignments
- ✅ Configure store settings
- ✅ View analytics and reports

**What You Can Do:**
- Manage all products and inventory
- Process and manage orders
- Assign and manage staff
- Configure store settings
- View store analytics
- Cannot create new stores (only manage existing)

---

### 7. SALES_MANAGER (Sales & Order Management)
**Manages orders, customers, and product pricing**

```
Email: sales@example.com
Password: SalesManager123!@#
```

**Store:** Demo Store  
**Permissions:**
- ✅ View/update products (including prices)
- ✅ All order operations (`orders:*`)
- ✅ Manage customers
- ✅ View reports and analytics
- ✅ Handle customer support
- ❌ Cannot manage inventory levels

**What You Can Do:**
- Process orders and refunds
- Update product prices
- Manage customer accounts
- Create and update support tickets
- View sales reports

---

### 8. INVENTORY_MANAGER (Inventory & Product Management)
**Full control over products and stock**

```
Email: inventory@example.com
Password: InventoryManager123!@#
```

**Store:** Demo Store  
**Permissions:**
- ✅ All product operations (`products:*`)
- ✅ All inventory operations (`inventory:*`)
- ✅ Manage categories and brands
- ✅ View orders (for planning)
- ✅ View reports
- ❌ Cannot process orders

**What You Can Do:**
- Add/edit/delete products
- Manage stock levels
- Create categories and brands
- Track inventory movements
- Generate inventory reports
- Cannot handle customer orders

---

### 9. CUSTOMER_SERVICE (Customer Support)
**Handles customer interactions and support**

```
Email: support@example.com
Password: CustomerService123!@#
```

**Store:** Demo Store  
**Permissions:**
- ✅ View/update orders
- ✅ All customer operations (`customers:*`)
- ✅ View products
- ✅ All support operations (`support:*`)
- ✅ View reports
- ❌ Cannot modify products or inventory

**What You Can Do:**
- View and update order status
- Manage customer accounts
- Handle support tickets
- Process returns/exchanges
- View customer reports
- Cannot change product prices

---

### 10. CONTENT_MANAGER (Content & Product Information)
**Manages product content and marketing materials**

```
Email: content@example.com
Password: ContentManager123!@#
```

**Store:** Demo Store  
**Permissions:**
- ✅ Create/edit product listings
- ✅ All category operations (`categories:*`)
- ✅ All brand operations (`brands:*`)
- ✅ All content operations (`content:*`)
- ✅ Create/edit marketing content
- ❌ Cannot manage inventory or orders

**What You Can Do:**
- Create product descriptions
- Manage categories and brands
- Update product images and content
- Create marketing materials
- Cannot change stock levels or prices

---

### 11. MARKETING_MANAGER (Marketing & Analytics)
**Manages marketing campaigns and customer insights**

```
Email: marketing@example.com
Password: MarketingManager123!@#
```

**Store:** Demo Store  
**Permissions:**
- ✅ View products and customers
- ✅ All marketing operations (`marketing:*`)
- ✅ All campaign operations (`campaigns:*`)
- ✅ All analytics (`analytics:*`)
- ✅ Create/edit content
- ❌ Cannot modify products or orders

**What You Can Do:**
- Create marketing campaigns
- View customer analytics
- Generate marketing reports
- Manage promotional content
- Track campaign performance
- Cannot process orders or manage inventory

---

### 12. DELIVERY_BOY (Delivery Personnel)
**Manages deliveries and logistics**

```
Email: delivery@example.com
Password: Delivery123!@#
```

**Store:** Demo Store  
**Permissions:**
- ✅ View/update deliveries
- ✅ View orders (for delivery)
- ✅ View customer contact info
- ❌ Cannot modify orders or products

**What You Can Do:**
- View assigned deliveries
- Update delivery status
- See customer delivery addresses
- Mark orders as delivered
- Very limited access (delivery-focused only)

---

## Customer Level Roles

### 13. CUSTOMER (End Customer) - User 1
**Shopping and personal account management**

```
Email: customer1@example.com
Password: Customer123!@#
```

**Permissions:**
- ✅ Browse products and categories
- ✅ Create orders
- ✅ View own orders (`orders:read:own`)
- ✅ Cancel own orders (`orders:update:own`)
- ✅ Manage own profile
- ✅ Create reviews
- ❌ No admin access

**What You Can Do:**
- Shop and browse products
- Place orders
- View order history
- Cancel own orders
- Write product reviews
- Manage profile and wishlist

---

### 14. CUSTOMER (End Customer) - User 2
**Shopping and personal account management**

```
Email: customer2@example.com
Password: Customer123!@#
```

**Permissions:** Same as Customer 1  
**Note:** Separate account for testing multi-customer scenarios

---

## Quick Reference Table

| Role | Email | Password | Access Level | Can Create Stores? |
|------|-------|----------|--------------|-------------------|
| **SUPER_ADMIN** | superadmin@example.com | SuperAdmin123!@# | Platform | ✅ Yes |
| **OWNER** | test@example.com | Test123!@# | Organization | ✅ Yes |
| **ADMIN** | admin@example.com | OrgAdmin123!@# | Organization | ✅ Yes |
| **MEMBER** | member@example.com | OrgMember123!@# | Organization | ❌ No |
| **VIEWER** | viewer@example.com | OrgViewer123!@# | Organization | ❌ No |
| **STORE_ADMIN** | storeadmin@example.com | StoreAdmin123!@# | Store | ❌ No |
| **SALES_MANAGER** | sales@example.com | SalesManager123!@# | Store | ❌ No |
| **INVENTORY_MANAGER** | inventory@example.com | InventoryManager123!@# | Store | ❌ No |
| **CUSTOMER_SERVICE** | support@example.com | CustomerService123!@# | Store | ❌ No |
| **CONTENT_MANAGER** | content@example.com | ContentManager123!@# | Store | ❌ No |
| **MARKETING_MANAGER** | marketing@example.com | MarketingManager123!@# | Store | ❌ No |
| **DELIVERY_BOY** | delivery@example.com | Delivery123!@# | Store | ❌ No |
| **CUSTOMER** | customer1@example.com | Customer123!@# | Customer | ❌ No |
| **CUSTOMER** | customer2@example.com | Customer123!@# | Customer | ❌ No |

---

## Password Pattern
All passwords follow the pattern: `{Role}123!@#`

Examples:
- Super Admin → `SuperAdmin123!@#`
- Sales Manager → `SalesManager123!@#`
- Organization Admin → `OrgAdmin123!@#`
- Customer → `Customer123!@#`

---

## Testing Instructions

### 1. Start Development Server
```bash
npm run dev
```

### 2. Open Login Page
Navigate to: http://localhost:3000/login

### 3. Test Each Role
1. Select "Password" tab
2. Enter email and password from above
3. Click "Sign In"
4. Verify you're redirected to appropriate dashboard
5. Test permissions based on role
6. Logout and test next role

### 4. Verify Permissions

**For Store Creation Test:**
- ✅ Super Admin, Owner, Admin should see "Create Store" button
- ❌ All other roles should NOT see "Create Store" button

**For Dashboard Access:**
- All roles should access `/dashboard` after login
- Super Admin sees platform-wide data
- Organization roles see org-level data
- Store roles see store-specific data
- Customers see personal account dashboard

---

## Common Issues & Solutions

### Issue: "Invalid email or password"
**Solution:** 
- Verify you're using exact email from table
- Check password includes `123!@#` suffix
- Ensure database is seeded: `npm run seed`

### Issue: "Organization required"
**Solution:**
- This is correct for MEMBER/VIEWER when creating stores
- They need existing organization (they have Demo Company)
- Only affects store creation, not login

### Issue: No permissions showing
**Solution:**
- Check session includes role data
- Verify middleware allows route access
- Check browser console for errors

### Issue: Can't access certain pages
**Solution:**
- This is by design based on permissions
- Check role permissions in table above
- Some roles have limited access

---

## Database Verification

### Check User Roles in Database
```bash
npx prisma studio
```

1. Open User table
2. Find user by email
3. Check `isSuperAdmin` field
4. Check Membership table for organization roles
5. Check StoreStaff table for store roles

### Re-seed Database
```bash
npm run seed
node scripts/add-missing-roles.js
```

---

## Security Notes

1. **Password Storage:** All passwords are bcrypt hashed (12 rounds)
2. **Session:** JWT-based session strategy
3. **Super Admin:** Flag set at user level (`isSuperAdmin: true`)
4. **Organization Roles:** Via Membership table
5. **Store Roles:** Via StoreStaff table
6. **Multi-tenancy:** All queries filtered by organizationId/storeId

---

## Production Deployment

⚠️ **IMPORTANT:** Change all passwords before production!

1. Update all password hashes
2. Remove test accounts
3. Create real admin accounts
4. Enable email verification
5. Add 2FA for admin roles
6. Review permission assignments

---

## Support

For issues or questions:
1. Check browser console for errors
2. Review server logs: `npm run dev`
3. Verify database state: `npx prisma studio`
4. Run user check: `node scripts/check-all-users.js`
5. Re-add missing roles: `node scripts/add-missing-roles.js`
