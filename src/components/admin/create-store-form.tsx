"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Building2, User, Store } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  userId: z.string().min(1, "Please select a user"),
  name: z.string().min(2, "Store name must be at least 2 characters").max(100),
  slug: z.string()
    .min(2, "Slug must be at least 2 characters")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens only"),
  description: z.string().max(500).optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().max(20).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(2).default("US"),
  subscriptionPlan: z.enum(["FREE", "BASIC", "PRO", "ENTERPRISE"]).default("FREE"),
});

type FormValues = z.infer<typeof formSchema>;

interface ApprovedUser {
  id: string;
  name: string | null;
  email: string | null;
  businessName: string | null;
  businessCategory: string | null;
}

interface SelectedUser extends ApprovedUser {
  businessDescription: string | null;
  phoneNumber: string | null;
}

interface CreateStoreFormProps {
  approvedUsers: ApprovedUser[];
  selectedUser?: SelectedUser;
}

export function CreateStoreForm({ approvedUsers, selectedUser }: CreateStoreFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: selectedUser?.id || "",
      name: selectedUser?.businessName || "",
      slug: selectedUser?.businessName?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || "",
      description: selectedUser?.businessDescription || "",
      email: selectedUser?.email || "",
      phone: selectedUser?.phoneNumber || "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "US",
      subscriptionPlan: "FREE",
    },
  });

  const watchedUserId = form.watch("userId");
  const watchedName = form.watch("name");

  // Update user-related fields when userId changes
  useEffect(() => {
    if (watchedUserId && watchedUserId !== selectedUser?.id) {
      const user = approvedUsers.find(u => u.id === watchedUserId);
      if (user) {
        form.setValue("email", user.email || "");
        if (user.businessName) {
          form.setValue("name", user.businessName);
          form.setValue("slug", user.businessName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
        }
      }
    }
  }, [watchedUserId, approvedUsers, selectedUser, form]);

  // Auto-generate slug from name
  useEffect(() => {
    if (watchedName) {
      const slug = watchedName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      form.setValue("slug", slug);
    }
  }, [watchedName, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create store');
      }

      toast.success(`Store "${values.name}" created successfully!`);
      router.push('/admin/stores');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create store');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentUser = approvedUsers.find(u => u.id === watchedUserId) || selectedUser;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* User Selection */}
        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Store Owner</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {approvedUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{user.name || user.email}</span>
                        {user.businessName && (
                          <Badge variant="outline" className="ml-2">
                            {user.businessName}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Select an approved user to own this store
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Selected User Info */}
        {currentUser && (
          <Card className="bg-muted/50">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Selected User</CardTitle>
            </CardHeader>
            <CardContent className="py-3">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{currentUser.name || "No name"}</p>
                  <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                  {currentUser.businessCategory && (
                    <Badge variant="secondary" className="mt-1">
                      {currentUser.businessCategory}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Store Information */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Store Name</FormLabel>
                <FormControl>
                  <Input placeholder="My Awesome Store" {...field} />
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
                <FormLabel>Store Slug</FormLabel>
                <FormControl>
                  <Input placeholder="my-awesome-store" {...field} />
                </FormControl>
                <FormDescription>
                  URL-friendly identifier (auto-generated)
                </FormDescription>
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
                  placeholder="Brief description of the store..." 
                  {...field} 
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Contact Information</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Email</FormLabel>
                  <FormControl>
                    <Input placeholder="store@example.com" type="email" {...field} />
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
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 000-0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Address</h3>
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <Input placeholder="123 Main St" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="City" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State / Province</FormLabel>
                  <FormControl>
                    <Input placeholder="State" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postal Code</FormLabel>
                  <FormControl>
                    <Input placeholder="12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Subscription Plan */}
        <FormField
          control={form.control}
          name="subscriptionPlan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subscription Plan</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="FREE">Free - 10 products, 100 orders/month</SelectItem>
                  <SelectItem value="BASIC">Basic - 100 products, 500 orders/month</SelectItem>
                  <SelectItem value="PRO">Pro - 1000 products, 2000 orders/month</SelectItem>
                  <SelectItem value="ENTERPRISE">Enterprise - Unlimited</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Store...
              </>
            ) : (
              <>
                <Store className="mr-2 h-4 w-4" />
                Create Store
              </>
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
