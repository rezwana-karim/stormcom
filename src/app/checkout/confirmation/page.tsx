/**
 * Checkout Confirmation Page
 * Displays order confirmation after successful checkout
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2, Package, Truck, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams?.get('orderId');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      router.push('/checkout');
      return;
    }

    // TODO: Fetch order details from API
    // For now, simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, [orderId, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-20 max-w-2xl">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-3xl">
      <div className="space-y-8">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Order Confirmed!</h1>
            <p className="text-muted-foreground">
              Thank you for your purchase. Your order has been received.
            </p>
          </div>
        </div>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>Order #{orderId}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order Number</span>
                <span className="font-medium">{orderId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order Date</span>
                <span className="font-medium">
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order Total</span>
                <span className="font-medium">$118.78</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What's Next */}
        <Card>
          <CardHeader>
            <CardTitle>What&apos;s Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <div className="rounded-full bg-primary/10 p-3 h-fit">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">Order Confirmation Email</h3>
                <p className="text-sm text-muted-foreground">
                  We&apos;ve sent a confirmation email to your email address with your order details.
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex gap-4">
              <div className="rounded-full bg-primary/10 p-3 h-fit">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">Order Processing</h3>
                <p className="text-sm text-muted-foreground">
                  Your order is being prepared. You&apos;ll receive another email when it ships.
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex gap-4">
              <div className="rounded-full bg-primary/10 p-3 h-fit">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">Track Your Order</h3>
                <p className="text-sm text-muted-foreground">
                  Once shipped, you&apos;ll be able to track your package&apos;s delivery progress.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push('/dashboard/orders/' + orderId)}
          >
            View Order Details
          </Button>
          <Button
            className="flex-1"
            onClick={() => router.push('/dashboard/products')}
          >
            Continue Shopping
          </Button>
        </div>

        {/* Help */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-medium">Need Help?</h3>
              <p className="text-sm text-muted-foreground">
                If you have any questions about your order, please contact our customer support.
              </p>
              <Button variant="link">Contact Support</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CheckoutConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-20 max-w-2xl">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
