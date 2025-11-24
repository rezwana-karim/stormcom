/**
 * Checkout Page - Multi-step checkout flow
 * 
 * Steps:
 * 1. Cart Review
 * 2. Shipping Details
 * 3. Payment Method
 * 4. Order Confirmation (separate page)
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ShoppingCart, Truck, CreditCard, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { CartProvider } from '@/contexts/cart-context';
import { CartReviewStep } from '@/components/checkout/cart-review-step';
import { ShippingDetailsStep } from '@/components/checkout/shipping-details-step';
import { PaymentMethodStep } from '@/components/checkout/payment-method-step';

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface CheckoutStep {
  id: number;
  title: string;
  description: string;
  icon: typeof ShoppingCart;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  // const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const steps: CheckoutStep[] = [
    {
      id: 0,
      title: 'Cart Review',
      description: 'Review your items',
      icon: ShoppingCart,
    },
    {
      id: 1,
      title: 'Shipping',
      description: 'Enter delivery details',
      icon: Truck,
    },
    {
      id: 2,
      title: 'Payment',
      description: 'Complete your order',
      icon: CreditCard,
    },
  ];

  const handleCartReviewNext = () => {
    setCurrentStep(1);
  };

  const handleShippingComplete = (address: ShippingAddress) => {
    setShippingAddress(address);
    setCurrentStep(2);
  };

  const handlePaymentComplete = async (orderId: string) => {
    setIsProcessing(true);
    try {
      // Navigate to confirmation page
      router.push(`/checkout/confirmation?orderId=${orderId}`);
    } catch (error) {
      console.error('Navigation error:', error);
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <CartProvider storeId="clqm1j4k00000l8dw8z8r8z8r">
      <CheckoutPageContent 
        currentStep={currentStep}
        isProcessing={isProcessing}
        shippingAddress={shippingAddress}
        handleCartReviewNext={handleCartReviewNext}
        handleShippingComplete={handleShippingComplete}
        handlePaymentComplete={handlePaymentComplete}
        handleBack={handleBack}
        steps={steps}
      />
    </CartProvider>
  );
}

function CheckoutPageContent({
  currentStep,
  isProcessing,
  shippingAddress,
  handleCartReviewNext,
  handleShippingComplete,
  handlePaymentComplete,
  handleBack,
  steps,
}: {
  currentStep: number;
  isProcessing: boolean;
  shippingAddress: ShippingAddress | null;
  handleCartReviewNext: () => void;
  handleShippingComplete: (address: ShippingAddress) => void;
  handlePaymentComplete: (orderId: string) => Promise<void>;
  handleBack: () => void;
  steps: Array<{ id: number; title: string; icon: React.ElementType; description: string }>;
}) {
  const { cart, loading } = useCart();
  
  // Calculate dynamic values from cart
  const itemCount = cart?.itemCount ?? 0;
  const subtotal = cart?.subtotal ?? 0;
  const tax = cart?.tax ?? 0;
  const shipping = cart?.shipping ?? 0;
  const total = cart?.total ?? 0;
  const showCalculated = currentStep >= 1 && shippingAddress;

  return (
    <div className="container mx-auto py-10 max-w-6xl">
      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Page Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
            <p className="text-muted-foreground">
              Complete your order in {steps.length} simple steps
            </p>
          </div>

          {/* Checkout Steps Indicator */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = currentStep === index;
                  const isCompleted = currentStep > index;

                  return (
                    <div key={step.id} className="flex items-center flex-1">
                      <div className="flex flex-col items-center gap-2 flex-1">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                            isActive && 'border-primary bg-primary text-primary-foreground',
                            isCompleted && 'border-green-500 bg-green-500 text-white',
                            !isActive && !isCompleted && 'border-muted bg-background'
                          )}
                        >
                          {isCompleted ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
                        </div>
                        <div className="text-center">
                          <p
                            className={cn(
                              'text-sm font-medium',
                              isActive && 'text-primary',
                              isCompleted && 'text-green-600',
                              !isActive && !isCompleted && 'text-muted-foreground'
                            )}
                          >
                            {step.title}
                          </p>
                          <p className="text-xs text-muted-foreground hidden sm:block">
                            {step.description}
                          </p>
                        </div>
                      </div>
                      {index < steps.length - 1 && (
                        <Separator
                          className={cn(
                            'flex-1 mx-4',
                            isCompleted ? 'bg-green-500' : 'bg-muted'
                          )}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Step Content */}
          <Card>
            <CardHeader>
              <CardTitle>{steps[currentStep].title}</CardTitle>
              <CardDescription>{steps[currentStep].description}</CardDescription>
            </CardHeader>
            <CardContent>
              {currentStep === 0 && (
                <CartReviewStep
                  onNext={handleCartReviewNext}
                  isProcessing={isProcessing}
                />
              )}
              {currentStep === 1 && (
                <ShippingDetailsStep
                  onComplete={handleShippingComplete}
                  onBack={handleBack}
                  isProcessing={isProcessing}
                />
              )}
              {currentStep === 2 && shippingAddress && (
                <PaymentMethodStep
                  shippingAddress={shippingAddress}
                  onComplete={handlePaymentComplete}
                  onBack={handleBack}
                  isProcessing={isProcessing}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-6">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span className="font-medium">
                      {showCalculated ? `$${shipping.toFixed(2)}` : 'Calculated at next step'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span className="font-medium">
                      {showCalculated ? `$${tax.toFixed(2)}` : 'Calculated at next step'}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-semibold">
                    <span>Total</span>
                    <span>${showCalculated ? total.toFixed(2) : subtotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Promo Code - TODO: Implement promo code functionality */}
              <Button variant="outline" className="w-full">
                Add promo code
              </Button>
            </CardContent>
          </Card>

          {/* Security Badge */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-green-100 p-2">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Secure Checkout</p>
                  <p className="text-xs text-muted-foreground">
                    Your payment information is encrypted and secure
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
