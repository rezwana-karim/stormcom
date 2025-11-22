-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InventoryLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "previousQty" INTEGER NOT NULL,
    "newQty" INTEGER NOT NULL,
    "changeQty" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryLog_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InventoryLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InventoryLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_InventoryLog" ("changeQty", "createdAt", "id", "newQty", "note", "previousQty", "productId", "reason", "storeId", "userId") SELECT "changeQty", "createdAt", "id", "newQty", "note", "previousQty", "productId", "reason", "storeId", "userId" FROM "InventoryLog";
DROP TABLE "InventoryLog";
ALTER TABLE "new_InventoryLog" RENAME TO "InventoryLog";
CREATE INDEX "InventoryLog_storeId_productId_createdAt_idx" ON "InventoryLog"("storeId", "productId", "createdAt");
CREATE INDEX "InventoryLog_productId_createdAt_idx" ON "InventoryLog"("productId", "createdAt");
CREATE INDEX "InventoryLog_userId_createdAt_idx" ON "InventoryLog"("userId", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
