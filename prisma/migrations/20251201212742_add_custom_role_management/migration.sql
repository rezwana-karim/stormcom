/*
  Warnings:

  - You are about to drop the column `approvedBy` on the `custom_roles` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
    "defaultCustomRoleLimit" INTEGER NOT NULL DEFAULT 5,
    "maxCustomRoleLimit" INTEGER NOT NULL DEFAULT 20,
    "customRoleLimitsByPlan" TEXT NOT NULL DEFAULT '{"FREE": 3, "BASIC": 5, "PRO": 10, "ENTERPRISE": 20}',
    "updatedAt" DATETIME NOT NULL,
    "updatedById" TEXT,
    CONSTRAINT "platform_settings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "custom_role_activities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "customRoleId" TEXT,
    "storeId" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "details" TEXT,
    "previousValue" TEXT,
    "newValue" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "custom_role_activities_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "custom_role_activities_customRoleId_fkey" FOREIGN KEY ("customRoleId") REFERENCES "custom_roles" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "custom_role_activities_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Store" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "website" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'US',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "subscriptionPlan" TEXT NOT NULL DEFAULT 'FREE',
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'TRIAL',
    "trialEndsAt" DATETIME,
    "subscriptionEndsAt" DATETIME,
    "productLimit" INTEGER NOT NULL DEFAULT 10,
    "orderLimit" INTEGER NOT NULL DEFAULT 100,
    "customRoleLimit" INTEGER NOT NULL DEFAULT 5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Store_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Store" ("address", "city", "country", "createdAt", "currency", "deletedAt", "description", "email", "id", "locale", "logo", "name", "orderLimit", "organizationId", "phone", "postalCode", "productLimit", "slug", "state", "subscriptionEndsAt", "subscriptionPlan", "subscriptionStatus", "timezone", "trialEndsAt", "updatedAt", "website") SELECT "address", "city", "country", "createdAt", "currency", "deletedAt", "description", "email", "id", "locale", "logo", "name", "orderLimit", "organizationId", "phone", "postalCode", "productLimit", "slug", "state", "subscriptionEndsAt", "subscriptionPlan", "subscriptionStatus", "timezone", "trialEndsAt", "updatedAt", "website" FROM "Store";
DROP TABLE "Store";
ALTER TABLE "new_Store" RENAME TO "Store";
CREATE UNIQUE INDEX "Store_organizationId_key" ON "Store"("organizationId");
CREATE UNIQUE INDEX "Store_slug_key" ON "Store"("slug");
CREATE INDEX "Store_slug_idx" ON "Store"("slug");
CREATE INDEX "Store_subscriptionPlan_idx" ON "Store"("subscriptionPlan");
CREATE INDEX "Store_subscriptionStatus_idx" ON "Store"("subscriptionStatus");
CREATE TABLE "new_custom_roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "lastModifiedById" TEXT,
    "lastModifiedAt" DATETIME,
    "approvedById" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "custom_roles_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "custom_roles_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "custom_roles_lastModifiedById_fkey" FOREIGN KEY ("lastModifiedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "custom_roles_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_custom_roles" ("approvedAt", "createdAt", "description", "id", "isActive", "name", "permissions", "storeId", "updatedAt") SELECT "approvedAt", "createdAt", "description", "id", "isActive", "name", "permissions", "storeId", "updatedAt" FROM "custom_roles";
DROP TABLE "custom_roles";
ALTER TABLE "new_custom_roles" RENAME TO "custom_roles";
CREATE INDEX "custom_roles_storeId_isActive_idx" ON "custom_roles"("storeId", "isActive");
CREATE INDEX "custom_roles_createdById_idx" ON "custom_roles"("createdById");
CREATE UNIQUE INDEX "custom_roles_storeId_name_key" ON "custom_roles"("storeId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "custom_role_activities_storeId_createdAt_idx" ON "custom_role_activities"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "custom_role_activities_actorId_createdAt_idx" ON "custom_role_activities"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "custom_role_activities_customRoleId_idx" ON "custom_role_activities"("customRoleId");
