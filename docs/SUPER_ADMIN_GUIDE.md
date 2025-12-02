# Super Admin Role - Complete Guide

## Overview

**SUPER_ADMIN** is the highest-level role in StormCom, providing **platform-level administration** with unrestricted access to all features, organizations, stores, and system configurations.

---

## 🔑 Key Capabilities

### Platform-Level Administration
- ✅ **Manage All Organizations** - View, create, update, delete any organization
- ✅ **Manage All Stores** - Access and control every store across all tenants
- ✅ **User Management** - Administer all users regardless of organization
- ✅ **System Configuration** - Modify platform-wide settings
- ✅ **Module Management** - Enable/disable features globally
- ✅ **Billing Oversight** - View and manage all subscription plans
- ✅ **Security Administration** - Audit logs, access controls, security settings

### Permission Model

```typescript
// Super Admin has wildcard permission
SUPER_ADMIN: ['*']  // ALL permissions across ALL resources
```

**This means Super Admin can:**
- Bypass all permission checks
- Access any API endpoint
- View/modify any data in any organization or store
- Perform any action without restrictions

---

## 📊 Permission Hierarchy

```
Platform Level (Highest)
└── SUPER_ADMIN ← You are here
    └── Organization Level
        ├── OWNER
        ├── ADMIN
        └── MEMBER
            └── Store Level
                ├── STORE_ADMIN
                ├── STORE_MANAGER
                ├── STORE_STAFF
                ├── CASHIER
                ├── INVENTORY_MANAGER
                ├── SALES_REP
                ├── MARKETING_MANAGER
                └── VIEWER
```

**Role Priority**: `isSuperAdmin` > `storeRole` > `organizationRole`

---

## 🗄️ Database Schema

### User Model Extension

```prisma
model User {
  id            String   @id @default(cuid())
  email         String?  @unique
  name          String?
  passwordHash  String?
  
  // Super Admin flag
  isSuperAdmin  Boolean  @default(false)  // ← Platform administrator
  
  // Standard relations
  memberships   Membership[]
  storeStaff    StoreStaff[]
  // ...
}
```

**Key Points:**
- `isSuperAdmin` is a **direct User field** (not a role assignment)
- Defaults to `false` for all new users
- Must be manually set to `true` (typically via direct database update)
- Cannot be assigned through invite/signup flows (security measure)

---

## 🛡️ How Super Admin Permissions Work

### 1. Permission Checking (Server)

```typescript
// src/lib/auth-helpers.ts
export async function checkPermission(permission: Permission): Promise<boolean> {
  const context = await getUserContext();
  
  if (!context) return false;

  // Super admin bypass - ALWAYS returns true
  if (context.isSuperAdmin) {
    return true;  // ← Unlimited access
  }

  // Regular permission checks for other roles
  if (context.storeRole && hasPermission(context.storeRole, permission)) {
    return true;
  }
  // ...
}
```

### 2. Permission Checking (Client)

```typescript
// src/hooks/use-permissions.ts
const can = useCallback((permission: Permission): boolean => {
  if (isSuperAdmin) return true;  // ← Bypass all checks
  
  if (storeRole && hasPermission(storeRole, permission)) return true;
  if (organizationRole && hasPermission(organizationRole, permission)) return true;
  
  return false;
}, [isSuperAdmin, storeRole, organizationRole]);
```

### 3. Component-Level Access Control

```tsx
// Using CanAccess component
<CanAccess permission="system:configure">
  <SuperAdminPanel />  {/* Only visible to Super Admin */}
</CanAccess>

// Using usePermissions hook
const { isSuperAdmin, can } = usePermissions();

if (isSuperAdmin) {
  // Show platform admin features
  return <PlatformAdminDashboard />;
}
```

---

## 🔐 Security Safeguards

### 1. **Cannot Be Assigned via API**

```typescript
// src/app/api/store-staff/route.ts
const roleValidation = z.object({
  role: z.enum([
    "STORE_ADMIN",
    "STORE_MANAGER",
    // ... other roles
  ]).refine(
    (role) => role !== 'SUPER_ADMIN' && role !== 'OWNER',
    { message: 'Cannot assign SUPER_ADMIN or OWNER role via staff API' }
  ),
});
```

**Prevention Measures:**
- ❌ Cannot invite users as Super Admin
- ❌ Cannot assign Super Admin via store staff API
- ❌ Cannot upgrade to Super Admin through UI
- ✅ Must be set directly in database (intentional friction)

