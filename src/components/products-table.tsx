"use client";

// src/components/products-table.tsx
// Client component for displaying and managing products

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Package } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  inventoryQty: number;
  inventoryStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED';
  category?: { name: string; slug: string };
  brand?: { name: string; slug: string };
}

interface ProductsTableProps {
  storeId: string;
}

export function ProductsTable({ storeId }: ProductsTableProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch(`/api/products?storeId=${storeId}`);
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        setProducts(data.products || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    }

    if (storeId) {
      fetchProducts();
    }
  }, [storeId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 w-full animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center">
        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No products yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Get started by creating your first product.
        </p>
        <Link href="/dashboard/products/new">
          <Button className="mt-4">Create Product</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">
                <Link 
                  href={`/dashboard/products/${product.id}`}
                  className="hover:underline"
                >
                  {product.name}
                </Link>
              </TableCell>
              <TableCell className="font-mono text-sm">{product.sku}</TableCell>
              <TableCell>${product.price.toFixed(2)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{product.inventoryQty}</span>
                  <Badge 
                    variant={
                      product.inventoryStatus === 'IN_STOCK' ? 'default' :
                      product.inventoryStatus === 'LOW_STOCK' ? 'secondary' :
                      'destructive'
                    }
                  >
                    {product.inventoryStatus.replace('_', ' ')}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={
                    product.status === 'ACTIVE' ? 'default' :
                    product.status === 'DRAFT' ? 'secondary' :
                    'outline'
                  }
                >
                  {product.status}
                </Badge>
              </TableCell>
              <TableCell>
                {product.category ? (
                  <span className="text-sm text-muted-foreground">
                    {product.category.name}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Link href={`/dashboard/products/${product.id}`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
