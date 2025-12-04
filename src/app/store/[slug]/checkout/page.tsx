"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Check, CreditCard, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/lib/stores/cart-store";
import { toast } from "sonner";

// Checkout form validation schema
const checkoutSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  
  // Shipping Address
  shippingAddress: z.string().min(5, "Address is required"),
  shippingCity: z.string().min(1, "City is required"),
  shippingState: z.string().min(1, "State/Province is required"),
  shippingPostalCode: z.string().min(3, "Postal code is required"),
  shippingCountry: z.string().min(2, "Country is required"),
  
  // Billing same as shipping
  billingSameAsShipping: z.boolean().default(true),
  
  // Optional billing address (required if billingSameAsShipping is false)
  billingAddress: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingCountry: z.string().optional(),
}).refine((data) => {
  // If billing is different, require billing fields
  if (!data.billingSameAsShipping) {
    return !!(
      data.billingAddress &&
      data.billingCity &&
      data.billingState &&
      data.billingPostalCode &&
      data.billingCountry
    );
  }
  return true;
}, {
  message: "Billing address is required when different from shipping",
  path: ["billingAddress"],
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

/**
 * Checkout page with form validation and order creation
 */
export default function CheckoutPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const storeSlug = params.slug;
  
  // Use Zustand selectors for proper reactive subscriptions
  // (destructuring pattern doesn't create reactive subscriptions in Next.js)
  const items = useCart((state) => state.items);
  const setStoreSlug = useCart((state) => state.setStoreSlug);
  const clearCart = useCart((state) => state.clearCart);
  const getSubtotal = useCart((state) => state.getSubtotal);
  const getEstimatedTax = useCart((state) => state.getEstimatedTax);
  const getEstimatedShipping = useCart((state) => state.getEstimatedShipping);
  const getTotal = useCart((state) => state.getTotal);
  
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize store slug
  useEffect(() => {
    setStoreSlug(storeSlug);
  }, [storeSlug, setStoreSlug]);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push(`/store/${storeSlug}/cart`);
    }
  }, [items.length, router, storeSlug]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(checkoutSchema) as any,
    defaultValues: {
      billingSameAsShipping: true,
    },
  });

  const billingSameAsShipping = watch("billingSameAsShipping");

  // Calculate totals
  const subtotal = getSubtotal();
  const tax = getEstimatedTax();
  const shipping = getEstimatedShipping();
  const total = getTotal();

  const onSubmit = async (data: CheckoutFormData) => {
    setIsProcessing(true);

    try {
      // Create order via API
      const response = await fetch(`/api/store/${storeSlug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
          },
          shippingAddress: {
            address: data.shippingAddress,
            city: data.shippingCity,
            state: data.shippingState,
            postalCode: data.shippingPostalCode,
            country: data.shippingCountry,
          },
          billingAddress: data.billingSameAsShipping
            ? {
                address: data.shippingAddress,
                city: data.shippingCity,
                state: data.shippingState,
                postalCode: data.shippingPostalCode,
                country: data.shippingCountry,
              }
            : {
                address: data.billingAddress || data.shippingAddress,
                city: data.billingCity || data.shippingCity,
                state: data.billingState || data.shippingState,
                postalCode: data.billingPostalCode || data.shippingPostalCode,
                country: data.billingCountry || data.shippingCountry,
              },
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
          })),
          subtotal,
          taxAmount: tax,
          shippingAmount: shipping,
          totalAmount: total,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create order");
      }

      const result = await response.json();

      // Clear cart on success
      clearCart();

      // Show success message
      toast.success("Order placed successfully!", {
        description: "You will receive a confirmation email shortly.",
      });

      // Redirect to success page
      router.push(`/store/${storeSlug}/checkout/success?orderId=${result.order.id}`);
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Checkout failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Don't render if cart is empty (will redirect)
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/store/${storeSlug}/cart`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold">Checkout</h1>
          <p className="text-muted-foreground mt-2">
            Complete your order in a few simple steps
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      1
                    </span>
                    Contact Information
                  </CardTitle>
                  <CardDescription>
                    We&apos;ll use this to send you order updates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      {...register("email")}
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        {...register("firstName")}
                        className={errors.firstName ? "border-destructive" : ""}
                      />
                      {errors.firstName && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        {...register("lastName")}
                        className={errors.lastName ? "border-destructive" : ""}
                      />
                      {errors.lastName && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      {...register("phone")}
                      className={errors.phone ? "border-destructive" : ""}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      2
                    </span>
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="shippingAddress">Address *</Label>
                    <Input
                      id="shippingAddress"
                      placeholder="123 Main St, Apt 4B"
                      {...register("shippingAddress")}
                      className={errors.shippingAddress ? "border-destructive" : ""}
                    />
                    {errors.shippingAddress && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.shippingAddress.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shippingCity">City *</Label>
                      <Input
                        id="shippingCity"
                        placeholder="New York"
                        {...register("shippingCity")}
                        className={errors.shippingCity ? "border-destructive" : ""}
                      />
                      {errors.shippingCity && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.shippingCity.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="shippingState">State/Province *</Label>
                      <Input
                        id="shippingState"
                        placeholder="NY"
                        {...register("shippingState")}
                        className={errors.shippingState ? "border-destructive" : ""}
                      />
                      {errors.shippingState && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.shippingState.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shippingPostalCode">Postal Code *</Label>
                      <Input
                        id="shippingPostalCode"
                        placeholder="10001"
                        {...register("shippingPostalCode")}
                        className={
                          errors.shippingPostalCode ? "border-destructive" : ""
                        }
                      />
                      {errors.shippingPostalCode && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.shippingPostalCode.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="shippingCountry">Country *</Label>
                      <Input
                        id="shippingCountry"
                        placeholder="United States"
                        {...register("shippingCountry")}
                        className={errors.shippingCountry ? "border-destructive" : ""}
                      />
                      {errors.shippingCountry && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.shippingCountry.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="billingSameAsShipping"
                      className="rounded border-gray-300"
                      {...register("billingSameAsShipping")}
                    />
                    <Label htmlFor="billingSameAsShipping" className="text-sm font-normal cursor-pointer">
                      Billing address same as shipping
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Billing Address (Conditional) */}
              {!billingSameAsShipping && (
                <Card>
                  <CardHeader>
                    <CardTitle>Billing Address</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="billingAddress">Address *</Label>
                      <Input
                        id="billingAddress"
                        placeholder="123 Main St, Apt 4B"
                        {...register("billingAddress")}
                        className={errors.billingAddress ? "border-destructive" : ""}
                      />
                      {errors.billingAddress && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.billingAddress.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="billingCity">City *</Label>
                        <Input
                          id="billingCity"
                          placeholder="New York"
                          {...register("billingCity")}
                          className={errors.billingCity ? "border-destructive" : ""}
                        />
                        {errors.billingCity && (
                          <p className="text-sm text-destructive mt-1">
                            {errors.billingCity.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="billingState">State/Province *</Label>
                        <Input
                          id="billingState"
                          placeholder="NY"
                          {...register("billingState")}
                          className={errors.billingState ? "border-destructive" : ""}
                        />
                        {errors.billingState && (
                          <p className="text-sm text-destructive mt-1">
                            {errors.billingState.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="billingPostalCode">Postal Code *</Label>
                        <Input
                          id="billingPostalCode"
                          placeholder="10001"
                          {...register("billingPostalCode")}
                          className={
                            errors.billingPostalCode ? "border-destructive" : ""
                          }
                        />
                        {errors.billingPostalCode && (
                          <p className="text-sm text-destructive mt-1">
                            {errors.billingPostalCode.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="billingCountry">Country *</Label>
                        <Input
                          id="billingCountry"
                          placeholder="United States"
                          {...register("billingCountry")}
                          className={errors.billingCountry ? "border-destructive" : ""}
                        />
                        {errors.billingCountry && (
                          <p className="text-sm text-destructive mt-1">
                            {errors.billingCountry.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                  <CardDescription>
                    {items.length} {items.length === 1 ? "item" : "items"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.key} className="flex justify-between text-sm">
                        <div className="flex-1">
                          <p className="font-medium line-clamp-1">{item.productName}</p>
                          <p className="text-muted-foreground text-xs">
                            Qty: {item.quantity} × ${item.price.toFixed(2)}
                          </p>
                        </div>
                        <span className="font-medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Price Breakdown */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-medium">
                        {shipping === 0 ? (
                          <span className="text-green-600">FREE</span>
                        ) : (
                          `$${shipping.toFixed(2)}`
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax (estimated)</span>
                      <span className="font-medium">${tax.toFixed(2)}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Total */}
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-5 w-5" />
                        Complete Order
                      </>
                    )}
                  </Button>

                  {/* Security Badge */}
                  <div className="pt-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Secure Checkout</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your information is encrypted and secure
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
