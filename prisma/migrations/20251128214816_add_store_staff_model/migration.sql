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

-- CreateIndex
CREATE INDEX "StoreStaff_storeId_isActive_idx" ON "StoreStaff"("storeId", "isActive");

-- CreateIndex
CREATE INDEX "StoreStaff_userId_isActive_idx" ON "StoreStaff"("userId", "isActive");

-- CreateIndex
CREATE INDEX "StoreStaff_storeId_role_idx" ON "StoreStaff"("storeId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "StoreStaff_userId_storeId_key" ON "StoreStaff"("userId", "storeId");
