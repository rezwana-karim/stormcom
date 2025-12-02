/*
  Warnings:

  - You are about to drop the `StoreStaff` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `estimatedDelivery` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `archivedAt` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `seoDescription` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `seoTitle` on the `Product` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "StoreStaff_userId_storeId_key";

-- DropIndex
DROP INDEX "StoreStaff_storeId_role_idx";

-- DropIndex
DROP INDEX "StoreStaff_userId_isActive_idx";

-- DropIndex
DROP INDEX "StoreStaff_storeId_isActive_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "StoreStaff";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "customerId" TEXT,
    "orderNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "subtotal" REAL NOT NULL,
    "taxAmount" REAL NOT NULL DEFAULT 0,
    "shippingAmount" REAL NOT NULL DEFAULT 0,
    "discountAmount" REAL NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL,
    "discountCode" TEXT,
    "paymentMethod" TEXT,
    "paymentGateway" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "shippingMethod" TEXT,
    "trackingNumber" TEXT,
    "trackingUrl" TEXT,
    "shippingAddress" TEXT,
    "billingAddress" TEXT,
    "fulfilledAt" DATETIME,
    "canceledAt" DATETIME,
    "cancelReason" TEXT,
    "customerNote" TEXT,
    "adminNote" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("adminNote", "billingAddress", "cancelReason", "canceledAt", "createdAt", "customerId", "customerNote", "deletedAt", "discountAmount", "discountCode", "fulfilledAt", "id", "ipAddress", "orderNumber", "paymentGateway", "paymentMethod", "paymentStatus", "shippingAddress", "shippingAmount", "shippingMethod", "status", "storeId", "subtotal", "taxAmount", "totalAmount", "trackingNumber", "trackingUrl", "updatedAt") SELECT "adminNote", "billingAddress", "cancelReason", "canceledAt", "createdAt", "customerId", "customerNote", "deletedAt", "discountAmount", "discountCode", "fulfilledAt", "id", "ipAddress", "orderNumber", "paymentGateway", "paymentMethod", "paymentStatus", "shippingAddress", "shippingAmount", "shippingMethod", "status", "storeId", "subtotal", "taxAmount", "totalAmount", "trackingNumber", "trackingUrl", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE INDEX "Order_storeId_customerId_idx" ON "Order"("storeId", "customerId");
CREATE INDEX "Order_storeId_status_idx" ON "Order"("storeId", "status");
CREATE INDEX "Order_storeId_createdAt_idx" ON "Order"("storeId", "createdAt");
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");
CREATE UNIQUE INDEX "Order_storeId_orderNumber_key" ON "Order"("storeId", "orderNumber");
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "shortDescription" TEXT,
    "price" REAL NOT NULL,
    "compareAtPrice" REAL,
    "costPrice" REAL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "trackInventory" BOOLEAN NOT NULL DEFAULT true,
    "inventoryQty" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "inventoryStatus" TEXT NOT NULL DEFAULT 'IN_STOCK',
    "weight" REAL,
    "length" REAL,
    "width" REAL,
    "height" REAL,
    "categoryId" TEXT,
    "brandId" TEXT,
    "images" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "metaKeywords" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" DATETIME,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("barcode", "brandId", "categoryId", "compareAtPrice", "costPrice", "createdAt", "deletedAt", "description", "height", "id", "images", "inventoryQty", "inventoryStatus", "isFeatured", "length", "lowStockThreshold", "metaDescription", "metaKeywords", "metaTitle", "name", "price", "publishedAt", "shortDescription", "sku", "slug", "status", "storeId", "thumbnailUrl", "trackInventory", "updatedAt", "weight", "width") SELECT "barcode", "brandId", "categoryId", "compareAtPrice", "costPrice", "createdAt", "deletedAt", "description", "height", "id", "images", "inventoryQty", "inventoryStatus", "isFeatured", "length", "lowStockThreshold", "metaDescription", "metaKeywords", "metaTitle", "name", "price", "publishedAt", "shortDescription", "sku", "slug", "status", "storeId", "thumbnailUrl", "trackInventory", "updatedAt", "weight", "width" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE INDEX "Product_storeId_status_idx" ON "Product"("storeId", "status");
CREATE INDEX "Product_storeId_categoryId_idx" ON "Product"("storeId", "categoryId");
CREATE INDEX "Product_storeId_brandId_idx" ON "Product"("storeId", "brandId");
CREATE INDEX "Product_categoryId_status_idx" ON "Product"("categoryId", "status");
CREATE INDEX "Product_brandId_status_idx" ON "Product"("brandId", "status");
CREATE UNIQUE INDEX "Product_storeId_sku_key" ON "Product"("storeId", "sku");
CREATE UNIQUE INDEX "Product_storeId_slug_key" ON "Product"("storeId", "slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Customer_storeId_email_idx" ON "Customer"("storeId", "email");

-- CreateIndex
CREATE INDEX "ProductAttribute_name_idx" ON "ProductAttribute"("name");
