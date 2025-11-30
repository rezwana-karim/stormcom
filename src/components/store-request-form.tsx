"use client";

import { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const storeRequestSchema = z.object({
  storeName: z.string().min(2, "Store name must be at least 2 characters").max(100),
  storeSlug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens only").optional().or(z.literal("")),
  storeDescription: z.string().max(500).optional(),
  businessName: z.string().max(200).optional(),
  businessCategory: z.string().optional(),
  businessAddress: z.string().max(300).optional(),
  businessPhone: z.string().max(20).optional(),
  businessEmail: z.string().email("Invalid email").optional().or(z.literal("")),
});

type StoreRequestFormValues = z.infer<typeof storeRequestSchema>;

const BUSINESS_CATEGORIES = [
  "Fashion & Apparel",
  "Electronics & Technology",
  "Home & Garden",
  "Health & Beauty",
  "Food & Beverages",
  "Sports & Outdoors",
  "Toys & Games",
  "Books & Media",
  "Arts & Crafts",
  "Jewelry & Accessories",
  "Pet Supplies",
  "Automotive",
  "Other",
];

interface StoreRequestFormProps {
  defaultValues?: Partial<StoreRequestFormValues>;
}

export function StoreRequestForm({ defaultValues }: StoreRequestFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<StoreRequestFormValues>({
    resolver: zodResolver(storeRequestSchema),
    defaultValues: {
      storeName: "",
      storeSlug: "",
      storeDescription: "",
      businessName: defaultValues?.businessName || "",
      businessCategory: defaultValues?.businessCategory || "",
      businessAddress: "",
      businessPhone: defaultValues?.businessPhone || "",
      businessEmail: defaultValues?.businessEmail || "",
    },
  });

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const onSubmit = async (values: StoreRequestFormValues) => {
    setLoading(true);
    try {
      const response = await fetch("/api/store-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          storeSlug: values.storeSlug || generateSlug(values.storeName),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      toast.success("Store request submitted!", {
        description: "You'll be notified once your request is reviewed.",
      });
      router.refresh();
    } catch (error) {
      toast.error("Failed to submit request", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-medium">Store Information</h3>
          
          <FormField
            control={form.control}
            name="storeName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Store Name *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="My Awesome Store" 
                    {...field} 
                    onChange={(e) => {
                      field.onChange(e);
                      // Auto-generate slug if not manually set
                      if (!form.getValues("storeSlug")) {
                        form.setValue("storeSlug", generateSlug(e.target.value));
                      }
                    }}
                  />
                </FormControl>
                <FormDescription>
                  The name of your store as it will appear to customers
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="storeSlug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Store URL</FormLabel>
                <FormControl>
                  <div className="flex items-center">
                    <span className="text-muted-foreground mr-2">yoursite.com/</span>
                    <Input placeholder="my-awesome-store" {...field} />
                  </div>
                </FormControl>
                <FormDescription>
                  URL-friendly identifier (lowercase, numbers, and hyphens only)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="storeDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Store Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Tell us about your store and what you plan to sell..."
                    rows={3}
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Brief description of your store (max 500 characters)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Business Information</h3>

          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Name</FormLabel>
                <FormControl>
                  <Input placeholder="ABC Company LLC" {...field} />
                </FormControl>
                <FormDescription>
                  Your registered business name (if applicable)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="businessCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BUSINESS_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  The primary category of products you'll sell
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="businessEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contact@business.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="businessPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="businessAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Address</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="123 Main Street, Suite 100, City, State, ZIP"
                    rows={2}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Store Request
        </Button>
      </form>
    </Form>
  );
}
