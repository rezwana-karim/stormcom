"use client";

// src/components/product-edit-form.tsx
// Product edit form with variants and image upload

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Form validation schema
const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255, 'Name too long'),
  categoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  slug: z.string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens only'),
  description: z.string().max(5000, 'Description too long').optional(),
  sku: z.string().min(1, 'SKU is required').max(100, 'SKU too long'),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
  compareAtPrice: z.coerce.number().min(0, 'Compare at price must be non-negative').optional().nullable(),
  costPerItem: z.coerce.number().min(0, 'Cost must be non-negative').optional().nullable(),
  inventoryQty: z.coerce.number().int().min(0, 'Stock must be non-negative'),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductEditFormProps {
  productId: string;
}

interface FetchedProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  inventoryQty: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  images?: string[];
  variants?: Array<{
    id: string;
    name: string;
    sku: string;
    price?: number | null;
    inventoryQty: number;
  }>;
}

export function ProductEditForm({ productId }: ProductEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [storeId, setStoreId] = useState<string>('');
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);

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

  // Fetch product data when store changes
  useEffect(() => {
    async function fetchProduct() {
      if (!storeId) return;

      setFetching(true);
      try {
        const response = await fetch(`/api/products/${productId}?storeId=${storeId}`);
        if (!response.ok) throw new Error('Failed to fetch product');

        const product: FetchedProduct = await response.json();

        // Set form values
        form.reset({
          name: product.name || '',
          slug: product.slug || '',
          description: product.description || '',
          categoryId: (product as any).categoryId || undefined,
          brandId: (product as any).brandId || undefined,
          sku: product.sku || '',
          price: product.price || 0,
          compareAtPrice: product.compareAtPrice || null,
          costPerItem: product.costPrice || null,
          inventoryQty: product.inventoryQty || 0,
          status: product.status || 'DRAFT',
        });

        // Set images
        setImages(product.images || []);

        // Set variants
        if (product.variants && product.variants.length > 0) {
          setVariants(
            product.variants.map((v) => ({
              id: v.id,
              name: v.name,
              sku: v.sku,
              price: v.price ?? null,
              stock: v.inventoryQty,
            }))
          );
        } else {
          setVariants([]);
        }
      } catch (error) {
        toast.error('Failed to load product');
        console.error('Fetch product error:', error);
      } finally {
        setFetching(false);
      }
    }

    fetchProduct();
  }, [productId, storeId, form]);

  const onSubmit = async (data: ProductFormValues) => {
    if (!storeId) {
      toast.error('Please select a store');
      return;
    }

    setLoading(true);

    try {
      // Transform variants for API
      const apiVariants = variants.map((v) => ({
        id: v.id, // Include ID for existing variants
        name: v.name,
        sku: v.sku,
        price: v.price,
        inventoryQty: v.stock,
      }));

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          name: data.name,
          slug: data.slug,
          categoryId: (data as any).categoryId && (data as any).categoryId !== '__none' ? (data as any).categoryId : undefined,
          brandId: (data as any).brandId && (data as any).brandId !== '__none' ? (data as any).brandId : undefined,
          description: data.description || undefined,
          sku: data.sku,
          price: data.price,
          compareAtPrice: data.compareAtPrice || null,
          costPrice: data.costPerItem || null,
          inventoryQty: data.inventoryQty,
          status: data.status,
          images: images,
          variants: apiVariants,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update product');
      }

      toast.success('Product updated successfully');
      router.push('/dashboard/products');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update product';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories and brands when storeId is available
  useEffect(() => {
    if (!storeId) return;

    (async () => {
      try {
        const [cRes, bRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/brands'),
        ]);

        if (cRes.ok) {
          const cJson = await cRes.json();
          setCategories((cJson.categories || []).map((c: any) => ({ id: c.id, name: c.name })));
        }

        if (bRes.ok) {
          const bJson = await bRes.json();
          setBrands((bJson.brands || []).map((b: any) => ({ id: b.id, name: b.name })));
        }
      } catch (e) {
        console.error('Failed to fetch categories/brands', e);
      }
    })();
  }, [storeId]);

  return (
    <div className="space-y-6">
      {/* Store Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Store</CardTitle>
          <CardDescription>Select the store for this product</CardDescription>
        </CardHeader>
        <CardContent>
          <StoreSelector onStoreChange={setStoreId} />
        </CardContent>
      </Card>

      {fetching && storeId ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !storeId ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Please select a store to edit this product
            </p>
          </CardContent>
        </Card>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Product name, description, and identification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter product name" />
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
                        <FormLabel>Slug *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="product-slug" />
                        </FormControl>
                        <FormDescription>URL-friendly version of the name</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                      <FormDescription>Unique stock keeping unit identifier</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                                  <Select onValueChange={field.onChange} value={field.value ?? '__none'}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                      <SelectItem value="__none">None</SelectItem>
                              {categories.map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brandId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value ?? '__none'}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select brand" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none">None</SelectItem>
                              {brands.map((b) => (
                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Product Images */}
            <ImageUpload
              images={images}
              onChange={setImages}
              storeId={storeId}
              disabled={loading}
            />

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
                <CardDescription>Set product pricing information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
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
                </div>
              </CardContent>
            </Card>

            {/* Inventory */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory</CardTitle>
                <CardDescription>Stock management and product status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
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
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
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
                </div>
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
        </Form>
      )}
    </div>
  );
}
