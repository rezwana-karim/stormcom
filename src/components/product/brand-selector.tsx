"use client";

// src/components/product/brand-selector.tsx
// Brand selector component for product forms

import { useState, useEffect, useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
}

interface BrandSelectorProps {
  storeId: string;
  value?: string | null;
  onChange: (brandId: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function BrandSelector({
  storeId,
  value,
  onChange,
  disabled = false,
  placeholder = 'Select brand',
}: BrandSelectorProps) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrands = useCallback(async () => {
    if (!storeId) {
      setBrands([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/brands?storeId=${storeId}&perPage=100&isPublished=true`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch brands');
      }
      
      const data = await response.json();
      setBrands(data.brands || []);
    } catch (err) {
      console.error('Failed to fetch brands:', err);
      setError('Failed to load brands');
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  if (loading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (error) {
    return (
      <div className="text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <Select
      value={value || 'none'}
      onValueChange={(val) => onChange(val === 'none' ? null : val)}
      disabled={disabled || brands.length === 0}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="text-muted-foreground">No brand</span>
        </SelectItem>
        {brands.map((brand) => (
          <SelectItem key={brand.id} value={brand.id}>
            {brand.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
