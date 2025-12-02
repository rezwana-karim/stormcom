/*
  Warnings:

  - You are about to alter the column `allowed` on the `audit_logs` table. The data in that column could be lost. The data in that column will be cast from `Boolean` to `Int`.

*/
-- DropIndex
DROP INDEX "Customer_storeId_email_idx";

-- DropIndex
DROP INDEX "Order_paymentStatus_idx";

-- DropIndex
DROP INDEX "Order_orderNumber_idx";

-- DropIndex
DROP INDEX "ProductAttribute_name_idx";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "estimatedDelivery" DATETIME;
ALTER TABLE "Order" ADD COLUMN "notes" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "archivedAt" DATETIME;
ALTER TABLE "Product" ADD COLUMN "seoDescription" TEXT;
ALTER TABLE "Product" ADD COLUMN "seoTitle" TEXT;

-- CreateTable
CREATE TABLE "custom_role_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "roleDescription" TEXT,
    "permissions" TEXT NOT NULL,
    "justification" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "rejectionReason" TEXT,
    "adminNotes" TEXT,
    "modifiedPermissions" TEXT,
    "customRoleId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "custom_role_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "custom_role_requests_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "custom_role_requests_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "custom_role_requests_customRoleId_fkey" FOREIGN KEY ("customRoleId") REFERENCES "custom_roles" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "custom_roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "custom_roles_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "actionUrl" TEXT,
    "actionLabel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "platform_activities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT,
    "targetUserId" TEXT,
    "storeId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "platform_activities_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "platform_activities_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "platform_activities_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "store_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "storeSlug" TEXT,
    "storeDescription" TEXT,
    "businessName" TEXT,
    "businessCategory" TEXT,
    "businessAddress" TEXT,
    "businessPhone" TEXT,
    "businessEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "rejectionReason" TEXT,
    "createdStoreId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "store_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "store_requests_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "store_requests_createdStoreId_fkey" FOREIGN KEY ("createdStoreId") REFERENCES "Store" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StoreStaff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "role" TEXT,
    "customRoleId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "invitedBy" TEXT,
    "invitedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StoreStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StoreStaff_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StoreStaff_customRoleId_fkey" FOREIGN KEY ("customRoleId") REFERENCES "custom_roles" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_StoreStaff" ("createdAt", "id", "isActive", "role", "storeId", "updatedAt", "userId") SELECT "createdAt", "id", "isActive", "role", "storeId", "updatedAt", "userId" FROM "StoreStaff";
DROP TABLE "StoreStaff";
ALTER TABLE "new_StoreStaff" RENAME TO "StoreStaff";
CREATE INDEX "StoreStaff_storeId_isActive_idx" ON "StoreStaff"("storeId", "isActive");
CREATE INDEX "StoreStaff_userId_isActive_idx" ON "StoreStaff"("userId", "isActive");
CREATE INDEX "StoreStaff_storeId_role_idx" ON "StoreStaff"("storeId", "role");
CREATE INDEX "StoreStaff_customRoleId_idx" ON "StoreStaff"("customRoleId");
CREATE UNIQUE INDEX "StoreStaff_userId_storeId_key" ON "StoreStaff"("userId", "storeId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "passwordHash" TEXT,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "accountStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "statusChangedAt" DATETIME,
    "statusChangedBy" TEXT,
    "rejectionReason" TEXT,
    "businessName" TEXT,
    "businessDescription" TEXT,
    "businessCategory" TEXT,
    "phoneNumber" TEXT,
    "approvedAt" DATETIME,
    "approvedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "emailVerified", "id", "image", "isSuperAdmin", "name", "passwordHash", "updatedAt") SELECT "createdAt", "email", "emailVerified", "id", "image", "isSuperAdmin", "name", "passwordHash", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE TABLE "new_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "permission" TEXT,
    "role" TEXT,
    "allowed" INTEGER,
    "endpoint" TEXT,
    "method" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "changes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_audit_logs" ("action", "allowed", "changes", "createdAt", "endpoint", "entityId", "entityType", "id", "ipAddress", "method", "permission", "role", "storeId", "userAgent", "userId") SELECT "action", "allowed", "changes", "createdAt", "endpoint", "entityId", "entityType", "id", "ipAddress", "method", "permission", "role", "storeId", "userAgent", "userId" FROM "audit_logs";
DROP TABLE "audit_logs";
ALTER TABLE "new_audit_logs" RENAME TO "audit_logs";
CREATE INDEX "audit_logs_storeId_createdAt_idx" ON "audit_logs"("storeId", "createdAt");
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");
CREATE INDEX "audit_logs_entityType_entityId_createdAt_idx" ON "audit_logs"("entityType", "entityId", "createdAt");
CREATE INDEX "audit_logs_permission_allowed_createdAt_idx" ON "audit_logs"("permission", "allowed", "createdAt");
CREATE INDEX "audit_logs_userId_action_createdAt_idx" ON "audit_logs"("userId", "action", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "custom_role_requests_customRoleId_key" ON "custom_role_requests"("customRoleId");

-- CreateIndex
CREATE INDEX "custom_role_requests_userId_status_idx" ON "custom_role_requests"("userId", "status");

-- CreateIndex
CREATE INDEX "custom_role_requests_storeId_status_idx" ON "custom_role_requests"("storeId", "status");

-- CreateIndex
CREATE INDEX "custom_role_requests_status_createdAt_idx" ON "custom_role_requests"("status", "createdAt");

-- CreateIndex
CREATE INDEX "custom_role_requests_reviewedBy_idx" ON "custom_role_requests"("reviewedBy");

-- CreateIndex
CREATE INDEX "custom_roles_storeId_isActive_idx" ON "custom_roles"("storeId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "custom_roles_storeId_name_key" ON "custom_roles"("storeId", "name");

-- CreateIndex
CREATE INDEX "notifications_userId_read_createdAt_idx" ON "notifications"("userId", "read", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_type_createdAt_idx" ON "notifications"("userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "platform_activities_actorId_createdAt_idx" ON "platform_activities"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "platform_activities_targetUserId_createdAt_idx" ON "platform_activities"("targetUserId", "createdAt");

-- CreateIndex
CREATE INDEX "platform_activities_storeId_createdAt_idx" ON "platform_activities"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "platform_activities_action_createdAt_idx" ON "platform_activities"("action", "createdAt");

-- CreateIndex
CREATE INDEX "platform_activities_createdAt_idx" ON "platform_activities"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "store_requests_createdStoreId_key" ON "store_requests"("createdStoreId");

-- CreateIndex
CREATE INDEX "store_requests_userId_status_idx" ON "store_requests"("userId", "status");

-- CreateIndex
CREATE INDEX "store_requests_status_createdAt_idx" ON "store_requests"("status", "createdAt");

-- CreateIndex
CREATE INDEX "store_requests_reviewedBy_idx" ON "store_requests"("reviewedBy");

-- CreateIndex
CREATE INDEX "Order_storeId_customerId_createdAt_idx" ON "Order"("storeId", "customerId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_storeId_status_createdAt_idx" ON "Order"("storeId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Product_storeId_categoryId_status_idx" ON "Product"("storeId", "categoryId", "status");

-- CreateIndex
CREATE INDEX "Product_storeId_createdAt_idx" ON "Product"("storeId", "createdAt");
