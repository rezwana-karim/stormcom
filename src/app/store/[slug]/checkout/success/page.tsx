"use client";

import { useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Package, Mail, ArrowRight } from "lucide-react";

/**
 * Order success page
 * Displayed after successful checkout
 */
export default function CheckoutSuccessPage() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const storeSlug = params.slug;
  const orderId = searchParams.get("orderId");

  // Redirect to cart if no orderId
  useEffect(() => {
    if (!orderId) {
      router.push(`/store/${storeSlug}/cart`);
    }
  }, [orderId, router, storeSlug]);

  if (!orderId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-3xl">Order Confirmed!</CardTitle>
            <CardDescription className="text-base mt-2">
              Thank you for your purchase
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Order Number */}
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Order Number</p>
            <p className="text-lg font-mono font-bold">
              {orderId.slice(0, 8).toUpperCase()}
            </p>
          </div>

          {/* What's Next */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">What happens next?</h3>
            
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Order Confirmation Email</p>
                  <p className="text-sm text-muted-foreground">
                    We&apos;ve sent a confirmation email with your order details
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Order Processing</p>
                  <p className="text-sm text-muted-foreground">
                    Your order is being prepared and will ship soon
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button asChild className="flex-1">
              <Link href={`/store/${storeSlug}/products`}>
                Continue Shopping
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href={`/store/${storeSlug}`}>
                Back to Store
              </Link>
            </Button>
          </div>

          {/* Support */}
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Need help? Contact our support team
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
