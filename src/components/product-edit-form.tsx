"use client";

// src/components/product-edit-form.tsx
// Product edit form component

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StoreSelector } from '@/components/store-selector';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ProductEditFormProps {
  productId: string;
}

export function ProductEditForm({ productId }: ProductEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false); // Changed from true
  const [storeId, setStoreId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    sku: '',
    price: '',
    compareAtPrice: '',
    costPerItem: '',
    inventoryQty: '',
    status: 'DRAFT' as 'DRAFT' | 'ACTIVE' | 'ARCHIVED',
  });

  useEffect(() => {
    async function fetchProduct() {
      if (!storeId) return; // Wait for store to be selected
      
      setFetching(true);
      try {
        const response = await fetch(`/api/products/${productId}?storeId=${storeId}`);
        if (!response.ok) throw new Error('Failed to fetch product');
        
        const product = await response.json();
        
        setFormData({
          name: product.name || '',
          slug: product.slug || '',
          description: product.description || '',
          sku: product.sku || '',
          price: product.price?.toString() || '',
          compareAtPrice: product.compareAtPrice?.toString() || '',
          costPerItem: product.costPrice?.toString() || '',
          inventoryQty: product.inventoryQty?.toString() || '',
          status: product.status || 'DRAFT',
        });
      } catch (error) {
        toast.error('Failed to load product');
        console.error('Fetch product error:', error);
      } finally {
        setFetching(false);
      }
    }

    fetchProduct();
  }, [productId, storeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!storeId) {
      toast.error('Please select a store');
      return;
    }
    
    setLoading(true);
    
    try {
      const payload = {
        storeId,
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        sku: formData.sku,
        price: parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
        costPrice: formData.costPerItem ? parseFloat(formData.costPerItem) : null,
        inventoryQty: parseInt(formData.inventoryQty),
        status: formData.status,
      };

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update product');
      }

      toast.success('Product updated successfully');
      router.push('/dashboard/products');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update product');
      console.error('Update error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <StoreSelector 
        onStoreChange={setStoreId}
      />
      
      {fetching && storeId ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !storeId ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">Please select a store to edit this product</p>
          </CardContent>
        </Card>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter product name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="product-slug"
                required
              />
              <p className="text-sm text-muted-foreground">URL-friendly version of the name</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter product description"
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="Enter SKU"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="compareAtPrice">Compare at Price</Label>
              <Input
                id="compareAtPrice"
                type="number"
                step="0.01"
                value={formData.compareAtPrice}
                onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPerItem">Cost per Item</Label>
              <Input
                id="costPerItem"
                type="number"
                step="0.01"
                value={formData.costPerItem}
                onChange={(e) => setFormData({ ...formData, costPerItem: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="inventoryQty">Stock Quantity *</Label>
              <Input
                id="inventoryQty"
                type="number"
                value={formData.inventoryQty}
                onChange={(e) => setFormData({ ...formData, inventoryQty: e.target.value })}
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value: 'DRAFT' | 'ACTIVE' | 'ARCHIVED') => setFormData({ ...formData, status: value })}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/products')}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            'Update Product'
          )}
        </Button>
      </div>
    </form>
      )}
    </div>
  );
}
