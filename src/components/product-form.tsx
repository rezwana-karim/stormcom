"use client";

// src/components/product-form.tsx
// Product creation form with variants and image upload

import { useState, useCallback, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
import { AttributesManager, type ProductAttribute } from '@/components/product/attributes-manager';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Form validation schema
const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255, 'Name too long'),
  categoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
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
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
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

      // Transform attributes for API
      const apiAttributes = attributes.map((a) => ({
        attributeId: a.attributeId,
        name: a.name,
        value: a.value,
      }));

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          name: data.name,
          slug: data.slug || undefined,
          categoryId: data.categoryId && data.categoryId !== '__none' ? data.categoryId : undefined,
          brandId: data.brandId && data.brandId !== '__none' ? data.brandId : undefined,
          description: data.description || undefined,
          sku: data.sku,
          price: data.price,
          compareAtPrice: data.compareAtPrice || null,
          costPrice: data.costPerItem || null,
          inventoryQty: data.inventoryQty,
          status: data.status,
          images: images,
          variants: apiVariants.length > 0 ? apiVariants : undefined,
          attributes: apiAttributes.length > 0 ? apiAttributes : undefined,
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

  useEffect(() => {
    if (!storeId) return;

    // Fetch categories and brands for the selected store (server infers store from session)
    (async () => {
      try {
        const [cRes, bRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/brands'),
        ]);

        if (cRes.ok) {
          const cJson = await cRes.json();
          setCategories((cJson.categories || []).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
        }

        if (bRes.ok) {
          const bJson = await bRes.json();
          setBrands((bJson.brands || []).map((b: { id: string; name: string }) => ({ id: b.id, name: b.name })));
        }
      } catch (e) {
        console.error('Failed to fetch categories/brands', e);
      }
    })();
  }, [storeId]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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

        {/* Tabs for organizing product form sections */}
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details">Product Details</TabsTrigger>
            <TabsTrigger value="pricing">Pricing & Inventory</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="variants">Variants</TabsTrigger>
            <TabsTrigger value="attributes">Attributes</TabsTrigger>
          </TabsList>

          {/* Tab 1: Product Details */}
          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Product name, description, and identification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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

            <Separator />

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

            <Separator />

            <div className="grid gap-6 md:grid-cols-2">
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
      </TabsContent>

      {/* Tab 2: Pricing & Inventory */}
      <TabsContent value="pricing" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>Set product pricing information</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-3">
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

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
            <CardDescription>Stock management and product status</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
      </TabsContent>

      {/* Tab 3: Media */}
      <TabsContent value="media">
        {storeId && (
          <ImageUpload
            images={images}
            onChange={setImages}
            storeId={storeId}
            disabled={loading}
          />
        )}
        {!storeId && (
          <Card>
            <CardContent className="flex items-center justify-center p-12">
              <p className="text-sm text-muted-foreground">
                Please select a store to upload images
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Tab 4: Variants */}
      <TabsContent value="variants">
        <VariantManager
          variants={variants}
          onChange={setVariants}
          disabled={loading}
        />
      </TabsContent>

      {/* Tab 5: Attributes */}
      <TabsContent value="attributes">
        {storeId && (
          <AttributesManager
            storeId={storeId}
            attributes={attributes}
            onChange={setAttributes}
            disabled={loading}
          />
        )}
        {!storeId && (
          <Card>
            <CardContent className="flex items-center justify-center p-12">
              <p className="text-sm text-muted-foreground">
                Please select a store to manage attributes
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>

        {/* Actions */}
        <div className="flex gap-6">
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
