# 🏗️ StormCom SaaS Implementation Plan V2

## Complete Multi-Level Approval System

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Complete Approval Flow](#complete-approval-flow)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [UI Components](#ui-components)
6. [Implementation Phases](#implementation-phases)
7. [Security Considerations](#security-considerations)

---

## Overview

### The Complete Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    PHASE 1: USER SIGNUP                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User fills signup form:                                    │
│  • Name, Email, Password                                    │
│  • Business Name & Description                              │
│  • Business Category                                        │
│                                                             │
│  Result: Account created with status = PENDING              │
│  Super Admin notified of new registration                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               PHASE 2: ACCOUNT APPROVAL                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Super Admin reviews user application:                      │
│  ├── APPROVE → User becomes potential STORE_OWNER           │
│  │             Can login and request store creation         │
│  ├── REJECT  → User notified with reason                    │
│  └── REQUEST INFO → User updates application                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              PHASE 3: STORE REQUEST                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Approved user submits store request:                       │
│  • Store Name, Slug, Description                            │
│  • Contact Email & Phone                                    │
│  • Business Category                                        │
│  • Address Information                                      │
│                                                             │
│  Result: StoreRequest created with status = PENDING         │
│  Super Admin notified of new store request                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              PHASE 4: STORE APPROVAL                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Super Admin reviews store request:                         │
│  ├── APPROVE → Store created automatically                  │
│  │             • Organization created                       │
│  │             • User assigned as OWNER + STORE_ADMIN       │
│  │             • Default subscription plan assigned         │
│  │             • Welcome email sent                         │
│  ├── REJECT  → User notified with reason                    │
│  └── REQUEST INFO → User updates request                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│            PHASE 5: STORE MANAGEMENT                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Store Owner can now:                                       │
│  • Manage products, orders, customers                       │
│  • Invite staff members (with PREDEFINED roles)             │
│  • Create CUSTOM roles (requires approval)                  │
│  • View reports and analytics                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│          PHASE 6: CUSTOM ROLE REQUEST                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Store Owner requests custom role:                          │
│  • Role Name & Description                                  │
│  • Selected Permissions (from available list)               │
│  • Justification for role                                   │
│                                                             │
│  Result: CustomRoleRequest created with status = PENDING    │
│  Super Admin notified of new role request                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│          PHASE 7: CUSTOM ROLE APPROVAL                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Super Admin reviews custom role request:                   │
│  ├── APPROVE → Custom role created and available            │
│  │             Store Owner can assign to staff              │
│  ├── REJECT  → Store Owner notified with reason             │
│  └── MODIFY  → Admin adjusts permissions then approves      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│          PHASE 8: STAFF ASSIGNMENT                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Store Owner assigns staff:                                 │
│  • Invite by email (new user) or assign existing            │
│  • Select predefined OR approved custom role                │
│  • Staff gets notified and can access store                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### New/Updated Models

```prisma
// ============================================
// USER MODEL (Updated)
// ============================================
model User {
  id                  String    @id @default(cuid())
  name                String?
  email               String?   @unique
  emailVerified       DateTime?
  passwordHash        String?
  image               String?
  
  // Account Status
  accountStatus       AccountStatus @default(PENDING)
  statusChangedAt     DateTime?
  statusChangedBy     String?
  rejectionReason     String?
  
  // Business Information (for signup)
  businessName        String?
  businessDescription String?
  businessCategory    String?
  phoneNumber         String?
  
  // Approval Tracking
  approvedAt          DateTime?
  approvedBy          String?
  
  // Flags
  isSuperAdmin        Boolean   @default(false)
  
  // Timestamps
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  deletedAt           DateTime?
  
  // Relations
  accounts            Account[]
  sessions            Session[]
  memberships         Membership[]
  storeStaff          StoreStaff[]
  storeRequests       StoreRequest[]
  customRoleRequests  CustomRoleRequest[]
  notifications       Notification[]
  
  @@map("users")
}

enum AccountStatus {
  PENDING
  APPROVED
  REJECTED
  SUSPENDED
  DELETED
}

// ============================================
// STORE REQUEST MODEL (Updated)
// ============================================
model StoreRequest {
  id                String    @id @default(cuid())
  
  // Requester
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Store Details
  name              String
  slug              String
  description       String?
  email             String
  phone             String?
  
  // Business Info
  category          String?
  website           String?
  
  // Address
  address           String?
  city              String?
  state             String?
  country           String?
  postalCode        String?
  
  // Request Status
  status            RequestStatus @default(PENDING)
  
  // Admin Response
  reviewedBy        String?
  reviewedAt        DateTime?
  rejectionReason   String?
  adminNotes        String?
  
  // Subscription (set by admin on approval)
  approvedPlan      SubscriptionPlan?
  trialDays         Int?
  
  // Created Store (after approval)
  storeId           String?   @unique
  store             Store?    @relation(fields: [storeId], references: [id])
  
  // Timestamps
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([userId])
  @@index([status])
  @@map("store_requests")
}

enum RequestStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
  INFO_REQUESTED
}

// ============================================
// CUSTOM ROLE REQUEST MODEL (New)
// ============================================
model CustomRoleRequest {
  id                String    @id @default(cuid())
  
  // Requester
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Store this role is for
  storeId           String
  store             Store     @relation(fields: [storeId], references: [id], onDelete: Cascade)
  
  // Role Details
  roleName          String
  roleDescription   String?
  permissions       String[]  // Array of permission strings
  justification     String?   // Why this role is needed
  
  // Request Status
  status            RequestStatus @default(PENDING)
  
  // Admin Response
  reviewedBy        String?
  reviewedAt        DateTime?
  rejectionReason   String?
  adminNotes        String?
  modifiedPermissions String[]? // If admin modified the permissions
  
  // Created Role (after approval)
  customRoleId      String?   @unique
  customRole        CustomRole? @relation(fields: [customRoleId], references: [id])
  
  // Timestamps
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([userId])
  @@index([storeId])
  @@index([status])
  @@map("custom_role_requests")
}

// ============================================
// CUSTOM ROLE MODEL (New)
// ============================================
model CustomRole {
  id                String    @id @default(cuid())
  
  // Store this role belongs to
  storeId           String
  store             Store     @relation(fields: [storeId], references: [id], onDelete: Cascade)
  
  // Role Details
  name              String
  description       String?
  permissions       String[]  // Array of permission strings
  
  // Status
  isActive          Boolean   @default(true)
  
  // Approval Info
  approvedBy        String?
  approvedAt        DateTime?
  
  // Source Request
  request           CustomRoleRequest?
  
  // Staff assigned to this role
  staffAssignments  StoreStaff[]
  
  // Timestamps
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@unique([storeId, name])
  @@index([storeId])
  @@map("custom_roles")
}

// ============================================
// STORE STAFF MODEL (Updated)
// ============================================
model StoreStaff {
  id                String    @id @default(cuid())
  
  // User and Store
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  storeId           String
  store             Store     @relation(fields: [storeId], references: [id], onDelete: Cascade)
  
  // Role Assignment
  role              Role?     // Predefined role (null if custom)
  customRoleId      String?   // Custom role (null if predefined)
  customRole        CustomRole? @relation(fields: [customRoleId], references: [id])
  
  // Status
  isActive          Boolean   @default(true)
  
  // Invitation
  invitedBy         String?
  invitedAt         DateTime  @default(now())
  acceptedAt        DateTime?
  
  // Timestamps
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@unique([userId, storeId])
  @@index([storeId])
  @@map("store_staff")
}

// ============================================
// NOTIFICATION MODEL (Updated)
// ============================================
model Notification {
  id                String    @id @default(cuid())
  
  // Recipient
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Content
  type              NotificationType
  title             String
  message           String
  data              Json?     // Additional context
  
  // Action
  actionUrl         String?
  actionLabel       String?
  
  // Status
  read              Boolean   @default(false)
  readAt            DateTime?
  
  // Timestamps
  createdAt         DateTime  @default(now())
  
  @@index([userId, read])
  @@map("notifications")
}

enum NotificationType {
  // User Account
  USER_REGISTERED
  USER_APPROVED
  USER_REJECTED
  USER_SUSPENDED
  
  // Store Requests
  STORE_REQUEST_PENDING
  STORE_REQUEST_APPROVED
  STORE_REQUEST_REJECTED
  STORE_REQUEST_INFO_NEEDED
  
  // Store Events
  STORE_CREATED
  STORE_SUSPENDED
  
  // Custom Role Requests
  ROLE_REQUEST_PENDING
  ROLE_REQUEST_APPROVED
  ROLE_REQUEST_REJECTED
  ROLE_REQUEST_MODIFIED
  
  // Staff
  STAFF_INVITED
  STAFF_JOINED
  STAFF_REMOVED
  
  // System
  SECURITY_ALERT
  SYSTEM_UPDATE
}

// ============================================
// STORE MODEL (Updated relations)
// ============================================
model Store {
  id                String    @id @default(cuid())
  
  // ... existing fields ...
  
  // Relations (add these)
  customRoles       CustomRole[]
  customRoleRequests CustomRoleRequest[]
  storeRequest      StoreRequest?
  
  // ... rest of model ...
}
```

---

## API Endpoints

### 1. User Management (Super Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/users/pending` | List pending user registrations |
| `GET` | `/api/admin/users/[id]` | Get user details |
| `POST` | `/api/admin/users/[id]/approve` | Approve user account |
| `POST` | `/api/admin/users/[id]/reject` | Reject user account |
| `POST` | `/api/admin/users/[id]/request-info` | Request more info from user |

### 2. Store Request Endpoints (User)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/store-requests` | Get user's store requests |
| `POST` | `/api/store-requests` | Submit new store request |
| `PATCH` | `/api/store-requests/[id]` | Update store request |
| `DELETE` | `/api/store-requests/[id]` | Cancel store request |

### 3. Store Request Endpoints (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/store-requests` | List all store requests |
| `GET` | `/api/admin/store-requests/[id]` | Get request details |
| `POST` | `/api/admin/store-requests/[id]/approve` | Approve & create store |
| `POST` | `/api/admin/store-requests/[id]/reject` | Reject store request |
| `POST` | `/api/admin/store-requests/[id]/request-info` | Request more info |

### 4. Custom Role Request Endpoints (Store Owner)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/stores/[storeId]/role-requests` | Get store's role requests |
| `POST` | `/api/stores/[storeId]/role-requests` | Submit new role request |
| `PATCH` | `/api/stores/[storeId]/role-requests/[id]` | Update role request |
| `DELETE` | `/api/stores/[storeId]/role-requests/[id]` | Cancel role request |

### 5. Custom Role Request Endpoints (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/role-requests` | List all role requests |
| `GET` | `/api/admin/role-requests/[id]` | Get request details |
| `POST` | `/api/admin/role-requests/[id]/approve` | Approve role request |
| `POST` | `/api/admin/role-requests/[id]/reject` | Reject role request |
| `POST` | `/api/admin/role-requests/[id]/modify` | Modify & approve |

### 6. Staff Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/stores/[storeId]/staff` | List store staff |
| `POST` | `/api/stores/[storeId]/staff/invite` | Invite new staff |
| `PATCH` | `/api/stores/[storeId]/staff/[id]` | Update staff role |
| `DELETE` | `/api/stores/[storeId]/staff/[id]` | Remove staff |

### 7. Permissions Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/permissions` | Get all available permissions |

---

## API Request/Response Examples

### Submit Store Request

```typescript
// POST /api/store-requests
// Request
{
  "name": "My Awesome Store",
  "slug": "my-awesome-store",
  "description": "A store selling awesome products",
  "email": "store@example.com",
  "phone": "+1234567890",
  "category": "Electronics",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "country": "US",
  "postalCode": "10001"
}

// Response (201 Created)
{
  "success": true,
  "request": {
    "id": "clxxx...",
    "name": "My Awesome Store",
    "slug": "my-awesome-store",
    "status": "PENDING",
    "createdAt": "2025-12-01T10:00:00Z"
  },
  "message": "Store request submitted successfully. You will be notified once reviewed."
}
```

### Submit Custom Role Request

```typescript
// POST /api/stores/[storeId]/role-requests
// Request
{
  "roleName": "Senior Manager",
  "roleDescription": "Manages day-to-day operations with limited admin access",
  "permissions": [
    "products:read",
    "products:create",
    "products:update",
    "orders:read",
    "orders:update",
    "customers:read",
    "reports:read",
    "analytics:read"
  ],
  "justification": "Need a role for team leads who manage products and orders but don't need full admin access"
}

// Response (201 Created)
{
  "success": true,
  "request": {
    "id": "clyyy...",
    "roleName": "Senior Manager",
    "status": "PENDING",
    "createdAt": "2025-12-01T10:00:00Z"
  },
  "message": "Custom role request submitted. Awaiting Super Admin approval."
}
```

### Approve Role Request (Admin)

```typescript
// POST /api/admin/role-requests/[id]/approve
// Request
{
  "modifiedPermissions": [  // Optional - if admin wants to modify
    "products:read",
    "products:create",
    "products:update",
    "orders:read",
    "orders:update",
    "customers:read",
    "reports:read"
    // Removed "analytics:read" as per admin decision
  ],
  "notes": "Approved with modified permissions - analytics access not included"
}

// Response (200 OK)
{
  "success": true,
  "request": {
    "id": "clyyy...",
    "status": "APPROVED",
    "reviewedAt": "2025-12-01T12:00:00Z"
  },
  "customRole": {
    "id": "clzzz...",
    "name": "Senior Manager",
    "permissions": ["products:read", "products:create", "..."],
    "storeId": "store123"
  },
  "message": "Custom role approved and created"
}
```

### Get Available Permissions

```typescript
// GET /api/permissions
// Response
{
  "permissions": [
    {
      "category": "Products",
      "permissions": [
        { "key": "products:read", "name": "View Products", "description": "View all products in the store" },
        { "key": "products:create", "name": "Create Products", "description": "Add new products" },
        { "key": "products:update", "name": "Edit Products", "description": "Modify existing products" },
        { "key": "products:delete", "name": "Delete Products", "description": "Remove products" }
      ]
    },
    {
      "category": "Orders",
      "permissions": [
        { "key": "orders:read", "name": "View Orders", "description": "View all orders" },
        { "key": "orders:update", "name": "Process Orders", "description": "Update order status" },
        { "key": "orders:cancel", "name": "Cancel Orders", "description": "Cancel orders" },
        { "key": "orders:refund", "name": "Process Refunds", "description": "Issue refunds" }
      ]
    },
    {
      "category": "Customers",
      "permissions": [
        { "key": "customers:read", "name": "View Customers", "description": "View customer list" },
        { "key": "customers:update", "name": "Edit Customers", "description": "Update customer info" },
        { "key": "customers:delete", "name": "Delete Customers", "description": "Remove customers" }
      ]
    },
    {
      "category": "Inventory",
      "permissions": [
        { "key": "inventory:read", "name": "View Inventory", "description": "View stock levels" },
        { "key": "inventory:update", "name": "Update Stock", "description": "Adjust stock levels" }
      ]
    },
    {
      "category": "Reports",
      "permissions": [
        { "key": "reports:read", "name": "View Reports", "description": "Access sales reports" },
        { "key": "reports:export", "name": "Export Reports", "description": "Download reports" }
      ]
    },
    {
      "category": "Analytics",
      "permissions": [
        { "key": "analytics:read", "name": "View Analytics", "description": "Access analytics dashboard" }
      ]
    },
    {
      "category": "Settings",
      "permissions": [
        { "key": "settings:read", "name": "View Settings", "description": "View store settings" },
        { "key": "settings:update", "name": "Edit Settings", "description": "Modify store settings" }
      ]
    }
  ]
}
```

---

## UI Components

### Page Structure

```
src/app/
├── (auth)/
│   ├── signup/
│   │   └── page.tsx           # Multi-step signup form
│   ├── pending-approval/
│   │   └── page.tsx           # "Your account is pending" page
│   └── login/
│       └── page.tsx           # Login (blocks non-approved)
│
├── dashboard/
│   ├── store-request/
│   │   └── page.tsx           # Request new store form
│   ├── stores/
│   │   └── [storeId]/
│   │       ├── page.tsx       # Store dashboard
│   │       ├── staff/
│   │       │   └── page.tsx   # Staff management
│   │       └── roles/
│   │           └── page.tsx   # Custom roles management
│   └── ...
│
├── admin/
│   ├── page.tsx               # Admin dashboard
│   ├── users/
│   │   ├── page.tsx           # All users
│   │   ├── pending/
│   │   │   └── page.tsx       # Pending user approvals
│   │   └── [id]/
│   │       └── page.tsx       # User detail
│   ├── stores/
│   │   ├── page.tsx           # All stores
│   │   ├── requests/
│   │   │   └── page.tsx       # Store requests
│   │   └── [id]/
│   │       └── page.tsx       # Store detail
│   ├── roles/
│   │   ├── page.tsx           # All custom roles
│   │   └── requests/
│   │       └── page.tsx       # Custom role requests
│   ├── activity/
│   │   └── page.tsx           # Platform activity
│   └── analytics/
│       └── page.tsx           # Platform analytics
│
└── ...
```

### Component Structure

```
src/components/
├── admin/
│   ├── dashboard/
│   │   ├── admin-dashboard.tsx
│   │   ├── pending-approvals-widget.tsx
│   │   ├── store-requests-widget.tsx
│   │   └── role-requests-widget.tsx
│   │
│   ├── users/
│   │   ├── pending-users-list.tsx
│   │   ├── user-detail-card.tsx
│   │   └── user-actions.tsx
│   │
│   ├── store-requests/
│   │   ├── store-requests-list.tsx
│   │   ├── store-request-detail.tsx
│   │   ├── store-request-actions.tsx
│   │   └── approve-store-dialog.tsx
│   │
│   ├── role-requests/
│   │   ├── role-requests-list.tsx
│   │   ├── role-request-detail.tsx
│   │   ├── role-request-actions.tsx
│   │   ├── approve-role-dialog.tsx
│   │   └── permission-editor.tsx
│   │
│   └── admin-sidebar.tsx
│
├── store/
│   ├── staff/
│   │   ├── staff-list.tsx
│   │   ├── invite-staff-dialog.tsx
│   │   ├── edit-staff-dialog.tsx
│   │   └── role-selector.tsx
│   │
│   ├── roles/
│   │   ├── custom-roles-list.tsx
│   │   ├── request-role-dialog.tsx
│   │   ├── role-detail.tsx
│   │   └── permission-picker.tsx
│   │
│   └── store-sidebar.tsx
│
├── forms/
│   ├── signup-form.tsx
│   ├── store-request-form.tsx
│   └── role-request-form.tsx
│
└── ui/
    └── ... (shadcn components)
```

---

## Implementation Phases

### Phase 1: Database & Core Models (Week 1)

| Task | Priority | Status |
|------|----------|--------|
| Update Prisma schema with CustomRoleRequest model | High | ✅ |
| Add CustomRole model | High | ✅ |
| Update StoreStaff model (add customRoleId) | High | ✅ |
| Update NotificationType enum with role notifications | High | ✅ |
| Create and run migration | High | ✅ |
| Create permission definitions in lib/permissions.ts | High | ✅ |
| Create GET /api/permissions endpoint | Medium | ✅ |
| Update seed data with test scenarios | Medium | ⬜ |

### Phase 2: User Approval Flow (Week 2)

| Task | Priority | Status |
|------|----------|--------|
| Update signup form with business info fields | High | ✅ |
| Create pending-approval page | High | ✅ |
| Create admin pending users list page | High | ✅ |
| Implement approve/reject API endpoints | High | ✅ |
| Add email notifications on approval/rejection | Medium | ✅ |
| Block dashboard access for non-approved users | High | ✅ |

### Phase 3: Store Request Flow (Week 3)

| Task | Priority | Status |
|------|----------|--------|
| Create store request form (user side) | High | ✅ |
| Create admin store requests list page | High | ✅ |
| Implement store request API endpoints | High | ✅ |
| Implement approve endpoint (creates store) | High | ✅ |
| Remove direct store creation | High | ✅ |
| Add store request notifications | Medium | ✅ |

### Phase 4: Custom Role Request Flow (Week 4)

| Task | Priority | Status |
|------|----------|--------|
| Create permission picker component | High | ✅ |
| Create role request form (store owner side) | High | ✅ |
| Create admin role requests list page | High | ✅ |
| Implement role request API endpoints | High | ✅ |
| Implement approve/reject/modify endpoints | High | ✅ |
| Add role request notifications | Medium | ✅ |
| Create permission editor for admin modifications | Medium | ✅ |

### Phase 5: Staff Management (Week 5)

| Task | Priority | Status |
|------|----------|--------|
| Update staff management page | High | ✅ |
| Create role selector (predefined + custom) | High | ✅ |
| Update invite staff dialog | High | ✅ |
| Implement staff API endpoints with custom role support | High | ✅ |
| Add staff invitation email templates | Medium | ⬜ |
| Create staff accept invitation flow | Medium | ✅ |

### Phase 6: Polish & Testing (Week 6)

| Task | Priority | Status |
|------|----------|--------|
| Create all email templates | High | ⬜ |
| Add in-app notification system | Medium | ⬜ |
| Implement activity logging for all actions | Medium | ⬜ |
| End-to-end flow testing | High | ⬜ |
| Error handling improvements | High | ⬜ |
| Documentation updates | Medium | ⬜ |

---

## Security Considerations

### 1. Permission Validation

```typescript
// Allowed permissions for custom roles
const ALLOWED_PERMISSIONS = [
  'products:read', 'products:create', 'products:update', 'products:delete',
  'orders:read', 'orders:update', 'orders:cancel', 'orders:refund',
  'customers:read', 'customers:update', 'customers:delete',
  'inventory:read', 'inventory:update',
  'reports:read', 'reports:export',
  'analytics:read',
  'settings:read', 'settings:update',
];

// Restricted permissions (admin only - NOT available for custom roles)
const RESTRICTED_PERMISSIONS = [
  'stores:*',           // Store management
  'staff:delete',       // Deleting staff
  'billing:*',          // Billing access
  'settings:delete',    // Deleting settings
  'roles:*',            // Managing roles
];

// Validate permissions on request
function validatePermissions(requested: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const perm of requested) {
    if (!ALLOWED_PERMISSIONS.includes(perm)) {
      errors.push(`Permission "${perm}" is not available for custom roles`);
    }
    if (RESTRICTED_PERMISSIONS.some(r => perm.startsWith(r.replace('*', '')))) {
      errors.push(`Permission "${perm}" is restricted to administrators`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}
```

### 2. Rate Limiting

```typescript
const RATE_LIMITS = {
  // Store requests
  storeRequest: {
    maxPerUser: 3,           // User can have max 3 store requests total
    maxPendingPerUser: 1,    // Only 1 pending request at a time
    cooldownHours: 24,       // Wait 24h after rejection to request again
  },
  
  // Custom role requests
  roleRequest: {
    maxPerStore: 20,         // Max 20 custom roles per store
    maxPendingPerStore: 5,   // Max 5 pending requests per store
    cooldownHours: 1,        // Wait 1h between submissions
  },
  
  // Staff invitations
  staffInvite: {
    maxPerStore: 100,        // Max 100 staff per store
    maxPerDay: 20,           // Max 20 invites per day
  },
};
```

### 3. Audit Logging

```typescript
// All approval actions are logged to PlatformActivity
interface ApprovalAuditEntry {
  action: 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'MODIFY';
  entityType: 'USER' | 'STORE_REQUEST' | 'ROLE_REQUEST';
  entityId: string;
  actorId: string;          // Super Admin ID
  previousState: object;
  newState: object;
  reason?: string;
  notes?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}
```

### 4. Authorization Checks

```typescript
// Check user can request custom role
async function canRequestCustomRole(userId: string, storeId: string): Promise<boolean> {
  const staff = await prisma.storeStaff.findFirst({
    where: {
      userId,
      storeId,
      isActive: true,
      role: { in: ['STORE_ADMIN'] }, // Only STORE_ADMIN can request
    },
  });
  
  return !!staff;
}

// Check user is store owner
async function isStoreOwner(userId: string, storeId: string): Promise<boolean> {
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      organization: { store: { id: storeId } },
      role: 'OWNER',
    },
  });
  
  return !!membership;
}
```

---

## Summary

### Complete Approval Chain

```
1. User Signup
   └── Super Admin Approves User ✅
       └── User can login and access limited dashboard

2. Store Request  
   └── Super Admin Approves Store Request ✅
       └── Store created automatically
       └── User becomes Store Owner

3. Custom Role Request
   └── Super Admin Approves/Modifies Role ✅ (IMPLEMENTED)
       └── Custom role available in store

4. Staff Assignment
   └── Store Owner assigns Predefined OR Custom role ✅ (IMPLEMENTED)
       └── Staff can access store with assigned permissions
```

### What's Already Implemented ✅

- User registration with business info
- User approval/rejection workflow
- Store request submission
- Store request approval (creates store automatically)
- Direct store creation disabled
- Notifications for user/store approvals
- Admin dashboard with pending counts
- CustomRoleRequest model and migration
- CustomRole model
- Permission picker UI component
- Role request form (store owner)
- Role request management (admin)
- Role approval/rejection/modification
- Staff assignment with custom roles
- Updated staff management UI

### What Needs Implementation ⬜

- Email templates for staff invitations
- Update seed data with test scenarios
- End-to-end flow testing

---

## Implementation Details (December 2024)

### Files Created/Modified

#### API Routes

**Admin Role Request APIs:**
- `src/app/api/admin/role-requests/route.ts` - GET all role requests
- `src/app/api/admin/role-requests/[id]/route.ts` - GET single request
- `src/app/api/admin/role-requests/[id]/approve/route.ts` - Approve request
- `src/app/api/admin/role-requests/[id]/reject/route.ts` - Reject request
- `src/app/api/admin/role-requests/[id]/request-modification/route.ts` - Request changes

**Store Role Request APIs:**
- `src/app/api/stores/[storeId]/role-requests/route.ts` - GET/POST store role requests
- `src/app/api/stores/[storeId]/role-requests/[id]/route.ts` - GET/PATCH/DELETE single request

**Store Custom Roles APIs:**
- `src/app/api/stores/[storeId]/custom-roles/route.ts` - GET approved custom roles

**Staff Management APIs:**
- `src/app/api/stores/[storeId]/staff/route.ts` - GET/POST staff members
- `src/app/api/stores/[storeId]/staff/[staffId]/route.ts` - GET/PATCH/DELETE single staff
- `src/app/api/stores/[storeId]/staff/accept-invite/route.ts` - POST/DELETE accept/decline invitation

**Permissions API:**
- `src/app/api/permissions/route.ts` - GET available permissions

#### Admin UI

- `src/app/admin/roles/requests/page.tsx` - Role requests listing page
- `src/app/admin/roles/requests/role-requests-header.tsx` - Filter header component
- `src/app/admin/roles/requests/role-requests-list.tsx` - Server-side list component
- `src/app/admin/roles/requests/role-request-actions.tsx` - Quick approve/reject actions
- `src/app/admin/roles/requests/[id]/page.tsx` - Request detail page
- `src/app/admin/roles/requests/[id]/role-request-detail-actions.tsx` - Full action dialogs
- `src/components/admin/admin-sidebar.tsx` - Updated with Role Requests nav item

#### Store Dashboard UI

- `src/app/dashboard/stores/[storeId]/roles/page.tsx` - Roles & permissions page
- `src/app/dashboard/stores/[storeId]/roles/roles-list.tsx` - Custom roles list
- `src/app/dashboard/stores/[storeId]/roles/role-requests-list.tsx` - Store's role requests
- `src/app/dashboard/stores/[storeId]/roles/request/page.tsx` - Request custom role page
- `src/app/dashboard/stores/[storeId]/roles/request/request-role-form.tsx` - Request form

- `src/app/dashboard/stores/[storeId]/staff/page.tsx` - Staff management page
- `src/app/dashboard/stores/[storeId]/staff/staff-list.tsx` - Staff listing with owner
- `src/app/dashboard/stores/[storeId]/staff/invite-staff-dialog.tsx` - Invite dialog
- `src/app/dashboard/stores/[storeId]/staff/staff-actions.tsx` - Edit/deactivate/remove menu

#### Library Updates

- `src/lib/custom-role-permissions.ts` - Permission definitions with categories
  - `AVAILABLE_PERMISSIONS` - Full permission list
  - `ALLOWED_PERMISSIONS` - Alias for available permissions
  - `validatePermissions()` - Validate permission array
  - `getPermissionsByCategory()` - Group permissions by category
  - `isPermissionAllowed()` - Check single permission

#### Schema Updates

```prisma
// Added to prisma/schema.prisma

enum NotificationType {
  // ... existing types ...
  ROLE_REQUEST_PENDING
  ROLE_REQUEST_APPROVED
  ROLE_REQUEST_REJECTED
  ROLE_REQUEST_MODIFIED
  STAFF_INVITED
  STAFF_ROLE_CHANGED
  STAFF_ROLE_UPDATED
  STAFF_DEACTIVATED
  STAFF_REMOVED
  STAFF_JOINED
  STAFF_DECLINED
}
```

### Navigation Paths

| Feature | Path |
|---------|------|
| Admin Role Requests | `/admin/roles/requests` |
| Admin Request Detail | `/admin/roles/requests/[id]` |
| Store Roles | `/dashboard/stores/[storeId]/roles` |
| Request Custom Role | `/dashboard/stores/[storeId]/roles/request` |
| Store Staff | `/dashboard/stores/[storeId]/staff` |

### Key Implementation Notes

1. **Store Ownership**: The system uses `Organization -> Membership` pattern, NOT `Store.ownerId`. Owner is identified by `Membership.role === 'OWNER'` where `membership.organization.store.id === storeId`.

2. **Access Control**: Uses `checkStoreAccess()` helper that checks:
   - Organization membership with OWNER role
   - StoreStaff with ADMIN role
   - General organization membership

3. **Predefined Roles**: Store staff can use these predefined roles from the Role enum:
   - `STORE_ADMIN`, `SALES_MANAGER`, `INVENTORY_MANAGER`
   - `CUSTOMER_SERVICE`, `CONTENT_MANAGER`, `MARKETING_MANAGER`
   - `DELIVERY_BOY`

4. **Custom Roles**: Store owners can request custom roles with:
   - Maximum 10 custom roles per store
   - Maximum 5 pending requests per store
   - Permission selection from approved list

5. **Notification Types**: Using existing types until schema is regenerated:
   - `STAFF_ROLE_CHANGED` for role updates
   - `STORE_ASSIGNED` for staff removal/deactivation
   - `STAFF_INVITED` for new invitations

---

## Quick Reference

### URLs

| Page | URL | Access |
|------|-----|--------|
| Signup | `/signup` | Public |
| Login | `/login` | Public |
| Pending Approval | `/pending-approval` | Pending users |
| Dashboard | `/dashboard` | Approved users |
| Request Store | `/dashboard/store-request` | Approved users |
| Store Staff | `/dashboard/stores/[id]/staff` | Store admin |
| Custom Roles | `/dashboard/stores/[id]/roles` | Store admin |
| Admin Dashboard | `/admin` | Super Admin |
| Pending Users | `/admin/users/pending` | Super Admin |
| Store Requests | `/admin/stores/requests` | Super Admin |
| Role Requests | `/admin/roles/requests` | Super Admin |

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@example.com | SuperAdmin123!@# |

---

**Estimated Total Implementation Time: 6 weeks**

**Current Progress: ~90% (Phases 1-5 complete, Phase 6 partial)**
