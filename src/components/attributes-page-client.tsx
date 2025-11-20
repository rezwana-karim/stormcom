"use client";

// src/components/attributes-page-client.tsx
// Client component for attributes page with store selection

import { useState } from 'react';
import { StoreSelector } from '@/components/store-selector';
import { AttributesTable } from '@/components/attributes-table';

export function AttributesPageClient() {
  const [storeId, setStoreId] = useState<string>('');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Store:</label>
        <StoreSelector onStoreChange={setStoreId} />
      </div>

      {storeId ? (
        <AttributesTable storeId={storeId} />
      ) : (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Select a store to view attributes
          </p>
        </div>
      )}
    </div>
  );
}
