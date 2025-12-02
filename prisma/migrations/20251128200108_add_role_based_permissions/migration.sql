-- DropIndex
DROP INDEX "Category_storeId_slug_idx";

-- DropIndex
DROP INDEX "Category_slug_idx";

-- DropIndex
DROP INDEX "Customer_email_storeId_idx";

-- DropIndex
DROP INDEX "Customer_storeId_email_idx";

-- DropIndex
DROP INDEX "Order_customerId_createdAt_idx";

-- DropIndex
DROP INDEX "Order_paymentStatus_idx";

-- DropIndex
DROP INDEX "Order_orderNumber_idx";

-- DropIndex
DROP INDEX "ProductAttribute_name_idx";

-- CreateTable
CREATE TABLE "StoreStaff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StoreStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StoreStaff_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InventoryLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "orderId" TEXT,
    "previousQty" INTEGER NOT NULL,
    "newQty" INTEGER NOT NULL,
    "changeQty" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryLog_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InventoryLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InventoryLog_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InventoryLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_InventoryLog" ("changeQty", "createdAt", "id", "newQty", "note", "previousQty", "productId", "reason", "storeId", "userId") SELECT "changeQty", "createdAt", "id", "newQty", "note", "previousQty", "productId", "reason", "storeId", "userId" FROM "InventoryLog";
DROP TABLE "InventoryLog";
ALTER TABLE "new_InventoryLog" RENAME TO "InventoryLog";
CREATE INDEX "InventoryLog_storeId_productId_createdAt_idx" ON "InventoryLog"("storeId", "productId", "createdAt");
CREATE INDEX "InventoryLog_productId_createdAt_idx" ON "InventoryLog"("productId", "createdAt");
CREATE INDEX "InventoryLog_variantId_createdAt_idx" ON "InventoryLog"("variantId", "createdAt");
CREATE INDEX "InventoryLog_orderId_idx" ON "InventoryLog"("orderId");
CREATE INDEX "InventoryLog_userId_createdAt_idx" ON "InventoryLog"("userId", "createdAt");
CREATE INDEX "InventoryLog_reason_idx" ON "InventoryLog"("reason");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "passwordHash" TEXT,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "emailVerified", "id", "image", "name", "passwordHash", "updatedAt") SELECT "createdAt", "email", "emailVerified", "id", "image", "name", "passwordHash", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "StoreStaff_storeId_isActive_idx" ON "StoreStaff"("storeId", "isActive");

-- CreateIndex
CREATE INDEX "StoreStaff_userId_isActive_idx" ON "StoreStaff"("userId", "isActive");

-- CreateIndex
CREATE INDEX "StoreStaff_storeId_role_idx" ON "StoreStaff"("storeId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "StoreStaff_userId_storeId_key" ON "StoreStaff"("userId", "storeId");

-- CreateIndex
CREATE INDEX "Order_storeId_customerId_createdAt_idx" ON "Order"("storeId", "customerId", "createdAt");
