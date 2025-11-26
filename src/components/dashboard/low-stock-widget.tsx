'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Package, ArrowRight, XCircle } from 'lucide-react';
import Link from 'next/link';

interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  inventoryQty: number;
  lowStockThreshold: number;
  inventoryStatus: 'LOW_STOCK' | 'OUT_OF_STOCK';
  categoryName?: string;
  brandName?: string;
}

interface LowStockWidgetProps {
  storeId: string;
  maxItems?: number;
}

export function LowStockWidget({ storeId, maxItems = 5 }: LowStockWidgetProps) {
  const [products, setProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLowStockProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/inventory/low-stock?storeId=${storeId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch low stock products');
        }

        setProducts(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (storeId) {
      fetchLowStockProducts();
    }
  }, [storeId]);

  // Don't render anything if there are no low stock items
  if (!loading && !error && products.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
            <AlertTriangle className="h-5 w-5" />
            Low Stock Alert
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-6 w-[60px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Error Loading Low Stock Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const outOfStockCount = products.filter(p => p.inventoryStatus === 'OUT_OF_STOCK').length;
  const lowStockCount = products.filter(p => p.inventoryStatus === 'LOW_STOCK').length;
  const displayProducts = products.slice(0, maxItems);
  const hasMore = products.length > maxItems;

  return (
    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
            <AlertTriangle className="h-5 w-5" />
            Low Stock Alert
          </span>
          <div className="flex gap-2">
            {outOfStockCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {outOfStockCount} out of stock
              </Badge>
            )}
            {lowStockCount > 0 && (
              <Badge variant="outline" className="text-xs bg-yellow-500 text-white border-yellow-600">
                {lowStockCount} low stock
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground mb-4">
          {products.length} product{products.length !== 1 ? 's' : ''} need attention
        </p>
        <ul className="space-y-3">
          {displayProducts.map((product) => (
            <li 
              key={product.id}
              className="flex items-center justify-between p-2 rounded-lg bg-white/50 dark:bg-gray-900/50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-sm font-semibold ${
                  product.inventoryStatus === 'OUT_OF_STOCK' 
                    ? 'text-destructive' 
                    : 'text-orange-600 dark:text-orange-400'
                }`}>
                  {product.inventoryQty} units
                </span>
                {product.inventoryStatus === 'OUT_OF_STOCK' ? (
                  <Badge variant="destructive" className="text-xs">
                    <XCircle className="h-3 w-3 mr-1" />
                    Out
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs bg-yellow-500 text-white border-yellow-600">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Low
                  </Badge>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
      {hasMore && (
        <CardFooter className="pt-0">
          <Button variant="ghost" className="w-full" asChild>
            <Link href="/dashboard/inventory">
              View all {products.length} products
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
