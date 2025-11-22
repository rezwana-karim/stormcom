/**
 * Store Form Dialog
 * 
 * Dialog for creating and editing stores with subscription management.
 * 
 * @module components/stores/store-form-dialog
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const storeFormSchema = z.object({
  name: z.string().min(1, 'Store name is required').max(100),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens allowed'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  domain: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  subscriptionPlan: z.enum(['FREE', 'STARTER', 'PRO', 'ENTERPRISE']),
  subscriptionStatus: z.enum(['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID']),
  isActive: z.boolean().default(true),
  settings: z.object({
    currency: z.string().default('USD'),
    taxRate: z.number().min(0).max(100).default(0),
  }).optional(),
});

type StoreFormValues = z.infer<typeof storeFormSchema>;

interface Store {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string | null;
  domain?: string | null;
  description?: string | null;
  address?: string | null;
  subscriptionPlan: string;
  subscriptionStatus: string;
  isActive: boolean;
  settings?: {
    currency?: string;
    taxRate?: number;
  };
}

interface StoreFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store?: Store | null;
  onSuccess: () => void;
}

export function StoreFormDialog({ open, onOpenChange, store, onSuccess }: StoreFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!store;

  const form = useForm<StoreFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(storeFormSchema) as any,
    defaultValues: {
      name: '',
      slug: '',
      email: '',
      phone: '',
      domain: '',
      description: '',
      address: '',
      subscriptionPlan: 'FREE',
      subscriptionStatus: 'TRIALING',
      isActive: true,
      settings: {
        currency: 'USD',
        taxRate: 0,
      },
    },
  });

  useEffect(() => {
    if (store) {
      form.reset({
        name: store.name,
        slug: store.slug,
        email: store.email,
        phone: store.phone || '',
        domain: store.domain || '',
        description: store.description || '',
        address: store.address || '',
        subscriptionPlan: store.subscriptionPlan as 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE',
        subscriptionStatus: store.subscriptionStatus as 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID',
        isActive: store.isActive,
        settings: {
          currency: store.settings?.currency || 'USD',
          taxRate: store.settings?.taxRate || 0,
        },
      });
    }
  }, [store, form]);

  const onSubmit = async (data: StoreFormValues) => {
    setLoading(true);
    try {
      const url = isEdit ? `/api/stores/${store.id}` : '/api/stores';
      const method = isEdit ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save store');
      }

      toast.success(`${data.name} has been ${isEdit ? 'updated' : 'created'} successfully`);

      form.reset();
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save store');
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    if (!isEdit) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      form.setValue('slug', slug);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Store' : 'Create Store'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update store details and subscription settings.'
              : 'Create a new store with subscription plan.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Basic Information</h3>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleNameChange(e.target.value);
                        }}
                        placeholder="My Store"
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
                      <Input {...field} placeholder="my-store" disabled={isEdit} />
                    </FormControl>
                    <FormDescription>
                      Used in URLs. Cannot be changed after creation.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="store@example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} type="tel" placeholder="+1 (555) 000-0000" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Domain (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="mystore.com" />
                    </FormControl>
                    <FormDescription>Your custom storefront domain</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Subscription */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Subscription</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="subscriptionPlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select plan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="FREE">Free</SelectItem>
                          <SelectItem value="STARTER">Starter</SelectItem>
                          <SelectItem value="PRO">Pro</SelectItem>
                          <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subscriptionStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="TRIALING">Trialing</SelectItem>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="PAST_DUE">Past Due</SelectItem>
                          <SelectItem value="CANCELED">Canceled</SelectItem>
                          <SelectItem value="UNPAID">Unpaid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Settings</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="settings.currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                          <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="settings.taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Store</FormLabel>
                      <FormDescription>Store is active and visible to customers</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Update Store' : 'Create Store'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
