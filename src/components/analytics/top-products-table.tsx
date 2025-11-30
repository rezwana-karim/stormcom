/**
 * Top Products Table Component
 * 
 * Displays top selling products with revenue and units sold.
 * 
 * @module components/analytics/top-products-table
 */

'use client';

import { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TopProduct {
  id: string;
  name: string;
  revenue: number;
  unitsSold: number;
  category?: string;
}

interface TopProductsTableProps {
  timeRange: string;
  storeId: string;
}

export function TopProductsTable({ timeRange, storeId }: TopProductsTableProps) {
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!storeId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const response = await fetch(`/api/analytics/products/top?storeId=${storeId}&range=${timeRange}&limit=5`);
        if (!response.ok) throw new Error('Failed to fetch top products');
        
        const result = await response.json();
        setProducts(result.data || []);
      } catch (error) {
        console.error('Top products error:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange, storeId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-muted animate-pulse rounded" />
      ))}
    </div>;
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Package className="h-8 w-8 mb-2" />
        <p>No products data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {products.map((product, index) => (
        <div key={product.id} className="flex items-center gap-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
            {index + 1}
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-none">{product.name}</p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {product.unitsSold} units
              </p>
              {product.category && (
                <Badge variant="outline" className="text-xs">
                  {product.category}
                </Badge>
              )}
            </div>
          </div>
          <div className="font-medium">{formatCurrency(product.revenue)}</div>
        </div>
      ))}
    </div>
  );
}
