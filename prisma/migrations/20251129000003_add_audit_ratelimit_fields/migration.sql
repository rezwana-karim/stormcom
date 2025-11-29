-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN "allowed" BOOLEAN;
ALTER TABLE "audit_logs" ADD COLUMN "endpoint" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN "method" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN "permission" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN "role" TEXT;

-- CreateTable
CREATE TABLE "rate_limits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "role" TEXT,
    "requestCount" INTEGER NOT NULL DEFAULT 1,
    "windowStart" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastRequest" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "rate_limits_identifier_endpoint_windowStart_idx" ON "rate_limits"("identifier", "endpoint", "windowStart");

-- CreateIndex
CREATE INDEX "rate_limits_windowStart_idx" ON "rate_limits"("windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limits_identifier_endpoint_windowStart_key" ON "rate_limits"("identifier", "endpoint", "windowStart");

-- CreateIndex
CREATE INDEX "audit_logs_permission_allowed_createdAt_idx" ON "audit_logs"("permission", "allowed", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_action_createdAt_idx" ON "audit_logs"("userId", "action", "createdAt");
