

z# 🏗️ StormCom SaaS Implementation Plan

## Super Admin & User Registration Flow

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [User Registration Flow](#user-registration-flow)
4. [Store Creation Flow](#store-creation-flow)
5. [Super Admin Dashboard](#super-admin-dashboard)
6. [Database Changes](#database-changes)
7. [API Endpoints](#api-endpoints)
8. [UI Components](#ui-components)
9. [Implementation Phases](#implementation-phases)
10. [Best Practices](#best-practices)

---

## Overview

StormCom follows a **hierarchical multi-tenant SaaS architecture** where:

- **Users** register and await approval
- **Super Admin** reviews and approves users
- **Super Admin** creates stores for approved users
- **Store Owners** manage their assigned stores
- **Super Admin** monitors all platform activity

### Core Principles

| Principle | Implementation |
|-----------|----------------|
| **Controlled Onboarding** | Users can't self-create stores |
| **Quality Control** | Super Admin reviews all registrations |
| **Full Visibility** | Super Admin sees all stores & activity |
| **Security First** | Audit logging on all actions |
| **Scalable Design** | Multi-tenant isolation from day one |

---

## Architecture

### System Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                      SUPER ADMIN                            │
│              (Platform Owner - Full Access)                 │
│                                                             │
│  • Sees all users, stores, and activity                     │
│  • Approves/rejects user registrations                      │
│  • Creates stores for approved users                        │
│  • Monitors platform health & revenue                       │
│  • Manages subscriptions & billing                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    USER REGISTRATION                        │
│              (Self-service with approval)                   │
│                                                             │
│  1. User creates account                                    │
│  2. Email verification                                      │
│  3. Account status = PENDING                                │
│  4. Super Admin notification                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   APPROVAL PROCESS                          │
│                                                             │
│  Super Admin reviews user request:                          │
│  ├── APPROVE → User can have store created                  │
│  ├── REJECT → User notified with reason                     │
│  └── REQUEST INFO → User updates application                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   STORE CREATION                            │
│              (By Super Admin only)                          │
│                                                             │
│  1. Super Admin selects approved user                       │
│  2. Creates store with settings                             │
│  3. User assigned as STORE_OWNER                            │
│  4. Welcome email sent to user                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    STORE OWNER                              │
│              (Manages their store)                          │
│                                                             │
│  • Products, orders, customers                              │
│  • Staff management                                         │
│  • Store settings & reports                                 │
│  • Cannot create additional stores                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    STORE STAFF                              │
│       (Various roles with limited permissions)              │
│                                                             │
│  SALES_MANAGER → Orders & customers                         │
│  INVENTORY_MANAGER → Products & stock                       │
│  CUSTOMER_SERVICE → Support & inquiries                     │
│  CONTENT_MANAGER → Content & descriptions                   │
│  MARKETING_MANAGER → Campaigns & analytics                  │
│  DELIVERY_BOY → Deliveries only                             │
└─────────────────────────────────────────────────────────────┘
```

---

## User Registration Flow

### Step-by-Step Process

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: USER VISITS REGISTRATION PAGE                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Required Fields:                                           │
│  • Full Name                                                │
│  • Email Address                                            │
│  • Password (min 8 chars, uppercase, number, symbol)        │
│  • Business Name (for store request)                        │
│  • Business Description (why they need a store)             │
│  • Business Category (dropdown)                             │
│  • Phone Number (optional)                                  │
│                                                             │
│  Terms & Conditions checkbox                                │
│  CAPTCHA verification                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: EMAIL VERIFICATION                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  • Magic link sent to email                                 │
│  • 24-hour expiry                                           │
│  • User clicks link → Email verified                        │
│  • Account status remains PENDING                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: PENDING APPROVAL SCREEN                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User sees:                                                 │
│  "Thank you for registering!                                │
│                                                             │
│   Your application is under review. Our team will           │
│   review your request within 24-48 hours.                   │
│                                                             │
│   You'll receive an email when your account is approved."   │
│                                                             │
│  User CAN:                                                  │
│  • View their profile                                       │
│  • Update contact information                               │
│  • Log out                                                  │
│                                                             │
│  User CANNOT:                                               │
│  • Access dashboard                                         │
│  • Create/manage anything                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: SUPER ADMIN NOTIFICATION                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Super Admin receives:                                      │
│  • Email notification (new registration)                    │
│  • Dashboard alert (pending count badge)                    │
│  • Push notification (if enabled)                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Account Status States

| Status | Description | User Access |
|--------|-------------|-------------|
| `PENDING` | Awaiting Super Admin review | Profile only |
| `APPROVED` | Can have store created | Limited dashboard |
| `REJECTED` | Application denied | None (can appeal) |
| `SUSPENDED` | Temporarily disabled | None |
| `DELETED` | Soft deleted | None |

---

## Store Creation Flow

### Super Admin Creates Store for User

```
┌─────────────────────────────────────────────────────────────┐
│ CREATE NEW STORE                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Section 1: Owner Selection                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Store Owner*                                         │   │
│  │ [Select approved user ▼]                             │   │
│  │                                                      │   │
│  │ Only shows users with:                               │   │
│  │ • accountStatus = APPROVED                           │   │
│  │ • No existing store assigned                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Section 2: Store Details                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Store Name*:     [                              ]    │   │
│  │ Store Slug*:     [                              ]    │   │
│  │ Store Email*:    [                              ]    │   │
│  │ Store Phone:     [                              ]    │   │
│  │ Store Category:  [Select category ▼]                 │   │
│  │ Description:     [                              ]    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Section 3: Subscription                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Plan*:                                               │   │
│  │ ○ Free (limited features)                            │   │
│  │ ○ Basic - $29/mo (standard features)                 │   │
│  │ ○ Pro - $79/mo (advanced features)                   │   │
│  │ ● Enterprise - $199/mo (all features)                │   │
│  │                                                      │   │
│  │ Trial Period: [30 days ▼]                            │   │
│  │ Billing Start: [After trial ▼]                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Section 4: Options                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☑ Send welcome email to store owner                  │   │
│  │ ☑ Include getting started guide                      │   │
│  │ ☐ Pre-populate with sample products                  │   │
│  │ ☐ Enable all integrations                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                         [Cancel]  [Create Store]            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### What Happens After Store Creation

1. **Organization Created** - Auto-generated for store isolation
2. **Store Created** - Linked to organization
3. **User Assigned** - As OWNER of organization + STORE_ADMIN of store
4. **Email Sent** - Welcome email with login instructions
5. **Audit Logged** - Store creation recorded
6. **Dashboard Updated** - Super Admin sees new store in list

---

## Super Admin Dashboard

### Main Dashboard Layout

```
┌──────────────────────────────────────────────────────────────┐
│  🏠 SUPER ADMIN DASHBOARD                      👤 SuperAdmin │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │ 👥 Users    │ │ 🏪 Stores   │ │ 📊 Revenue  │ │ 🔔 Alerts│ │
│  │    247      │ │     45      │ │   $124,500  │ │    5     │ │
│  │ +12 today   │ │  +2 today   │ │ +15% month  │ │ pending  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ⏳ PENDING APPROVALS (5)                       View All │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │                                                        │  │
│  │  👤 John Doe                                           │  │
│  │  john@example.com • Registered 2 hours ago             │  │
│  │  "I want to sell handmade jewelry..."                  │  │
│  │  [✓ Approve] [✗ Reject] [ℹ More Info]                  │  │
│  │  ─────────────────────────────────────────────────     │  │
│  │  👤 Jane Smith                                         │  │
│  │  jane@example.com • Registered 5 hours ago             │  │
│  │  "Starting an online clothing boutique..."             │  │
│  │  [✓ Approve] [✗ Reject] [ℹ More Info]                  │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 📈 PLATFORM ACTIVITY                           View All │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │                                                        │  │
│  │  🏪 Store "Fashion Hub" created         10 minutes ago │  │
│  │  ✓ User john@email.com approved         30 minutes ago │  │
│  │  💰 Order $450 at "Tech Store"              1 hour ago │  │
│  │  ⚠️ Rate limit hit: api/products          2 hours ago │  │
│  │  🔐 Permission denied: stores:delete      3 hours ago │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 🏪 STORES OVERVIEW                             View All │  │
│  ├─────────────┬──────────┬─────────┬─────────┬──────────┤  │
│  │ Store       │ Owner    │ Status  │ Revenue │ Actions  │  │
│  ├─────────────┼──────────┼─────────┼─────────┼──────────┤  │
│  │ Fashion Hub │ John Doe │ 🟢 Active│ $12,340 │ [Manage] │  │
│  │ Tech Store  │ Jane S.  │ 🟢 Active│ $8,500  │ [Manage] │  │
│  │ Home Decor  │ Bob W.   │ 🟡 Trial │ $2,100  │ [Manage] │  │
│  │ Pet Supplies│ Alice M. │ 🔴 Susp. │ $890    │ [Manage] │  │
│  └─────────────┴──────────┴─────────┴─────────┴──────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Super Admin Navigation

```
Sidebar Navigation:

📊 Dashboard
├── Overview (default)
├── Analytics
└── System Health

👥 Users
├── All Users
├── Pending Approval (5) ← Badge
├── Approved Users
├── Suspended Users
└── User Activity

🏪 Stores
├── All Stores
├── Create Store ← Primary action
├── Store Analytics
└── Subscriptions

💰 Revenue
├── Overview
├── By Store
├── By Plan
└── Transactions

📋 Activity
├── Audit Logs
├── Permission Denials
├── Login History
└── API Usage

⚙️ Settings
├── Platform Settings
├── Subscription Plans
├── Email Templates
├── Integrations
└── Security
```

---

## Database Changes

### User Model Updates

```prisma
model User {
  id                String    @id @default(cuid())
  name              String?
  email             String?   @unique
  emailVerified     DateTime?
  passwordHash      String?
  image             String?
  
  // NEW: Account status for approval flow
  accountStatus     AccountStatus @default(PENDING)
  statusChangedAt   DateTime?
  statusChangedBy   String?       // SuperAdmin userId
  rejectionReason   String?
  
  // NEW: Store request information
  businessName      String?
  businessDescription String?
  businessCategory  String?
  phoneNumber       String?
  
  // NEW: Approval tracking
  approvedAt        DateTime?
  approvedBy        String?       // SuperAdmin userId
  
  // Existing fields
  isSuperAdmin      Boolean   @default(false)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  deletedAt         DateTime?
  
  // Relations
  accounts          Account[]
  sessions          Session[]
  memberships       Membership[]
  storeStaff        StoreStaff[]
}

enum AccountStatus {
  PENDING
  APPROVED
  REJECTED
  SUSPENDED
  DELETED
}
```

### New Notification Model

```prisma
model Notification {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  type        NotificationType
  title       String
  message     String
  data        Json?    // Additional context
  read        Boolean  @default(false)
  readAt      DateTime?
  createdAt   DateTime @default(now())
  
  @@index([userId, read])
}

enum NotificationType {
  USER_REGISTERED
  USER_APPROVED
  USER_REJECTED
  STORE_CREATED
  STORE_SUSPENDED
  SECURITY_ALERT
  SYSTEM_UPDATE
}
```

---

## API Endpoints

### User Management (Super Admin Only)

```typescript
// List pending users
GET /api/admin/users/pending
Response: {
  users: [{
    id: string
    name: string
    email: string
    businessName: string
    businessDescription: string
    businessCategory: string
    createdAt: string
    emailVerified: boolean
  }]
  total: number
}

// Approve user
POST /api/admin/users/[id]/approve
Body: {
  createStoreImmediately?: boolean
  storeConfig?: {
    name: string
    slug: string
    email: string
    plan: string
    trialDays: number
  }
}
Response: {
  user: User
  store?: Store  // If createStoreImmediately = true
}

// Reject user
POST /api/admin/users/[id]/reject
Body: {
  reason: string
  allowReapply?: boolean
}
Response: {
  user: User
  emailSent: boolean
}

// List all users
GET /api/admin/users
Query: {
  status?: AccountStatus
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
Response: {
  users: User[]
  total: number
  page: number
  totalPages: number
}

// Get user details
GET /api/admin/users/[id]
Response: {
  user: User
  stores: Store[]
  activity: AuditLog[]
  stats: {
    totalOrders: number
    totalRevenue: number
    lastActive: string
  }
}

// Update user
PATCH /api/admin/users/[id]
Body: {
  accountStatus?: AccountStatus
  suspensionReason?: string
}
Response: {
  user: User
}
```

### Store Management (Super Admin)

```typescript
// Create store for user
POST /api/admin/stores
Body: {
  userId: string           // Owner user ID
  name: string
  slug: string
  email: string
  phone?: string
  description?: string
  plan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE'
  trialDays: number
  sendWelcomeEmail: boolean
  populateSampleData: boolean
}
Response: {
  store: Store
  organization: Organization
  membership: Membership
  emailSent: boolean
}

// List all stores
GET /api/admin/stores
Query: {
  status?: StoreStatus
  plan?: string
  search?: string
  page?: number
  limit?: number
}
Response: {
  stores: [{
    ...Store
    owner: User
    stats: {
      products: number
      orders: number
      revenue: number
      customers: number
    }
  }]
  total: number
}

// Get store details
GET /api/admin/stores/[id]
Response: {
  store: Store
  owner: User
  organization: Organization
  staff: StoreStaff[]
  stats: StoreStats
  activity: AuditLog[]
}

// Update store
PATCH /api/admin/stores/[id]
Body: {
  status?: StoreStatus
  plan?: string
  suspensionReason?: string
}
Response: {
  store: Store
}

// Delete store
DELETE /api/admin/stores/[id]
Body: {
  hardDelete?: boolean  // Soft delete by default
  reason: string
}
Response: {
  success: boolean
}
```

### Activity & Analytics (Super Admin)

```typescript
// Platform activity feed
GET /api/admin/activity
Query: {
  type?: string[]
  storeId?: string
  userId?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}
Response: {
  activities: AuditLog[]
  total: number
}

// Platform analytics
GET /api/admin/analytics/platform
Query: {
  period: '7d' | '30d' | '90d' | '1y'
}
Response: {
  users: {
    total: number
    new: number
    active: number
    pending: number
  }
  stores: {
    total: number
    active: number
    suspended: number
    byPlan: Record<string, number>
  }
  revenue: {
    total: number
    thisMonth: number
    growth: number
    byStore: { storeId: string, amount: number }[]
  }
  orders: {
    total: number
    thisMonth: number
    averageValue: number
  }
}

// Super Admin notifications
GET /api/admin/notifications
Query: {
  unreadOnly?: boolean
  page?: number
  limit?: number
}
Response: {
  notifications: Notification[]
  unreadCount: number
}

// Mark notification read
PATCH /api/admin/notifications/[id]/read
Response: {
  notification: Notification
}
```

### User Registration (Public)

```typescript
// Register new user
POST /api/auth/register
Body: {
  name: string
  email: string
  password: string
  businessName: string
  businessDescription: string
  businessCategory: string
  phoneNumber?: string
  acceptedTerms: boolean
}
Response: {
  user: {
    id: string
    email: string
    accountStatus: 'PENDING'
  }
  message: "Registration successful. Please verify your email."
}

// Check registration status
GET /api/auth/registration-status
Response: {
  accountStatus: AccountStatus
  message: string
  canAccessDashboard: boolean
}
```

---

## UI Components

### New Components Needed

```
src/components/admin/
├── pending-users/
│   ├── pending-users-list.tsx      # List of pending registrations
│   ├── user-approval-card.tsx      # Individual user card with actions
│   └── approval-dialog.tsx         # Approve/reject dialog
│
├── user-management/
│   ├── users-table.tsx             # All users data table
│   ├── user-detail-dialog.tsx      # User details modal
│   ├── user-status-badge.tsx       # Status indicator
│   └── user-actions-dropdown.tsx   # Action menu
│
├── store-creation/
│   ├── create-store-wizard.tsx     # Multi-step store creation
│   ├── user-selector.tsx           # Select approved user
│   ├── plan-selector.tsx           # Subscription plan picker
│   └── store-preview.tsx           # Preview before creation
│
├── activity/
│   ├── activity-feed.tsx           # Real-time activity list
│   ├── activity-filters.tsx        # Filter controls
│   └── activity-detail-dialog.tsx  # Activity details
│
├── dashboards/
│   ├── super-admin-dashboard.tsx   # Main overview dashboard
│   ├── platform-stats.tsx          # Key metrics cards
│   ├── pending-approvals-widget.tsx# Quick approval widget
│   └── stores-overview-widget.tsx  # Stores summary
│
└── notifications/
    ├── notification-bell.tsx       # Header notification icon
    ├── notification-dropdown.tsx   # Notification list
    └── notification-item.tsx       # Individual notification
```

### Page Routes

```
src/app/admin/
├── page.tsx                        # Dashboard redirect
├── dashboard/
│   └── page.tsx                    # Main dashboard
├── users/
│   ├── page.tsx                    # All users list
│   ├── pending/
│   │   └── page.tsx                # Pending approvals
│   ├── approved/
│   │   └── page.tsx                # Approved users
│   └── [id]/
│       └── page.tsx                # User detail
├── stores/
│   ├── page.tsx                    # All stores
│   ├── create/
│   │   └── page.tsx                # Create store wizard
│   └── [id]/
│       └── page.tsx                # Store detail
├── activity/
│   ├── page.tsx                    # Activity feed
│   └── audit-log/
│       └── page.tsx                # Full audit log
├── analytics/
│   └── page.tsx                    # Platform analytics
└── settings/
    ├── page.tsx                    # Settings overview
    └── plans/
        └── page.tsx                # Subscription plans
```

---

## Implementation Phases

### Phase 1: User Registration Flow (Week 1-2)

**Tasks:**
- [x] Add `accountStatus` field to User model
- [x] Create migration for new fields
- [x] Update registration API to set PENDING status
- [x] Create "Pending Approval" page for users
- [x] Block dashboard access for non-approved users
- [x] Add email notification on registration
- [x] Create Super Admin notification system

**Deliverables:**
- Users can register with business info
- Users see pending status after registration
- Super Admin receives notification of new registration

---

### Phase 2: User Approval Workflow (Week 3-4)

**Tasks:**
- [x] Create `/admin/users/pending` page
- [x] Create `PendingUsersList` component
- [x] Create `UserApprovalCard` component (integrated into PendingUsersList)
- [x] Implement approve/reject API endpoints
- [x] Add email templates for approval/rejection
- [x] Create user management table
- [x] Add user search and filters

**Deliverables:**
- Super Admin can view pending users
- Super Admin can approve/reject users
- Users receive email notification of status change
- Super Admin can manage all users

---

### Phase 3: Store Creation by Super Admin (Week 5-6)

**Tasks:**
- [x] Create `/admin/stores/create` wizard
- [x] Create `UserSelector` component (integrated into CreateStoreForm)
- [x] Create `PlanSelector` component (integrated into CreateStoreForm)
- [x] Update store creation API for admin flow
- [x] Auto-create organization and membership
- [x] Add welcome email template
- [x] Create stores management table
- [x] Add store search and filters

**Deliverables:**
- Super Admin can create stores for approved users
- Users automatically become store owners
- Users receive welcome email with instructions
- Super Admin can manage all stores

---

### Phase 4: Activity Monitoring (Week 7-8)

**Tasks:**
- [x] Create `/admin/activity` page
- [x] Create `ActivityFeed` component
- [x] Add activity filters (by type, user, store, date)
- [x] Create `ActivityDetailDialog` component
- [ ] Add real-time activity updates (optional)
- [x] Create platform analytics dashboard
- [x] Add export functionality

**Deliverables:**
- Super Admin can view all platform activity
- Super Admin can filter and search activity
- Super Admin can view platform-wide analytics
- Activity can be exported for compliance

---

### Phase 5: Notifications & Polish (Week 9-10)

**Tasks:**
- [x] Create notification system
- [x] Add notification bell to header
- [x] Create notification dropdown
- [ ] Add email notification preferences (optional)
- [x] Polish UI/UX
- [x] Add loading states and error handling
- [ ] Comprehensive testing
- [x] Documentation

**Deliverables:**
- Super Admin receives real-time notifications
- Email notifications for important events
- Polished, production-ready UI
- Complete documentation

---

## Best Practices

### Security

1. **Rate Limit Registration**
   - Max 5 registrations per IP per hour
   - CAPTCHA after 2 attempts

2. **Email Verification Required**
   - Before account can be approved
   - 24-hour link expiry

3. **Block Disposable Emails**
   - Maintain blocklist of temporary email domains
   - Consider email verification services

4. **Audit Everything**
   - Log all admin actions
   - Store IP addresses and user agents
   - Maintain audit trail for compliance

### User Experience

1. **Clear Status Communication**
   - Show clear status badges
   - Provide estimated review time
   - Send status update emails

2. **Self-Service Where Possible**
   - Allow users to update their application
   - Provide appeal process for rejections
   - Let users cancel pending registrations

3. **Fast Approval Process**
   - Set SLA (24-48 hours)
   - Email notifications to Super Admin
   - Dashboard prominently shows pending count

### Scalability

1. **Batch Operations**
   - Bulk approve/reject
   - Bulk store creation
   - Export capabilities

2. **Search & Filters**
   - Full-text search on users/stores
   - Filter by status, date, category
   - Sort by various fields

3. **Pagination**
   - All lists should be paginated
   - Use cursor-based pagination for large datasets
   - Maintain scroll position

---

## Summary

### What Already Exists ✅

| Feature | Status |
|---------|--------|
| SUPER_ADMIN role with full permissions | ✅ Complete |
| Store creation API | ✅ Complete |
| Audit logging system | ✅ Complete |
| User authentication | ✅ Complete |
| Multi-tenant architecture | ✅ Complete |
| Role-based permissions | ✅ Complete |
| User model with accountStatus field | ✅ **IMPLEMENTED** |
| Account status blocking in auth | ✅ **IMPLEMENTED** |
| Notification model | ✅ **IMPLEMENTED** |
| PlatformActivity model | ✅ **IMPLEMENTED** |
| Admin API endpoints (approve/reject/suspend) | ✅ **IMPLEMENTED** |
| Super Admin dashboard | ✅ **IMPLEMENTED** |
| Pending users page | ✅ **IMPLEMENTED** |
| User approval workflow | ✅ **IMPLEMENTED** |
| Admin store creation | ✅ **IMPLEMENTED** |
| Activity monitoring dashboard | ✅ **IMPLEMENTED** |
| All users management table | ✅ **IMPLEMENTED** |
| Stores listing page | ✅ **IMPLEMENTED** |

### What Needs to Be Built ❌

| Feature | Priority | Effort |
|---------|----------|--------|
| ~~User approval workflow (accountStatus)~~ | ~~High~~ | ✅ Done |
| ~~Super Admin dashboard for user management~~ | ~~High~~ | ✅ Done |
| ~~Store creation by Super Admin (not user)~~ | ~~High~~ | ✅ Done |
| ~~Activity monitoring dashboard~~ | ~~Medium~~ | ✅ Done |
| ~~Notification system (database)~~ | ~~Medium~~ | ✅ Done |
| Email templates | Low | 1 week |
| Real-time notifications (push) | Low | 1 week |
| Analytics page | Low | 1 week |
| Admin settings page | Low | 1 week |

### Estimated Timeline

```
Original Total: 10 weeks

IMPLEMENTED (Dec 2025):
✅ Phase 1 - User Registration Flow (accountStatus, business fields)
✅ Phase 2 - User Approval Workflow (approve/reject/suspend APIs)
✅ Phase 3 - Store Creation by Super Admin (form + API)
✅ Phase 4 - Activity Monitoring (PlatformActivity model + dashboard)
✅ Phase 5 - Notifications (database model + API)

REMAINING:
Week 1: Email templates for status notifications
Week 2: Real-time push notifications
```

### Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| User registration completion rate | > 80% | ⏳ Pending testing |
| Average approval time | < 24 hours | ✅ Workflow ready |
| Super Admin dashboard load time | < 2 seconds | ✅ Implemented |
| Unauthorized store creation | 0 | ✅ Auth checks in place |
| Audit trail coverage | 100% | ✅ PlatformActivity logging |

---

## Quick Start Checklist

When starting implementation:

- [x] Review existing User model and add new fields ✅
- [x] Create database migration ✅
- [x] Update middleware to check accountStatus ✅
- [x] Create basic Super Admin dashboard page ✅
- [x] Implement pending users list ✅
- [x] Add approve/reject functionality ✅
- [x] Create store creation wizard ✅
- [ ] Test full flow end-to-end

---

## Implementation Details (Added Dec 2025)

### Database Changes Made

**User Model Extended:**
- `accountStatus` (enum: PENDING, APPROVED, REJECTED, SUSPENDED, DELETED)
- `businessName`, `businessDescription`, `businessCategory`, `phoneNumber`
- `approvedAt`, `approvedBy`, `statusChangedAt`, `statusChangedBy`, `rejectionReason`

**New Models Created:**
- `Notification` - User notifications with type, title, message, read status
- `PlatformActivity` - Tracks admin actions (user approvals, store creation, etc.)
- `StoreRequest` - Store creation requests (for future self-service)

### API Endpoints Created

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/users/pending` | GET | List pending users |
| `/api/admin/users/[id]/approve` | POST | Approve user |
| `/api/admin/users/[id]/reject` | POST | Reject user with reason |
| `/api/admin/users/[id]/suspend` | POST | Suspend user |
| `/api/admin/stores` | POST | Create store for user |
| `/api/admin/activity/platform` | GET | Platform activity feed |
| `/api/admin/stats` | GET | Dashboard statistics |
| `/api/notifications` | GET/PATCH | User notifications |

### Admin UI Pages

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/admin` | Stats, pending users, activity feed |
| Pending Users | `/admin/users/pending` | List with approve/reject actions |
| All Users | `/admin/users` | Full user management table |
| Stores | `/admin/stores` | All stores listing |
| Create Store | `/admin/stores/create` | Store creation form |
| Activity | `/admin/activity` | Platform-wide activity feed |

### Auth Flow Changes

1. **Signup** - Now collects business info, sets status to PENDING
2. **Login** - Blocks PENDING/REJECTED/SUSPENDED users with specific messages
3. **Session** - Includes `accountStatus` for client-side checks

---

*Document Version: 2.0*  
*Last Updated: December 2025*  
*Author: StormCom Development Team*
