"use client";

/**
 * Customers Page Client Component
 * 
 * Client wrapper for customers page with store selector.
 * 
 * @module components/customers/customers-page-client
 */

import { useState } from 'react';
import { StoreSelector } from '@/components/store-selector';
import { CustomersList } from './customers-list';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

export function CustomersPageClient() {
  const [storeId, setStoreId] = useState<string>('');

  return (
    <div className="flex flex-col gap-6">
      {/* Store Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Store:</label>
        <StoreSelector onStoreChange={setStoreId} />
      </div>

      {storeId ? (
        <CustomersList storeId={storeId} />
      ) : (
        <Card className="shadow-sm">
          <CardContent className="flex min-h-[400px] flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Select a Store</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Choose a store from the selector above to view and manage customers
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
