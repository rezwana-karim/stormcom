-- CreateTable
CREATE TABLE "WebsiteIntegration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" DATETIME,
    "syncProducts" BOOLEAN NOT NULL DEFAULT true,
    "syncOrders" BOOLEAN NOT NULL DEFAULT true,
    "syncInventory" BOOLEAN NOT NULL DEFAULT true,
    "syncCustomers" BOOLEAN NOT NULL DEFAULT false,
    "productSyncDirection" TEXT NOT NULL DEFAULT 'TWO_WAY',
    "orderSyncDirection" TEXT NOT NULL DEFAULT 'TO_STORMCOM',
    "inventorySyncDirection" TEXT NOT NULL DEFAULT 'TWO_WAY',
    "webhookUrl" TEXT,
    "webhookSecret" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" DATETIME,
    "platform" TEXT,
    "platformVersion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WebsiteIntegration_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "integrationId" TEXT NOT NULL,
    "stormcomProductId" TEXT NOT NULL,
    "externalProductId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductMapping_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "WebsiteIntegration" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductMapping_stormcomProductId_fkey" FOREIGN KEY ("stormcomProductId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "integrationId" TEXT NOT NULL,
    "stormcomOrderId" TEXT NOT NULL,
    "externalOrderId" TEXT NOT NULL,
    "lastSyncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncDirection" TEXT NOT NULL DEFAULT 'TO_STORMCOM',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OrderMapping_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "WebsiteIntegration" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderMapping_stormcomOrderId_fkey" FOREIGN KEY ("stormcomOrderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "integrationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "externalId" TEXT,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "requestData" TEXT,
    "responseData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SyncLog_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "WebsiteIntegration" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "WebsiteIntegration_storeId_key" ON "WebsiteIntegration"("storeId");

-- CreateIndex
CREATE INDEX "WebsiteIntegration_storeId_idx" ON "WebsiteIntegration"("storeId");

-- CreateIndex
CREATE INDEX "WebsiteIntegration_apiKey_idx" ON "WebsiteIntegration"("apiKey");

-- CreateIndex
CREATE INDEX "ProductMapping_stormcomProductId_idx" ON "ProductMapping"("stormcomProductId");

-- CreateIndex
CREATE INDEX "ProductMapping_externalProductId_idx" ON "ProductMapping"("externalProductId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductMapping_integrationId_externalProductId_key" ON "ProductMapping"("integrationId", "externalProductId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductMapping_integrationId_stormcomProductId_key" ON "ProductMapping"("integrationId", "stormcomProductId");

-- CreateIndex
CREATE INDEX "OrderMapping_stormcomOrderId_idx" ON "OrderMapping"("stormcomOrderId");

-- CreateIndex
CREATE INDEX "OrderMapping_externalOrderId_idx" ON "OrderMapping"("externalOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderMapping_integrationId_externalOrderId_key" ON "OrderMapping"("integrationId", "externalOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderMapping_integrationId_stormcomOrderId_key" ON "OrderMapping"("integrationId", "stormcomOrderId");

-- CreateIndex
CREATE INDEX "SyncLog_integrationId_createdAt_idx" ON "SyncLog"("integrationId", "createdAt");

-- CreateIndex
CREATE INDEX "SyncLog_entityType_entityId_idx" ON "SyncLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "SyncLog_status_idx" ON "SyncLog"("status");
