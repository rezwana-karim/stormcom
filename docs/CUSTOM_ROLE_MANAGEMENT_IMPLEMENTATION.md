# 🔐 Custom Role Management System - Complete Implementation Plan

## Executive Summary

This document provides a complete, production-ready implementation plan for the Custom Role Management System. The system allows:

1. **Store Owners** to create and assign custom roles with specific permissions to their employees
2. **Super Admins** to view all custom roles across all stores, set limits per store, and monitor role usage
3. **Real-time dashboard** showing custom role statistics per store

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Database Schema Changes](#database-schema-changes)
3. [API Endpoints](#api-endpoints)
4. [UI Components](#ui-components)
5. [Implementation Phases](#implementation-phases)
6. [Security Considerations](#security-considerations)
7. [Testing Checklist](#testing-checklist)

---

## System Overview

### Architecture Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STORE OWNER WORKFLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Store Owner → Dashboard → Roles Management                                  │
│       │                                                                      │
│       ├── View existing custom roles (with usage count)                      │
│       ├── Create new custom role (if under limit)                            │
│       │     ├── Select permissions from available list                       │
│       │     ├── Set role name and description                                │
│       │     └── Role is created (NO approval needed now)                     │
│       ├── Edit custom role permissions                                       │
│       ├── Deactivate/Delete custom role                                      │
│       └── Assign custom role to employee                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SUPER ADMIN DASHBOARD                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Super Admin → Admin Panel → Custom Roles Management                         │
│       │                                                                      │
│       ├── Overview Dashboard                                                 │
│       │     ├── Total custom roles across all stores                         │
│       │     ├── Stores with most custom roles                                │
│       │     ├── Most commonly used permissions                               │
│       │     └── Stores exceeding limit warnings                              │
│       │                                                                      │
│       ├── Per-Store View                                                     │
│       │     ├── Store name and details                                       │
│       │     ├── Current custom role count / limit                            │
│       │     ├── List of all custom roles with permissions                    │
│       │     ├── Staff members using each role                                │
│       │     └── Adjust custom role limit for store                           │
│       │                                                                      │
│       ├── Global Settings                                                    │
│       │     ├── Default custom role limit for new stores                     │
│       │     ├── Maximum allowed limit (absolute cap)                         │
│       │     └── Bulk update limits by subscription plan                      │
│       │                                                                      │
│       └── Audit Log                                                          │
│             ├── Custom role creation history                                 │
│             ├── Permission changes                                           │
│             └── Limit adjustment history                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Features

| Feature | Store Owner | Super Admin |
|---------|-------------|-------------|
| Create custom roles | ✅ (within limit) | ✅ (any store) |
| View own store's roles | ✅ | ✅ |
| View all stores' roles | ❌ | ✅ |
| Set permissions | ✅ (from allowed list) | ✅ (full access) |
| Assign roles to staff | ✅ | ✅ |
| Set custom role limit | ❌ | ✅ |
| View role usage stats | ✅ (own store) | ✅ (all stores) |
| Deactivate roles | ✅ | ✅ |
| Delete roles | ✅ (if not in use) | ✅ |

---

## Database Schema Changes

### 1. Update Store Model (Add Custom Role Limit)

```prisma
// In prisma/schema.prisma - Update Store model

model Store {
  // ... existing fields ...
  
  // Limits (add new field)
  productLimit        Int      @default(10)
  orderLimit          Int      @default(100)
  customRoleLimit     Int      @default(5)    // NEW: Max custom roles for this store
  
  // ... rest of model ...
}
```

### 2. Update CustomRole Model (Add Usage Tracking)

```prisma
// In prisma/schema.prisma - Update CustomRole model

model CustomRole {
  id          String   @id @default(cuid())
  
  // Store this role belongs to
  storeId     String
  store       Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  
  // Role details
  name        String
  description String?
  permissions String   // JSON array of permission strings
  
  // Status
  isActive    Boolean  @default(true)
  
  // Creator tracking (NEW)
  createdById   String?
  createdBy     User?    @relation("CreatedCustomRoles", fields: [createdById], references: [id], onDelete: SetNull)
  
  // Last modified tracking (NEW)
  lastModifiedById String?
  lastModifiedBy   User?  @relation("ModifiedCustomRoles", fields: [lastModifiedById], references: [id], onDelete: SetNull)
  lastModifiedAt   DateTime?
  
  // Approval info (keep for backward compatibility)
  approvedById  String?
  approvedBy    User?    @relation("ApprovedCustomRoles", fields: [approvedById], references: [id], onDelete: SetNull)
  approvedAt    DateTime?
  
  // Original request (if created via request workflow)
  originalRequest CustomRoleRequest?
  
  // Staff using this role
  staff       StoreStaff[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([storeId, name]) // Unique role name per store
  @@index([storeId, isActive])
  @@index([createdById])
  @@map("custom_roles")
}
```

### 3. Add Platform Settings Model (For Global Defaults)

```prisma
// In prisma/schema.prisma - New model for platform-wide settings

model PlatformSettings {
  id                      String   @id @default("global")
  
  // Custom Role Limits
  defaultCustomRoleLimit  Int      @default(5)   // Default limit for new stores
  maxCustomRoleLimit      Int      @default(20)  // Absolute maximum (even super admin can't exceed)
  
  // Limits by subscription plan (JSON)
  customRoleLimitsByPlan  String   @default("{\"FREE\": 3, \"BASIC\": 5, \"PRO\": 10, \"ENTERPRISE\": 20}")
  
  // Other platform settings can be added here
  updatedAt               DateTime @updatedAt
  updatedById             String?
  updatedBy               User?    @relation(fields: [updatedById], references: [id], onDelete: SetNull)
  
  @@map("platform_settings")
}
```

### 4. Add Custom Role Activity Log

```prisma
// In prisma/schema.prisma - New model for custom role audit trail

model CustomRoleActivity {
  id          String   @id @default(cuid())
  
  // What happened
  action      CustomRoleAction
  
  // Who did it
  actorId     String
  actor       User     @relation(fields: [actorId], references: [id], onDelete: Cascade)
  
  // Which role
  customRoleId String?
  customRole   CustomRole? @relation(fields: [customRoleId], references: [id], onDelete: SetNull)
  
  // Which store
  storeId     String
  store       Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  
  // Details
  roleName    String   // Captured role name (in case role is deleted)
  details     String?  // JSON with additional details
  previousValue String? // Previous state (for edits)
  newValue    String?  // New state (for edits)
  
  createdAt   DateTime @default(now())
  
  @@index([storeId, createdAt])
  @@index([actorId, createdAt])
  @@index([customRoleId])
  @@map("custom_role_activities")
}

enum CustomRoleAction {
  ROLE_CREATED
  ROLE_UPDATED
  ROLE_DELETED
  ROLE_DEACTIVATED
  ROLE_REACTIVATED
  PERMISSIONS_CHANGED
  LIMIT_CHANGED
  ROLE_ASSIGNED
  ROLE_UNASSIGNED
}
```

### 5. Update User Model (Add Relations)

```prisma
// In prisma/schema.prisma - Add new relations to User model

model User {
  // ... existing fields and relations ...
  
  // Custom role management relations (NEW)
  createdCustomRoles    CustomRole[]   @relation("CreatedCustomRoles")
  modifiedCustomRoles   CustomRole[]   @relation("ModifiedCustomRoles")
  approvedCustomRoles   CustomRole[]   @relation("ApprovedCustomRoles")
  customRoleActivities  CustomRoleActivity[]
  platformSettingsUpdates PlatformSettings[]
  
  // ... rest of model ...
}
```

### Complete Migration SQL

```sql
-- Migration: add_custom_role_management
-- Description: Add custom role limits and tracking

-- 1. Add customRoleLimit to Store
ALTER TABLE "Store" ADD COLUMN "customRoleLimit" INTEGER NOT NULL DEFAULT 5;

-- 2. Add tracking fields to CustomRole
ALTER TABLE "custom_roles" ADD COLUMN "createdById" TEXT;
ALTER TABLE "custom_roles" ADD COLUMN "lastModifiedById" TEXT;
ALTER TABLE "custom_roles" ADD COLUMN "lastModifiedAt" TIMESTAMP;

-- 3. Create PlatformSettings table
CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "defaultCustomRoleLimit" INTEGER NOT NULL DEFAULT 5,
    "maxCustomRoleLimit" INTEGER NOT NULL DEFAULT 20,
    "customRoleLimitsByPlan" TEXT NOT NULL DEFAULT '{"FREE": 3, "BASIC": 5, "PRO": 10, "ENTERPRISE": 20}',
    "updatedAt" TIMESTAMP NOT NULL,
    "updatedById" TEXT,
    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- 4. Create CustomRoleActivity table
CREATE TABLE "custom_role_activities" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "customRoleId" TEXT,
    "storeId" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "details" TEXT,
    "previousValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "custom_role_activities_pkey" PRIMARY KEY ("id")
);

-- 5. Create indexes
CREATE INDEX "custom_role_activities_storeId_createdAt_idx" ON "custom_role_activities"("storeId", "createdAt");
CREATE INDEX "custom_role_activities_actorId_createdAt_idx" ON "custom_role_activities"("actorId", "createdAt");
CREATE INDEX "custom_role_activities_customRoleId_idx" ON "custom_role_activities"("customRoleId");

-- 6. Add foreign keys
ALTER TABLE "custom_roles" ADD CONSTRAINT "custom_roles_createdById_fkey" 
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "custom_roles" ADD CONSTRAINT "custom_roles_lastModifiedById_fkey" 
    FOREIGN KEY ("lastModifiedById") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_updatedById_fkey" 
    FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "custom_role_activities" ADD CONSTRAINT "custom_role_activities_actorId_fkey" 
    FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "custom_role_activities" ADD CONSTRAINT "custom_role_activities_customRoleId_fkey" 
    FOREIGN KEY ("customRoleId") REFERENCES "custom_roles"("id") ON DELETE SET NULL;
ALTER TABLE "custom_role_activities" ADD CONSTRAINT "custom_role_activities_storeId_fkey" 
    FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE;

-- 7. Insert default platform settings
INSERT INTO "platform_settings" ("id", "updatedAt") VALUES ('global', CURRENT_TIMESTAMP);
```

---

## API Endpoints

### Store Owner Endpoints

#### 1. List Custom Roles for Store

```typescript
// GET /api/stores/[storeId]/custom-roles
// Response
{
  "roles": [
    {
      "id": "role_123",
      "name": "Product Manager",
      "description": "Manages products and inventory",
      "permissions": ["products:read", "products:create", "products:update", "inventory:read"],
      "isActive": true,
      "staffCount": 3,
      "createdAt": "2025-01-15T10:00:00Z",
      "createdBy": { "id": "user_1", "name": "John Doe" }
    }
  ],
  "usage": {
    "current": 3,
    "limit": 5,
    "remaining": 2
  }
}
```

#### 2. Create Custom Role (Direct - No Approval)

```typescript
// POST /api/stores/[storeId]/custom-roles
// Request
{
  "name": "Senior Sales Rep",
  "description": "Senior sales with full order access",
  "permissions": [
    "orders:read",
    "orders:create",
    "orders:update",
    "customers:read",
    "customers:update",
    "products:read"
  ]
}

// Response (201 Created)
{
  "success": true,
  "role": {
    "id": "role_456",
    "name": "Senior Sales Rep",
    "description": "Senior sales with full order access",
    "permissions": ["orders:read", "orders:create", "orders:update", "customers:read", "customers:update", "products:read"],
    "isActive": true,
    "createdAt": "2025-12-02T10:00:00Z"
  },
  "usage": {
    "current": 4,
    "limit": 5,
    "remaining": 1
  }
}

// Error Response (403 - Limit Exceeded)
{
  "error": "Custom role limit reached",
  "message": "Your store has reached the maximum of 5 custom roles. Please delete an existing role or contact support to increase your limit.",
  "usage": {
    "current": 5,
    "limit": 5,
    "remaining": 0
  }
}
```

#### 3. Update Custom Role

```typescript
// PATCH /api/stores/[storeId]/custom-roles/[roleId]
// Request
{
  "name": "Senior Sales Rep Updated",
  "description": "Updated description",
  "permissions": ["orders:read", "orders:create", "orders:update", "orders:cancel"]
}

// Response
{
  "success": true,
  "role": { /* updated role */ }
}
```

#### 4. Delete Custom Role

```typescript
// DELETE /api/stores/[storeId]/custom-roles/[roleId]
// Query params: ?force=true (to remove from staff first)

// Success Response
{
  "success": true,
  "message": "Custom role deleted successfully"
}

// Error Response (400 - Role in use)
{
  "error": "Role is currently assigned to staff members",
  "staffCount": 3,
  "message": "Remove role from staff members first, or use ?force=true to unassign automatically"
}
```

#### 5. Assign Custom Role to Staff

```typescript
// PATCH /api/stores/[storeId]/staff/[staffId]
// Request
{
  "customRoleId": "role_456"  // Set custom role
}
// OR
{
  "role": "SALES_REP"  // Set predefined role (clears customRoleId)
}
```

### Super Admin Endpoints

#### 6. Get Custom Roles Dashboard Overview

```typescript
// GET /api/admin/custom-roles/dashboard
// Response
{
  "summary": {
    "totalCustomRoles": 47,
    "totalStoresWithRoles": 15,
    "averageRolesPerStore": 3.1,
    "storesAtLimit": 2,
    "storesOverLimit": 0
  },
  "topStores": [
    {
      "storeId": "store_1",
      "storeName": "TechMart",
      "organizationName": "TechMart Inc",
      "customRoleCount": 8,
      "limit": 10,
      "staffWithCustomRoles": 12
    }
  ],
  "topPermissions": [
    { "permission": "orders:read", "usage": 35, "percentage": 74 },
    { "permission": "products:read", "usage": 32, "percentage": 68 }
  ],
  "recentActivity": [
    {
      "action": "ROLE_CREATED",
      "storeName": "TechMart",
      "roleName": "Warehouse Lead",
      "actor": "John Doe",
      "createdAt": "2025-12-02T09:30:00Z"
    }
  ]
}
```

#### 7. List All Stores with Custom Role Stats

```typescript
// GET /api/admin/custom-roles/stores
// Query params: ?search=tech&sortBy=roleCount&order=desc&page=1&limit=20

// Response
{
  "stores": [
    {
      "id": "store_1",
      "name": "TechMart",
      "slug": "techmart",
      "organizationName": "TechMart Inc",
      "subscriptionPlan": "PRO",
      "customRoles": {
        "count": 8,
        "limit": 10,
        "remaining": 2,
        "percentageUsed": 80
      },
      "staffWithCustomRoles": 12,
      "totalStaff": 20,
      "roles": [
        {
          "id": "role_1",
          "name": "Product Manager",
          "staffCount": 3,
          "permissionCount": 8,
          "isActive": true
        }
      ]
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

#### 8. Get Store Custom Role Details

```typescript
// GET /api/admin/custom-roles/stores/[storeId]
// Response
{
  "store": {
    "id": "store_1",
    "name": "TechMart",
    "slug": "techmart",
    "organization": {
      "id": "org_1",
      "name": "TechMart Inc",
      "owner": { "id": "user_1", "name": "John Doe", "email": "john@techmart.com" }
    },
    "subscriptionPlan": "PRO",
    "customRoleLimit": 10,
    "createdAt": "2025-01-01T00:00:00Z"
  },
  "customRoles": [
    {
      "id": "role_1",
      "name": "Product Manager",
      "description": "Manages products and inventory",
      "permissions": ["products:read", "products:create", "products:update", "inventory:read"],
      "isActive": true,
      "createdAt": "2025-01-15T10:00:00Z",
      "createdBy": { "id": "user_1", "name": "John Doe" },
      "staff": [
        { "id": "staff_1", "user": { "name": "Alice", "email": "alice@techmart.com" } },
        { "id": "staff_2", "user": { "name": "Bob", "email": "bob@techmart.com" } }
      ]
    }
  ],
  "activityLog": [
    {
      "action": "ROLE_CREATED",
      "roleName": "Product Manager",
      "actor": { "name": "John Doe" },
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ]
}
```

#### 9. Update Store Custom Role Limit

```typescript
// PATCH /api/admin/custom-roles/stores/[storeId]/limit
// Request
{
  "limit": 15,
  "reason": "Requested by store owner for team expansion"
}

// Response
{
  "success": true,
  "store": {
    "id": "store_1",
    "name": "TechMart",
    "previousLimit": 10,
    "newLimit": 15
  },
  "message": "Custom role limit updated successfully"
}

// Error Response (400 - Exceeds maximum)
{
  "error": "Limit exceeds platform maximum",
  "message": "The maximum allowed custom role limit is 20. Current platform limit is set to 20.",
  "maxAllowed": 20
}
```

#### 10. Get/Update Platform Settings

```typescript
// GET /api/admin/platform-settings
// Response
{
  "settings": {
    "defaultCustomRoleLimit": 5,
    "maxCustomRoleLimit": 20,
    "customRoleLimitsByPlan": {
      "FREE": 3,
      "BASIC": 5,
      "PRO": 10,
      "ENTERPRISE": 20
    }
  }
}

// PATCH /api/admin/platform-settings
// Request
{
  "defaultCustomRoleLimit": 5,
  "maxCustomRoleLimit": 25,
  "customRoleLimitsByPlan": {
    "FREE": 3,
    "BASIC": 5,
    "PRO": 15,
    "ENTERPRISE": 25
  }
}
```

#### 11. Bulk Update Store Limits by Plan

```typescript
// POST /api/admin/custom-roles/bulk-update-limits
// Request
{
  "applyPlanDefaults": true  // Apply limits based on subscription plan
}
// OR
{
  "storeIds": ["store_1", "store_2"],
  "limit": 10
}

// Response
{
  "success": true,
  "updated": 15,
  "details": [
    { "storeId": "store_1", "previousLimit": 5, "newLimit": 10 }
  ]
}
```

---

## UI Components

### File Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── custom-roles/
│   │   │   ├── page.tsx                    # Dashboard overview
│   │   │   ├── stores/
│   │   │   │   ├── page.tsx                # List all stores with role stats
│   │   │   │   └── [storeId]/
│   │   │   │       └── page.tsx            # Store detail with roles
│   │   │   └── settings/
│   │   │       └── page.tsx                # Platform settings
│   │   └── ...
│   │
│   └── dashboard/
│       └── stores/
│           └── [storeId]/
│               └── roles/
│                   ├── page.tsx            # Store roles management
│                   ├── create/
│                   │   └── page.tsx        # Create new role
│                   └── [roleId]/
│                       └── page.tsx        # Edit role
│
└── components/
    ├── admin/
    │   └── custom-roles/
    │       ├── custom-roles-dashboard.tsx      # Overview stats
    │       ├── stores-roles-list.tsx           # Stores with role counts
    │       ├── store-roles-detail.tsx          # Single store detail
    │       ├── role-limit-editor.tsx           # Adjust limit dialog
    │       ├── platform-settings-form.tsx      # Global settings
    │       └── roles-activity-log.tsx          # Activity history
    │
    └── store/
        └── roles/
            ├── custom-roles-list.tsx           # Store owner's role list
            ├── create-role-form.tsx            # Create role form
            ├── edit-role-form.tsx              # Edit role form
            ├── permission-picker.tsx           # Permission selection UI
            ├── role-usage-indicator.tsx        # Show usage/limit
            ├── role-staff-list.tsx             # Staff using this role
            └── assign-role-dialog.tsx          # Assign role to staff
```

### Store Owner UI Components

#### 1. Custom Roles List Page

```tsx
// src/app/dashboard/stores/[storeId]/roles/page.tsx

/**
 * Store Custom Roles Management Page
 * 
 * Features:
 * - List all custom roles for this store
 * - Show usage indicator (X of Y roles used)
 * - Create new role button (disabled if at limit)
 * - Edit/Delete actions for each role
 * - Staff count per role
 */

import { CustomRolesList } from "@/components/store/roles/custom-roles-list";
import { RoleUsageIndicator } from "@/components/store/roles/role-usage-indicator";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function StoreRolesPage({ 
  params 
}: { 
  params: Promise<{ storeId: string }> 
}) {
  const { storeId } = await params;
  
  // Fetch roles and usage from API
  const response = await fetch(`/api/stores/${storeId}/custom-roles`, {
    cache: 'no-store'
  });
  const { roles, usage } = await response.json();
  
  const canCreateMore = usage.remaining > 0;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Custom Roles</h1>
          <p className="text-muted-foreground">
            Create and manage custom roles for your staff
          </p>
        </div>
        <div className="flex items-center gap-4">
          <RoleUsageIndicator 
            current={usage.current} 
            limit={usage.limit} 
          />
          <Button 
            asChild 
            disabled={!canCreateMore}
            title={!canCreateMore ? "Role limit reached" : undefined}
          >
            <Link href={`/dashboard/stores/${storeId}/roles/create`}>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Roles List */}
      <CustomRolesList roles={roles} storeId={storeId} />
    </div>
  );
}
```

#### 2. Role Usage Indicator Component

```tsx
// src/components/store/roles/role-usage-indicator.tsx

"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RoleUsageIndicatorProps {
  current: number;
  limit: number;
}

export function RoleUsageIndicator({ current, limit }: RoleUsageIndicatorProps) {
  const percentage = (current / limit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = current >= limit;
  
  return (
    <div className="flex items-center gap-3">
      <div className="w-32">
        <Progress 
          value={percentage} 
          className={cn(
            "h-2",
            isAtLimit && "bg-destructive/20",
            isNearLimit && !isAtLimit && "bg-amber-100"
          )}
        />
      </div>
      <Badge 
        variant={isAtLimit ? "destructive" : isNearLimit ? "warning" : "secondary"}
      >
        {current} / {limit} roles
      </Badge>
    </div>
  );
}
```

#### 3. Create Role Form

```tsx
// src/components/store/roles/create-role-form.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionPicker } from "./permission-picker";
import { RoleTemplateSelector } from "./role-template-selector";
import { toast } from "sonner";
import { AVAILABLE_PERMISSIONS, SUGGESTED_ROLE_TEMPLATES } from "@/lib/custom-role-permissions";

interface CreateRoleFormProps {
  storeId: string;
  remainingSlots: number;
}

export function CreateRoleForm({ storeId, remainingSlots }: CreateRoleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  
  const handleTemplateSelect = (templateName: string) => {
    const template = SUGGESTED_ROLE_TEMPLATES[templateName as keyof typeof SUGGESTED_ROLE_TEMPLATES];
    if (template) {
      setName(templateName);
      setSelectedPermissions(template);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedPermissions.length === 0) {
      toast.error("Please select at least one permission");
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`/api/stores/${storeId}/custom-roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          permissions: selectedPermissions,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to create role");
      }
      
      toast.success(`Custom role "${name}" created successfully`);
      router.push(`/dashboard/stores/${storeId}/roles`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create role");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Role Details */}
      <Card>
        <CardHeader>
          <CardTitle>Role Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Role Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Senior Sales Rep"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this role is for..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Template Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Start from Template (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <RoleTemplateSelector onSelect={handleTemplateSelect} />
        </CardContent>
      </Card>
      
      {/* Permission Picker */}
      <Card>
        <CardHeader>
          <CardTitle>
            Permissions *
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({selectedPermissions.length} selected)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PermissionPicker
            categories={AVAILABLE_PERMISSIONS}
            selected={selectedPermissions}
            onChange={setSelectedPermissions}
          />
        </CardContent>
      </Card>
      
      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !name || selectedPermissions.length === 0}>
          {loading ? "Creating..." : "Create Role"}
        </Button>
      </div>
    </form>
  );
}
```

### Super Admin UI Components

#### 4. Custom Roles Dashboard

```tsx
// src/app/admin/custom-roles/page.tsx

/**
 * Super Admin Custom Roles Dashboard
 * 
 * Shows:
 * - Total custom roles across platform
 * - Stores with most custom roles
 * - Most commonly used permissions
 * - Stores at/over limit warnings
 * - Recent activity
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Users, 
  Shield, 
  Store, 
  AlertTriangle,
  Settings,
  TrendingUp
} from "lucide-react";

export default async function AdminCustomRolesDashboard() {
  // Fetch dashboard data from API
  const response = await fetch('/api/admin/custom-roles/dashboard', {
    cache: 'no-store'
  });
  const data = await response.json();
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Custom Roles Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage custom roles across all stores
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/custom-roles/settings">
            <Settings className="h-4 w-4 mr-2" />
            Platform Settings
          </Link>
        </Button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Custom Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalCustomRoles}</div>
            <p className="text-xs text-muted-foreground">
              Across {data.summary.totalStoresWithRoles} stores
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average per Store</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.averageRolesPerStore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Custom roles per store
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stores at Limit</CardTitle>
            <Store className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.storesAtLimit}</div>
            <p className="text-xs text-muted-foreground">
              Using all available slots
            </p>
          </CardContent>
        </Card>
        
        {data.summary.storesOverLimit > 0 && (
          <Card className="border-destructive">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-destructive">Over Limit</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {data.summary.storesOverLimit}
              </div>
              <p className="text-xs text-muted-foreground">
                Stores exceeding limit
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Top Stores */}
      <Card>
        <CardHeader>
          <CardTitle>Stores with Most Custom Roles</CardTitle>
          <CardDescription>Top 5 stores by custom role count</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topStores.map((store: any) => (
              <div 
                key={store.storeId}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <Link 
                    href={`/admin/custom-roles/stores/${store.storeId}`}
                    className="font-medium hover:underline"
                  >
                    {store.storeName}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {store.organizationName}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">
                    {store.staffWithCustomRoles} staff
                  </Badge>
                  <Badge 
                    variant={store.customRoleCount >= store.limit ? "destructive" : "outline"}
                  >
                    {store.customRoleCount} / {store.limit} roles
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Button asChild variant="outline">
              <Link href="/admin/custom-roles/stores">
                View All Stores
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Most Used Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Most Used Permissions</CardTitle>
          <CardDescription>Permissions most commonly assigned to custom roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.topPermissions.slice(0, 10).map((perm: any) => (
              <div 
                key={perm.permission}
                className="flex items-center justify-between"
              >
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {perm.permission}
                </code>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary rounded-full h-2"
                      style={{ width: `${perm.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12">
                    {perm.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 5. Store Role Limit Editor

```tsx
// src/components/admin/custom-roles/role-limit-editor.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Settings } from "lucide-react";

interface RoleLimitEditorProps {
  storeId: string;
  storeName: string;
  currentLimit: number;
  currentUsage: number;
  maxAllowed: number;
}

export function RoleLimitEditor({
  storeId,
  storeName,
  currentLimit,
  currentUsage,
  maxAllowed,
}: RoleLimitEditorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState(currentLimit);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async () => {
    if (limit < currentUsage) {
      toast.error(`Limit cannot be less than current usage (${currentUsage})`);
      return;
    }
    
    if (limit > maxAllowed) {
      toast.error(`Limit cannot exceed platform maximum (${maxAllowed})`);
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`/api/admin/custom-roles/stores/${storeId}/limit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit, reason }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update limit");
      }
      
      toast.success(`Custom role limit updated to ${limit}`);
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update limit");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Adjust Limit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Custom Role Limit</DialogTitle>
          <DialogDescription>
            Change the maximum number of custom roles for {storeName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Current Usage:</span>
            <span className="font-medium">{currentUsage} roles</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Platform Maximum:</span>
            <span className="font-medium">{maxAllowed} roles</span>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="limit">New Limit</Label>
            <Input
              id="limit"
              type="number"
              min={currentUsage}
              max={maxAllowed}
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              Must be at least {currentUsage} (current usage) and at most {maxAllowed} (platform max)
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Change</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this limit being changed?"
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Updating..." : "Update Limit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Implementation Phases

### Phase 1: Database Schema (Day 1-2)

| Task | Priority | Effort |
|------|----------|--------|
| Add `customRoleLimit` field to Store model | High | 1h |
| Add creator/modifier tracking to CustomRole | High | 1h |
| Create PlatformSettings model | High | 1h |
| Create CustomRoleActivity model | High | 1h |
| Add User relations | Medium | 30m |
| Run migration | High | 30m |
| Add seed data for platform settings | Medium | 30m |

**Total: ~6 hours**

### Phase 2: Core API Endpoints (Day 2-4)

| Task | Priority | Effort |
|------|----------|--------|
| `POST /api/stores/[storeId]/custom-roles` - Create role (with limit check) | High | 2h |
| `GET /api/stores/[storeId]/custom-roles` - List roles with usage | High | 1h |
| `PATCH /api/stores/[storeId]/custom-roles/[roleId]` - Update role | High | 1h |
| `DELETE /api/stores/[storeId]/custom-roles/[roleId]` - Delete role | High | 1h |
| `GET /api/admin/custom-roles/dashboard` - Admin dashboard data | High | 2h |
| `GET /api/admin/custom-roles/stores` - List stores with stats | High | 2h |
| `GET /api/admin/custom-roles/stores/[storeId]` - Store detail | High | 1h |
| `PATCH /api/admin/custom-roles/stores/[storeId]/limit` - Update limit | High | 1h |
| `GET/PATCH /api/admin/platform-settings` - Platform settings | Medium | 1h |
| Activity logging in all endpoints | Medium | 2h |

**Total: ~14 hours**

### Phase 3: Store Owner UI (Day 4-6)

| Task | Priority | Effort |
|------|----------|--------|
| Custom roles list page | High | 2h |
| Role usage indicator component | High | 1h |
| Create role form with permission picker | High | 3h |
| Edit role page | High | 2h |
| Delete role confirmation | High | 1h |
| Assign role to staff integration | High | 2h |
| Role templates selector | Medium | 1h |

**Total: ~12 hours**

### Phase 4: Super Admin UI (Day 6-8)

| Task | Priority | Effort |
|------|----------|--------|
| Custom roles dashboard page | High | 3h |
| Stores list with role stats | High | 2h |
| Store detail with roles | High | 2h |
| Role limit editor dialog | High | 2h |
| Platform settings page | High | 2h |
| Bulk update functionality | Medium | 2h |
| Activity log viewer | Medium | 2h |
| Add sidebar navigation | Low | 30m |

**Total: ~15 hours**

### Phase 5: Testing & Polish (Day 8-9)

| Task | Priority | Effort |
|------|----------|--------|
| Unit tests for limit enforcement | High | 2h |
| Integration tests for workflows | High | 2h |
| Permission validation tests | High | 1h |
| UI/UX testing and fixes | High | 2h |
| Error handling improvements | Medium | 1h |
| Loading states and feedback | Medium | 1h |
| Documentation updates | Low | 1h |

**Total: ~10 hours**

---

## Security Considerations

### 1. Authorization Checks

```typescript
// Every custom role operation must verify:

// Store Owner Actions
async function canManageStoreRoles(userId: string, storeId: string): Promise<boolean> {
  // Check if user is store owner (OWNER membership)
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      organization: { stores: { some: { id: storeId } } },
      role: 'OWNER',
    },
  });
  return !!membership;
}

// Or has STORE_ADMIN role with staff:manage permission
async function canManageStaff(userId: string, storeId: string): Promise<boolean> {
  const staff = await prisma.storeStaff.findFirst({
    where: {
      userId,
      storeId,
      isActive: true,
      OR: [
        { role: 'STORE_ADMIN' },
        { customRole: { permissions: { contains: 'staff:manage' } } },
      ],
    },
  });
  return !!staff;
}
```

### 2. Limit Enforcement

```typescript
// Always check limit before creating role
async function checkRoleLimit(storeId: string): Promise<{ 
  allowed: boolean; 
  current: number; 
  limit: number;
}> {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { 
      customRoleLimit: true,
      _count: { select: { customRoles: { where: { isActive: true } } } }
    },
  });
  
  const current = store?._count.customRoles ?? 0;
  const limit = store?.customRoleLimit ?? 5;
  
  return {
    allowed: current < limit,
    current,
    limit,
  };
}
```

### 3. Permission Validation

```typescript
// Validate permissions on create/update
import { validatePermissions } from '@/lib/custom-role-permissions';

async function validateRolePermissions(permissions: string[]) {
  const { valid, errors, invalidPermissions } = validatePermissions(permissions);
  
  if (!valid) {
    throw new Error(`Invalid permissions: ${invalidPermissions.join(', ')}`);
  }
}
```

### 4. Audit Trail

```typescript
// Log all custom role actions
async function logRoleActivity({
  action,
  actorId,
  storeId,
  customRoleId,
  roleName,
  previousValue,
  newValue,
  details,
}: {
  action: CustomRoleAction;
  actorId: string;
  storeId: string;
  customRoleId?: string;
  roleName: string;
  previousValue?: string;
  newValue?: string;
  details?: Record<string, any>;
}) {
  await prisma.customRoleActivity.create({
    data: {
      action,
      actorId,
      storeId,
      customRoleId,
      roleName,
      previousValue,
      newValue,
      details: details ? JSON.stringify(details) : null,
    },
  });
}
```

---

## Testing Checklist

### Store Owner Tests

- [ ] Create custom role within limit
- [ ] Cannot create role when at limit
- [ ] Edit custom role permissions
- [ ] Delete unused custom role
- [ ] Cannot delete role assigned to staff (without force)
- [ ] Assign custom role to staff member
- [ ] Change staff from predefined to custom role
- [ ] Role usage indicator updates correctly

### Super Admin Tests

- [ ] View dashboard with correct statistics
- [ ] List all stores with role counts
- [ ] View single store's custom roles
- [ ] Adjust store's custom role limit
- [ ] Cannot set limit below current usage
- [ ] Cannot exceed platform maximum
- [ ] Update platform settings
- [ ] Bulk update limits by subscription plan
- [ ] View activity log

### Edge Cases

- [ ] Concurrent role creation (race condition)
- [ ] Store deleted with custom roles
- [ ] User deleted who created roles
- [ ] Permission removed from available list
- [ ] Limit reduced below current usage (reject)

---

## Summary

### What This Implementation Provides

1. **Store Owners Can:**
   - Create custom roles with any combination of allowed permissions
   - Edit and delete their custom roles
   - Assign custom roles to their staff
   - See their current usage vs. limit

2. **Super Admins Can:**
   - View all custom roles across all stores
   - See which stores have the most roles
   - See most commonly used permissions
   - Adjust individual store limits
   - Set default limits by subscription plan
   - View complete activity history

3. **System Guarantees:**
   - Stores cannot exceed their custom role limit
   - All changes are audited
   - Permissions are validated against allowed list
   - Proper authorization on all endpoints

### Estimated Total Time: ~57 hours (7-8 days)

---

**Document Version:** 1.0  
**Created:** December 2, 2025  
**Status:** Ready for Implementation
