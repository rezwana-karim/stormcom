/**
 * Payment Method Step - Final step in checkout flow
 * Handles payment processing and order completion
 */

'use client';

import { useState } from 'react';
import { Loader2, CreditCard, Building2 } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { ShippingAddress } from '@/app/checkout/page';

interface PaymentMethodStepProps {
  shippingAddress: ShippingAddress;
  onComplete: (orderId: string) => void;
  onBack: () => void;
  isProcessing: boolean;
}

export function PaymentMethodStep({
  shippingAddress,
  onComplete,
  onBack,
  isProcessing,
}: PaymentMethodStepProps) {
  const { cart, refreshCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate totals from cart
  const subtotal = cart?.subtotal ?? 0;
  const tax = cart?.tax ?? 0;
  const shipping = cart?.shipping ?? 0;
  const total = cart?.total ?? 0;

  // Map UI payment method values to Prisma PaymentMethod enum
  const mapPaymentMethod = (method: string): string => {
    const mapping: Record<string, string> = {
      'card': 'CREDIT_CARD',
      'bank': 'BANK_TRANSFER',
    };
    return mapping[method] || 'CREDIT_CARD';
  };

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);

    try {
      // Get cart items to pass to the order creation API
      if (!cart || !cart.items || cart.items.length === 0) {
        throw new Error('Cart is empty');
      }

      const storeId = 'clqm1j4k00000l8dw8z8r8z8r'; // TODO: Get from user's organization

      // Prepare order data for the API
      const orderData = {
        storeId,
        items: cart.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId || undefined,
          quantity: item.quantity,
        })),
        shippingAddress: {
          firstName: shippingAddress.firstName,
          lastName: shippingAddress.lastName,
          email: shippingAddress.email,
          phone: shippingAddress.phone,
          address: shippingAddress.addressLine1,
          city: shippingAddress.city,
          state: shippingAddress.state || '',
          postalCode: shippingAddress.zipCode,
          country: shippingAddress.country,
        },
        shippingMethod: 'standard',
        shippingCost: shipping,
        paymentMethod: mapPaymentMethod(paymentMethod),
        paymentGateway: 'STRIPE',
      };

      // Call the checkout complete API
      console.log('Creating order with data:', orderData);
      
      const response = await fetch('/api/checkout/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      console.log('Order creation response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Order creation failed:', errorData);
        throw new Error(errorData.error || 'Failed to create order');
      }

      const order = await response.json();
      console.log('Order created successfully:', order);
      
      // Refresh cart to show empty state after order placement
      await refreshCart();
      
      // Navigate to confirmation page with the real order ID
      console.log('Navigating to confirmation with order ID:', order.id);
      onComplete(order.id);
    } catch (error) {
      console.error('Payment error:', error);
      alert(error instanceof Error ? error.message : 'Failed to place order. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Shipping Address Review */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Shipping Address</h3>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1 text-sm">
              <p className="font-medium">
                {shippingAddress.firstName} {shippingAddress.lastName}
              </p>
              <p>{shippingAddress.addressLine1}</p>
              {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
              <p>
                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
              </p>
              <p>{shippingAddress.country}</p>
              <Separator className="my-3" />
              <p>{shippingAddress.email}</p>
              <p>{shippingAddress.phone}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Payment Method</h3>
        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <RadioGroupItem value="card" id="card" />
                <Label
                  htmlFor="card"
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                >
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Credit or Debit Card</p>
                    <p className="text-xs text-muted-foreground">
                      Visa, Mastercard, American Express, Discover
                    </p>
                  </div>
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <RadioGroupItem value="bank" id="bank" />
                <Label
                  htmlFor="bank"
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                >
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Bank Transfer</p>
                    <p className="text-xs text-muted-foreground">
                      Direct debit from your bank account
                    </p>
                  </div>
                </Label>
              </div>
            </CardContent>
          </Card>
        </RadioGroup>
      </div>

      {/* Payment Form Placeholder */}
      {paymentMethod === 'card' && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="p-8 border-2 border-dashed rounded-lg text-center">
                <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Stripe payment form will be embedded here
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  TODO: Integrate @stripe/stripe-js and Stripe Elements
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {paymentMethod === 'bank' && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="p-8 border-2 border-dashed rounded-lg text-center">
                <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Bank account connection form will be embedded here
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  TODO: Integrate bank transfer payment method
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Total */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Shipping</span>
              <span>${shipping.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onBack}
          disabled={isSubmitting || isProcessing}
        >
          Back to Shipping
        </Button>
        <Button
          className="flex-1"
          onClick={handlePlaceOrder}
          disabled={isSubmitting || isProcessing}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Payment...
            </>
          ) : (
            'Place Order'
          )}
        </Button>
      </div>

      {/* Security Notice */}
      <p className="text-xs text-center text-muted-foreground">
        By placing your order, you agree to our Terms of Service and Privacy Policy.
        Your payment information is encrypted and secure.
      </p>
    </div>
  );
}
