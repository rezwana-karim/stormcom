-- Add Stripe payment fields
ALTER TABLE "Order" ADD COLUMN "stripePaymentIntentId" TEXT;
ALTER TABLE "Order" ADD COLUMN "stripeRefundId" TEXT;
ALTER TABLE "Order" ADD COLUMN "refundedAmount" REAL;
ALTER TABLE "Order" ADD COLUMN "refundReason" TEXT;

-- Add customer info for guest checkout
ALTER TABLE "Order" ADD COLUMN "customerEmail" TEXT;
ALTER TABLE "Order" ADD COLUMN "customerName" TEXT;
ALTER TABLE "Order" ADD COLUMN "customerPhone" TEXT;

-- Add deliveredAt timestamp
ALTER TABLE "Order" ADD COLUMN "deliveredAt" DATETIME;

-- Add idempotency key support
ALTER TABLE "Order" ADD COLUMN "idempotencyKey" TEXT;

-- Create unique index for idempotency (only if not null)
CREATE UNIQUE INDEX "Order_storeId_idempotencyKey_key" ON "Order"("storeId", "idempotencyKey");

-- Create index for idempotencyKey lookup
CREATE INDEX "Order_idempotencyKey_idx" ON "Order"("idempotencyKey");
