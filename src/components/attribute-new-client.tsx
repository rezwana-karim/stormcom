"use client";

// src/components/attribute-new-client.tsx
// Client component for creating new attribute with store selection

import { useState } from 'react';
import { StoreSelector } from '@/components/store-selector';
import { AttributeForm } from '@/components/attribute-form';

export function AttributeNewClient() {
  const [storeId, setStoreId] = useState<string>('');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Store:</label>
        <StoreSelector onStoreChange={setStoreId} />
      </div>

      {storeId ? (
        <AttributeForm storeId={storeId} />
      ) : (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Select a store to create an attribute
          </p>
        </div>
      )}
    </div>
  );
}