### 2. **Authentication Integration**

```typescript
// src/lib/auth.ts - NextAuth callback
callbacks: {
  async jwt({ token, user, trigger }) {
    if (user) {
      token.id = user.id;
      token.isSuperAdmin = user.isSuperAdmin;  // ← Added to JWT
    }
    return token;
  },
  
  async session({ session, token }) {
    if (session.user) {
      session.user.id = token.id as string;
      session.user.isSuperAdmin = token.isSuperAdmin as boolean;  // ← Available in session
    }
    return session;
  },
}
```

---

## 🧪 How to Create a Super Admin User

### Method 1: Direct Database Update (Recommended)

```sql
-- SQLite
UPDATE User 
SET isSuperAdmin = 1 
WHERE email = 'admin@example.com';

-- PostgreSQL
UPDATE "User" 
SET "isSuperAdmin" = true 
WHERE email = 'admin@example.com';
```

### Method 2: Prisma Studio

```bash
npx prisma studio
```
1. Open User model
2. Find target user
3. Set `isSuperAdmin` to `true`
4. Save changes

### Method 3: Seed Script (Development)

```typescript
// prisma/seed.ts
const superAdmin = await prisma.user.create({
  data: {
    email: 'superadmin@example.com',
    name: 'Super Administrator',
    passwordHash: await bcrypt.hash('SecurePassword123!', 12),
    emailVerified: new Date(),
    isSuperAdmin: true,  // ← Set during creation
  },
});
```

### Method 4: Prisma Client (One-time script)

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function createSuperAdmin() {
  await prisma.user.update({
    where: { email: 'admin@example.com' },
    data: { isSuperAdmin: true },
  });
  console.log('✅ Super Admin created');
}

createSuperAdmin();
```

---

## 📋 Super Admin Use Cases

### 1. **Multi-Tenant Management**
```typescript
// Access any organization's data
const allOrgs = await prisma.organization.findMany();
const allStores = await prisma.store.findMany();

// Super Admin bypasses organizationId filters
```

### 2. **Cross-Tenant Support**
```typescript
// Help customer in Organization A with issue in Store B
const context = await getUserContext();

if (context.isSuperAdmin) {
  // Can access any store without membership
  const store = await prisma.store.findUnique({
    where: { id: customerStoreId },
  });
}
```

### 3. **System Auditing**
```typescript
// View all audit logs across platform
const auditLogs = await prisma.auditLog.findMany({
  include: { user: true, organization: true },
  orderBy: { createdAt: 'desc' },
});
```

### 4. **Emergency Access**
```typescript
// Recover locked accounts, reset passwords, restore deleted data
const context = await requireSuperAdmin();

await prisma.user.update({
  where: { id: lockedUserId },
  data: { 
    emailVerified: new Date(),
    failedLoginAttempts: 0,
  },
});
```

---

## 🚀 API Usage Examples

### Server Component

```typescript
import { requireSuperAdmin, isSuperAdmin } from '@/lib/auth-helpers';

export default async function PlatformAdminPage() {
  // Method 1: Require Super Admin (throws if not)
  const context = await requireSuperAdmin();
  
  // Method 2: Check and conditionally render
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return <div>Access Denied</div>;
  }
  
  return <PlatformDashboard />;
}
```

### API Route

```typescript
import { requireSuperAdmin, getUserContext } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  // Require Super Admin access
  await requireSuperAdmin();
  
  // Fetch platform-wide data
  const stats = await prisma.organization.groupBy({
    by: ['subscriptionPlan'],
    _count: true,
  });
  
  return NextResponse.json({ stats });
}
```

### Client Component

```typescript
'use client';
import { usePermissions } from '@/hooks/use-permissions';

