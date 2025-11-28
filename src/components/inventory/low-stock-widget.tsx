'use client';

// src/components/inventory/low-stock-widget.tsx
// Low Stock Alert Widget for Dashboard

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Package, ArrowRight, XCircle, RefreshCw } from 'lucide-react';

interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  inventoryQty: number;
  lowStockThreshold: number;
  inventoryStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED';
  deficit: number;
  variants?: Array<{
    id: string;
    name: string;
    sku: string;
    inventoryQty: number;
    lowStockThreshold: number;
    deficit: number;
  }>;
}

interface LowStockWidgetProps {
  storeId: string;
  maxItems?: number;
  className?: string;
}

export function LowStockWidget({ storeId, maxItems = 5, className = '' }: LowStockWidgetProps) {
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ lowStock: 0, outOfStock: 0 });

  const fetchLowStockItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/inventory/low-stock?storeId=${storeId}`);
      const data = await response.json();

      if (response.ok) {
        setItems(data.data || []);
        setCounts({
          lowStock: data.meta?.lowStockCount || 0,
          outOfStock: data.meta?.outOfStockCount || 0,
        });
      }
    } catch {
      // Silently fail - widget is non-critical
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) {
      fetchLowStockItems();
    }
  }, [storeId, fetchLowStockItems]);

  // Don't render if no low stock items
  if (!loading && items.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <Card className={`border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
            <AlertTriangle className="h-5 w-5" />
            Low Stock Alert
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const totalAlerts = counts.lowStock + counts.outOfStock;
  const displayItems = items.slice(0, maxItems);

  return (
    <Card className={`border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
            <AlertTriangle className="h-5 w-5" />
            Low Stock Alert
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-orange-600 hover:text-orange-700"
            onClick={fetchLowStockItems}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {totalAlerts} product{totalAlerts !== 1 ? 's' : ''} need attention
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Summary badges */}
        <div className="flex gap-2">
          {counts.outOfStock > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              {counts.outOfStock} out of stock
            </Badge>
          )}
          {counts.lowStock > 0 && (
            <Badge variant="outline" className="flex items-center gap-1 border-yellow-500 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
              <AlertTriangle className="h-3 w-3" />
              {counts.lowStock} low stock
            </Badge>
          )}
        </div>

        {/* Item list */}
        <ul className="space-y-2">
          {displayItems.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-md border border-orange-200 bg-white p-2 dark:border-orange-800 dark:bg-orange-950/30"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.sku}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-semibold ${
                    item.inventoryStatus === 'OUT_OF_STOCK'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-yellow-600 dark:text-yellow-400'
                  }`}
                >
                  {item.inventoryQty} units
                </span>
                {item.inventoryStatus === 'OUT_OF_STOCK' ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <Package className="h-4 w-4 text-yellow-500" />
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* Show more indicator */}
        {items.length > maxItems && (
          <p className="text-center text-xs text-muted-foreground">
            +{items.length - maxItems} more items
          </p>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <Button variant="outline" asChild className="w-full">
          <Link href="/dashboard/inventory?lowStockOnly=true">
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
