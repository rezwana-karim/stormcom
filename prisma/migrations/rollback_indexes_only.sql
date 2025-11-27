-- rollback_indexes_only.sql
-- IMPORTANT: This script ONLY drops indexes, NOT columns.
-- 
-- This is an INCOMPLETE rollback. It does NOT:
-- - Remove new columns (estimatedDelivery, notes on Order; seoTitle, seoDescription, archivedAt on Product)
-- - Recreate the original table structure
--
-- For a complete rollback:
-- - Use Prisma: npx prisma migrate resolve --rolled-back 20251125232736_add_performance_indexes_and_fields
-- - Or create a new migration that explicitly reverts all changes
--
-- SQLite Limitation: SQLite doesn't support DROP COLUMN directly.
-- Column removal requires table recreation (CREATE TABLE → COPY DATA → DROP OLD → RENAME NEW)
--
-- Usage: sqlite3 prisma/dev.db < prisma/migrations/rollback_indexes_only.sql

-- Drop new indexes (safe operation)
DROP INDEX IF EXISTS "Category_slug_idx";
DROP INDEX IF EXISTS "Category_storeId_slug_idx";
DROP INDEX IF EXISTS "Customer_email_storeId_idx";
DROP INDEX IF EXISTS "Order_customerId_createdAt_idx";
DROP INDEX IF EXISTS "Order_storeId_status_createdAt_idx";
DROP INDEX IF EXISTS "Product_sku_idx";
DROP INDEX IF EXISTS "Product_storeId_categoryId_status_idx";
DROP INDEX IF EXISTS "Product_storeId_createdAt_idx";

-- WARNING: The following column removals are commented out because:
-- 1. SQLite doesn't support DROP COLUMN directly
-- 2. These require table recreation which risks data loss
-- 3. A proper Prisma migration should be created instead
--
-- ALTER TABLE "Order" DROP COLUMN "estimatedDelivery";
-- ALTER TABLE "Order" DROP COLUMN "notes";
-- ALTER TABLE "Product" DROP COLUMN "archivedAt";
-- ALTER TABLE "Product" DROP COLUMN "seoDescription";
-- ALTER TABLE "Product" DROP COLUMN "seoTitle";