export function PlatformSettings() {
  const { isSuperAdmin, isLoading } = usePermissions();
  
  if (isLoading) return <Loading />;
  if (!isSuperAdmin) return <AccessDenied />;
  
  return (
    <div>
      <h1>Platform Configuration</h1>
      {/* Super Admin only features */}
    </div>
  );
}
```

---

## ⚠️ Best Practices

### 1. **Minimal Super Admin Accounts**
- Create only 1-2 Super Admin accounts
- Use for emergency access and platform maintenance only
- Regular admins should use OWNER role instead

### 2. **Audit Logging**
```typescript
// Log all Super Admin actions
if (context.isSuperAdmin) {
  await prisma.auditLog.create({
    data: {
      userId: context.userId,
      action: 'SUPER_ADMIN_ACTION',
      resource: 'Organization',
      resourceId: orgId,
      metadata: { reason: 'Platform maintenance' },
    },
  });
}
```

### 3. **Two-Factor Authentication**
- Enforce 2FA for all Super Admin accounts
- Use hardware security keys for production Super Admins
- Implement IP whitelisting for Super Admin access

### 4. **Separate Super Admin Interface**
```typescript
// Don't mix Super Admin UI with regular admin UI
if (isSuperAdmin) {
  return <PlatformAdminLayout />;  // Separate navigation/features
}
return <OrganizationLayout />;
```

### 5. **Activity Monitoring**
- Monitor all Super Admin logins
- Alert on suspicious Super Admin activity
- Regular security reviews of Super Admin accounts

---

## 🧪 Testing Super Admin

### Unit Test Example

```typescript
import { checkPermission } from '@/lib/auth-helpers';
import { prismaMock } from '@/tests/mocks/prisma';

describe('Super Admin Permissions', () => {
  it('should grant all permissions to Super Admin', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@example.com',
      isSuperAdmin: true,
      memberships: [],
      storeStaff: [],
    });
    
    const canDelete = await checkPermission('organizations:delete');
    const canManage = await checkPermission('system:configure');
    const canAny = await checkPermission('any:permission');
    
    expect(canDelete).toBe(true);
    expect(canManage).toBe(true);
    expect(canAny).toBe(true);  // Wildcard '*' grants everything
  });
});
```

### Integration Test

```typescript
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/admin/platform/stats/route';

describe('Platform Admin API', () => {
  it('should allow Super Admin access', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        cookie: 'super-admin-session-token',
      },
    });
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toHaveProperty('platformStats');
  });
  
  it('should deny non-Super Admin access', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        cookie: 'regular-user-session-token',
      },
    });
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(403);
  });
});
```

---

## 📊 Permission Comparison

| Feature | SUPER_ADMIN | OWNER | ADMIN | MEMBER |
|---------|-------------|-------|-------|--------|
| **Platform Configuration** | ✅ | ❌ | ❌ | ❌ |
| **All Organizations** | ✅ | Own only | Own only | Own only |
| **All Stores** | ✅ | Org stores | Org stores | View only |
| **User Management (Global)** | ✅ | ❌ | ❌ | ❌ |
| **System Settings** | ✅ | ❌ | ❌ | ❌ |
| **Billing (Global)** | ✅ | Own org | ❌ | ❌ |
| **Audit Logs (Global)** | ✅ | Own org | Own org | ❌ |
| **Module Management** | ✅ | ❌ | ❌ | ❌ |
| **Emergency Access** | ✅ | ❌ | ❌ | ❌ |
| **Cross-Tenant Support** | ✅ | ❌ | ❌ | ❌ |

---

## 🔧 Current Implementation Status

### ✅ Implemented
- [x] `User.isSuperAdmin` database field
- [x] NextAuth session integration
- [x] Server-side permission checks (`auth-helpers.ts`)
- [x] Client-side hooks (`use-permissions.ts`)
- [x] Component access control (`CanAccess`)
- [x] API route protection
- [x] Wildcard permission (`*`)
- [x] Role priority system
- [x] Security safeguards (cannot assign via API)

### 🚧 Recommended Additions
- [ ] Super Admin UI/dashboard
- [ ] Platform-wide analytics
- [ ] Global audit log viewer
- [ ] Organization switcher for Super Admin
- [ ] Store impersonation feature
- [ ] Two-factor authentication enforcement
- [ ] Activity monitoring dashboard
- [ ] Super Admin action logging
- [ ] IP whitelist management
- [ ] Emergency access workflow

---

## 📞 Support

For Super Admin assistance:
- **Documentation**: See `ROLE_BASED_PERMISSIONS_IMPLEMENTATION.md`
- **Security**: See `SECURITY_AUDIT_REPORT.md`
- **Database**: See `DATABASE_SCHEMA_QUICK_REFERENCE.md`

---

**⚠️ SECURITY WARNING**

Super Admin accounts have **UNRESTRICTED ACCESS** to the entire platform. 

- Use responsibly
- Audit regularly
- Minimize account count
- Enforce strong authentication
- Log all actions
- Never share credentials

