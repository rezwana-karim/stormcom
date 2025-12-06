"use client";

// src/components/store-selector.tsx
// Component to select/create store for organization

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

// Cookie name - must match the server-side constant
const SELECTED_STORE_COOKIE = 'selected_store_id';

interface Store {
  id: string;
  name: string;
  slug: string;
}

interface StoreSelectorProps {
  onStoreChange?: (storeId: string) => void;
}

/**
 * Set a cookie with the selected store ID
 * Uses path=/ to ensure cookie is available across all pages
 */
function setStoreCookie(storeId: string) {
  // Set cookie to expire in 30 days
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);
  document.cookie = `${SELECTED_STORE_COOKIE}=${storeId}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
}

/**
 * Get the stored store ID from cookie
 */
function getStoreCookie(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === SELECTED_STORE_COOKIE) {
      return value;
    }
  }
  return null;
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

  // Handle store selection change
  const handleStoreChange = useCallback((storeId: string) => {
    setSelectedStore(storeId);
    setStoreCookie(storeId); // Persist to cookie
    onStoreChangeRef.current?.(storeId);
  }, []);

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
        
        // Check for previously selected store in cookie
        const savedStoreId = getStoreCookie();
        const savedStoreValid = savedStoreId && storeList.some(s => s.id === savedStoreId);
        
        // Use saved store if valid, otherwise default to first store
        if (storeList.length > 0 && !selectedStore) {
          const storeIdToSelect = savedStoreValid ? savedStoreId : storeList[0].id;
          setSelectedStore(storeIdToSelect);
          setStoreCookie(storeIdToSelect); // Ensure cookie is set
          onStoreChangeRef.current?.(storeIdToSelect);
        }
      } catch (err) {
        console.error('Failed to fetch stores:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch stores');
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
    <Select value={selectedStore} onValueChange={handleStoreChange}>
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
