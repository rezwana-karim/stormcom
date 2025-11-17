"use client";

// src/components/products-page-client.tsx
// Client wrapper for products page

import { useState } from 'react';
import { StoreSelector } from '@/components/store-selector';
import { ProductsTable } from '@/components/products-table';

export function ProductsPageClient() {
  const [storeId, setStoreId] = useState<string>('');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Store:</label>
        <StoreSelector onStoreChange={setStoreId} />
      </div>

      {storeId ? (
        <ProductsTable storeId={storeId} />
      ) : (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Select a store to view products
          </p>
        </div>
      )}
    </div>
  );
}
