"use client";

// src/components/payments-page-client.tsx
// Client wrapper for payments page

import { useState } from 'react';
import { StoreSelector } from '@/components/store-selector';
import { PaymentsTable } from '@/components/payments-table';
import { ReconciliationCard } from '@/components/payments-reconciliation-card';

export function PaymentsPageClient() {
  const [storeId, setStoreId] = useState<string>('');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Store:</label>
        <StoreSelector onStoreChange={setStoreId} />
      </div>

      {storeId ? (
        <div className="space-y-6">
          <ReconciliationCard storeId={storeId} />
          <PaymentsTable storeId={storeId} />
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Select a store to view payment attempts
          </p>
        </div>
      )}
    </div>
  );
}
