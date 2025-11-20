/*
  Warnings:

  - Added the required column `storeId` to the `ProductAttribute` table without a default value. This is not possible if the table is not empty.

*/
-- First, get the first store ID to assign to existing attributes
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductAttribute" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "values" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductAttribute_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Copy existing attributes and assign them to the first store
INSERT INTO "new_ProductAttribute" ("createdAt", "id", "name", "updatedAt", "values", "storeId") 
SELECT "createdAt", "id", "name", "updatedAt", "values", (SELECT id FROM Store LIMIT 1) FROM "ProductAttribute";

DROP TABLE "ProductAttribute";
ALTER TABLE "new_ProductAttribute" RENAME TO "ProductAttribute";
CREATE INDEX "ProductAttribute_storeId_idx" ON "ProductAttribute"("storeId");
CREATE INDEX "ProductAttribute_name_idx" ON "ProductAttribute"("name");
CREATE UNIQUE INDEX "ProductAttribute_storeId_name_key" ON "ProductAttribute"("storeId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
