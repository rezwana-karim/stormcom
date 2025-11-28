-- Note: Product_sku_idx index was dropped because multi-tenant SKU uniqueness
-- is now enforced via @@unique([storeId, sku]) constraint on the Product model.
-- This ensures SKUs are unique per store, not globally, which is the correct
-- behavior for a multi-tenant e-commerce platform.
DROP INDEX "Product_sku_idx";
