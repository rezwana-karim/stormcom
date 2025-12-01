"use client";

// src/components/store-selector.tsx
// Component to select/create store for organization

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface Store {
  id: string;
  name: string;
  slug: string;
}

interface StoresResponse {
  data: Store[];
  meta?: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

interface StoreSelectorProps {
  onStoreChange?: (storeId: string) => void;
}

export function StoreSelector({ onStoreChange }: StoreSelectorProps) {
  const { data: session, status } = useSession();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const onStoreChangeRef = useRef(onStoreChange);
  
  // Update ref when callback changes
  useEffect(() => {
    onStoreChangeRef.current = onStoreChange;
  }, [onStoreChange]);

  useEffect(() => {
    async function fetchStores() {
      if (status === 'loading') return;
      
      if (!session?.user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/stores');
        if (!response.ok) {
          throw new Error('Failed to fetch stores');
        }
        const result = await response.json();
        const storeList: Store[] = result.data || result.stores || [];
        
        setStores(storeList);
        
        // Auto-select first store if available
        if (storeList.length > 0 && !selectedStore) {
          const firstStoreId = storeList[0].id;
          setSelectedStore(firstStoreId);
          onStoreChangeRef.current?.(firstStoreId);
        }
      } catch (error) {
        console.error('Failed to fetch stores:', error);
        // Fallback to empty array - UI will show "No stores available"
        setStores([]);
      } finally {
        setLoading(false);
      }
    }

    fetchStores();
  }, [session, status, selectedStore]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-10 w-[200px] items-center justify-center rounded-md border bg-muted">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No stores available. Create a store to get started.
      </div>
    );
  }

  return (
    <Select value={selectedStore} onValueChange={(value) => {
      setSelectedStore(value);
      onStoreChangeRef.current?.(value);
    }}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select store" />
      </SelectTrigger>
      <SelectContent>
        {stores.map((store) => (
          <SelectItem key={store.id} value={store.id}>
            {store.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
