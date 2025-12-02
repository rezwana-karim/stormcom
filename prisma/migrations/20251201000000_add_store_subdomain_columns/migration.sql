-- AlterTable: Add subdomain and customDomain columns to Store
ALTER TABLE "Store" ADD COLUMN "subdomain" TEXT;
ALTER TABLE "Store" ADD COLUMN "customDomain" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Store_subdomain_key" ON "Store"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "Store_customDomain_key" ON "Store"("customDomain");

-- CreateIndex
CREATE INDEX "Store_subdomain_idx" ON "Store"("subdomain");

-- CreateIndex
CREATE INDEX "Store_customDomain_idx" ON "Store"("customDomain");
