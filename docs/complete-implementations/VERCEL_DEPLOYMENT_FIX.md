# Vercel Deployment Fix - PostgreSQL Schema Sync

## Issue
Vercel deployment failed with the following error:
```
Type error: Module '"@prisma/client"' has no exported member 'AuditLog'.
```

## Root Cause Analysis

The codebase maintains two Prisma schema files:
1. `prisma/schema.sqlite.prisma` - For local development (SQLite)
2. `prisma/schema.postgres.prisma` - For production deployments (PostgreSQL)

The PostgreSQL schema was **out of sync** with the SQLite schema. Specifically, it was missing:
- `AuditLog` model (26 lines)
- `InventoryLog` model (21 lines)
- Related relations in User, Store, and Product models

When Vercel built the application using the PostgreSQL schema, the Prisma client generated didn't include the `AuditLog` and `InventoryLog` types, causing the TypeScript compilation to fail.

## Files Affected

### Service Files Using AuditLog
- `src/lib/services/audit-log.service.ts` - Imports `AuditLog` type from `@prisma/client`

### Service Files Using InventoryLog
- `src/lib/services/inventory.service.ts` - Uses `InventoryLog` for tracking inventory changes

## Solution

### 1. Added InventoryLog Model
```prisma
model InventoryLog {
  id          String   @id @default(cuid())
  storeId     String
  productId   String
  product     Product  @relation("InventoryLogs", fields: [productId], references: [id], onDelete: Cascade)
  
  previousQty Int
  newQty      Int
  changeQty   Int
  reason      String
  note        String?
  
  userId      String?
  user        User?    @relation("InventoryUserLogs", fields: [userId], references: [id], onDelete: SetNull)
  
  createdAt   DateTime @default(now())
  
  @@index([storeId, productId, createdAt])
  @@index([productId, createdAt])
  @@index([userId, createdAt])
}
```

### 2. Added AuditLog Model
```prisma
model AuditLog {
  id        String   @id @default(cuid())
  storeId   String?
  store     Store?   @relation(fields: [storeId], references: [id], onDelete: Cascade)

  userId    String?
  user      User?    @relation("AuditUserLogs", fields: [userId], references: [id], onDelete: SetNull)

  action    String   // e.g., "CREATE", "UPDATE", "DELETE"
  entityType String  // e.g., "Product", "Order", "User"
  entityId  String
  
  changes   String?  // JSON { "field": { "old": "value", "new": "value" } }
  
  ipAddress String?
  userAgent String?

  createdAt DateTime @default(now())

  @@index([storeId, createdAt])
  @@index([userId, createdAt])
  @@index([entityType, entityId, createdAt])
  @@map("audit_logs")
}
```

### 3. Added Missing Relations

**User Model:**
```prisma
inventoryLogs InventoryLog[] @relation("InventoryUserLogs")
auditLogs     AuditLog[]     @relation("AuditUserLogs")
```

**Store Model:**
```prisma
auditLogs AuditLog[]
```

**Product Model:**
```prisma
inventoryLogs InventoryLog[] @relation("InventoryLogs")
```

## Verification

### Before Fix:
- PostgreSQL schema: **19 models**
- SQLite schema: **21 models**
- ❌ Schemas out of sync

### After Fix:
- PostgreSQL schema: **21 models** ✅
- SQLite schema: **21 models** ✅
- ✅ Schemas in sync

## Deployment Notes

1. **Automatic Migration:** When Vercel deploys, it will automatically run `prisma migrate deploy` which will create the new tables
2. **No Data Loss:** New tables are being added, no existing data is modified
3. **Backward Compatible:** The changes are additive only

## Prevention

To prevent schema drift in the future:
1. Always update **both** schema files when adding new models
2. Run validation on both schemas in CI/CD
3. Consider using a single schema with conditional configuration
4. Add a pre-commit hook to check schema parity

## Commit

- **Hash:** `6ac6cc6`
- **Message:** Fix Vercel deployment: Add missing AuditLog and InventoryLog models to PostgreSQL schema
- **Files Changed:** `prisma/schema.postgres.prisma` (+55 lines)
