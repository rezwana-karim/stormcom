'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package, XCircle } from 'lucide-react';

interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  inventoryQty: number;
  lowStockThreshold: number;
  inventoryStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED';
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
    const fetchLowStock = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/inventory/low-stock?storeId=${storeId}`);
        const data = await response.json();

        if (response.ok) {
          setProducts(data.data || []);
          setError(null);
        } else {
          setError(data.error || 'Failed to fetch low stock items');
        }
      } catch {
        setError('Failed to fetch low stock items');
      } finally {
        setLoading(false);
      }
    };

    if (storeId) {
      fetchLowStock();
    }
  }, [storeId]);

  if (loading) {
    return (
      <Card className="border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4" />
            Low Stock Alert
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <XCircle className="h-4 w-4" />
            Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-green-700 dark:text-green-400">
            <Package className="h-4 w-4" />
            Inventory Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-600 dark:text-green-500">
            All products are adequately stocked!
          </p>
        </CardContent>
      </Card>
    );
  }

  const outOfStock = products.filter(p => p.inventoryStatus === 'OUT_OF_STOCK');
  const lowStock = products.filter(p => p.inventoryStatus === 'LOW_STOCK');

  return (
    <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-orange-700 dark:text-orange-400">
          <AlertTriangle className="h-4 w-4" />
          Low Stock Alert
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary */}
        <div className="flex gap-3 text-sm">
          {outOfStock.length > 0 && (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3 w-3" />
              {outOfStock.length} out of stock
            </Badge>
          )}
          {lowStock.length > 0 && (
            <Badge variant="outline" className="gap-1 bg-yellow-500 text-white border-yellow-600">
              <AlertTriangle className="h-3 w-3" />
              {lowStock.length} low stock
            </Badge>
          )}
        </div>

        {/* Product List */}
        <ul className="space-y-2 text-sm">
          {products.slice(0, maxItems).map((product) => (
            <li 
              key={product.id} 
              className="flex items-center justify-between rounded-md bg-white/50 dark:bg-black/20 p-2"
            >
              <div className="flex flex-col">
                <span className="font-medium text-foreground truncate max-w-[200px]">
                  {product.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  SKU: {product.sku}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span 
                  className={`font-semibold ${
                    product.inventoryStatus === 'OUT_OF_STOCK' 
                      ? 'text-destructive' 
                      : 'text-orange-600 dark:text-orange-400'
                  }`}
                >
                  {product.inventoryQty} units
                </span>
              </div>
            </li>
          ))}
        </ul>

        {products.length > maxItems && (
          <p className="text-xs text-muted-foreground pt-1">
            +{products.length - maxItems} more items need attention
          </p>
        )}
      </CardContent>
    </Card>
  );
}
