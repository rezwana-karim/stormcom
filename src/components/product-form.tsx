"use client";

// src/components/product-form.tsx
// Product creation form with variants and image upload

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { StoreSelector } from '@/components/store-selector';
import { VariantManager, type ProductVariant } from '@/components/product/variant-manager';
import { ImageUpload } from '@/components/product/image-upload';
import { CategorySelector } from '@/components/product/category-selector';
import { BrandSelector } from '@/components/product/brand-selector';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Form validation schema
const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255, 'Name too long'),
  slug: z.string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens only')
    .optional()
    .or(z.literal('')),
  description: z.string().max(5000, 'Description too long').optional(),
  sku: z.string().min(1, 'SKU is required').max(100, 'SKU too long'),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
  compareAtPrice: z.coerce.number().min(0, 'Compare at price must be non-negative').optional().nullable(),
  costPerItem: z.coerce.number().min(0, 'Cost must be non-negative').optional().nullable(),
  inventoryQty: z.coerce.number().int().min(0, 'Stock must be non-negative'),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export function ProductForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [storeId, setStoreId] = useState<string>('');
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [brandId, setBrandId] = useState<string | null>(null);

  const form = useForm<ProductFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(productFormSchema) as any,
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      sku: '',
      price: 0,
      compareAtPrice: null,
      costPerItem: null,
      inventoryQty: 0,
      status: 'DRAFT',
    },
  });

  // Auto-generate slug from name
  const handleNameChange = useCallback(
    (name: string) => {
      form.setValue('name', name);
      
      const currentSlug = form.getValues('slug');
      if (!currentSlug) {
        const slug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        form.setValue('slug', slug);
      }
    },
    [form]
  );

  const onSubmit = async (data: ProductFormValues) => {
    if (!storeId) {
      toast.error('Please select a store');
      return;
    }

    setLoading(true);

    try {
      // Transform variants for API
      const apiVariants = variants.map((v) => ({
        name: v.name,
        sku: v.sku,
        price: v.price,
        inventoryQty: v.stock,
      }));

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          name: data.name,
          slug: data.slug || undefined,
          description: data.description || undefined,
          sku: data.sku,
          price: data.price,
          compareAtPrice: data.compareAtPrice || null,
          costPrice: data.costPerItem || null,
          inventoryQty: data.inventoryQty,
          status: data.status,
          categoryId: categoryId || null,
          brandId: brandId || null,
          images: images,
          variants: apiVariants.length > 0 ? apiVariants : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create product');
      }

      toast.success('Product created successfully');
      router.push('/dashboard/products');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create product';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Store Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Store</CardTitle>
            <CardDescription>Select the store for this product</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Label htmlFor="store-select">Select Store:</Label>
              <StoreSelector onStoreChange={setStoreId} />
            </div>
            {!storeId && (
              <p className="mt-2 text-sm text-muted-foreground">
                Please select a store to continue
              </p>
            )}
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Product name, description, and identification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter product name"
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="product-slug" />
                  </FormControl>
                  <FormDescription>
                    URL-friendly version of the name. Auto-generated if left empty.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter product description"
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter SKU" />
                  </FormControl>
                  <FormDescription>
                    Unique stock keeping unit identifier
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Organization - Category & Brand */}
        {storeId && (
          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
              <CardDescription>Assign category and brand for this product</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <CategorySelector
                  storeId={storeId}
                  value={categoryId}
                  onChange={setCategoryId}
                  disabled={loading}
                  placeholder="Select a category"
                />
                <p className="text-sm text-muted-foreground">
                  Organize products by category for easier browsing
                </p>
              </div>

              <div className="space-y-2">
                <Label>Brand</Label>
                <BrandSelector
                  storeId={storeId}
                  value={brandId}
                  onChange={setBrandId}
                  disabled={loading}
                  placeholder="Select a brand"
                />
                <p className="text-sm text-muted-foreground">
                  Associate product with a brand
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Product Images */}
        {storeId && (
          <ImageUpload
            images={images}
            onChange={setImages}
            storeId={storeId}
            disabled={loading}
          />
        )}

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>Set product pricing information</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="compareAtPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Compare at Price</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                      }
                    />
                  </FormControl>
                  <FormDescription>Original price for sale display</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="costPerItem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost per Item</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                      }
                    />
                  </FormControl>
                  <FormDescription>Your cost (not shown to customers)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Inventory */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
            <CardDescription>Stock management and product status</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="inventoryQty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Quantity *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="0"
                      placeholder="0"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Draft products are not visible to customers
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Variants */}
        <VariantManager
          variants={variants}
          onChange={setVariants}
          disabled={loading}
        />

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !storeId}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Product'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
