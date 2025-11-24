# Checkout Implementation Plan

**Project**: StormCom E-commerce Platform  
**Date**: November 25, 2025  
**Status**: Planning Phase  
**Target Completion**: December 15, 2025

---

## Executive Summary

The checkout system is **70% complete** with core architecture in place but requires critical fixes and feature completion. This plan addresses 17 identified issues across security, functionality, and UX, prioritized by risk and user impact.

**Key Metrics**:
- 3 P0 issues (Security/Runtime errors)
- 3 P1 issues (Data integrity/Multi-tenancy)
- 6 P2 issues (Core features)
- 5 P3 issues (Enhancements)

---

## Phase 1: Critical Fixes (Week 1)
**Duration**: 3-4 hours  
**Goal**: Eliminate security risks and runtime errors

### Task 1.1: Fix Null Safety in Cart Review Component
**Priority**: P0 | **Effort**: 5 min | **File**: `cart-review-step.tsx`

**Problem**: Missing null-coalescing operators on price calculations (lines 155-159, 169)
```typescript
// Current (UNSAFE):
${(item.price * item.quantity).toFixed(2)}
${item.price.toFixed(2)}
${cart.subtotal.toFixed(2)}

// Fixed:
${((item.price ?? 0) * item.quantity).toFixed(2)}
${(item.price ?? 0).toFixed(2)}
${(cart.subtotal ?? 0).toFixed(2)}
```

**Acceptance Criteria**:
- [ ] All `.toFixed()` calls wrapped with `?? 0`
- [ ] No TypeError when cart data is undefined
- [ ] Displays "$0.00" for missing values

---

### Task 1.2: Eliminate Price Tampering Risk
**Priority**: P0 | **Effort**: 30 min | **Files**: `checkout.service.ts`, `complete/route.ts`

**Problem**: Client-submitted prices trusted without validation. User could modify price in browser devtools.

**Changes Required**:

**Step 1**: Remove price from validation schema
```typescript
// src/app/api/checkout/complete/route.ts
const completeCheckoutSchema = z.object({
  storeId: z.string().cuid(),
  items: z.array(
    z.object({
      productId: z.string().cuid(),
      variantId: z.string().cuid().optional(),
      quantity: z.number().int().positive(),
      // REMOVE: price: z.number().min(0),
    })
  ).min(1),
  // ... rest unchanged
});
```

**Step 2**: Update CartItem interface
```typescript
// src/lib/services/checkout.service.ts
export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  // REMOVE: price: number;
}
```

**Step 3**: Add price validation in validateCart
```typescript
// In CheckoutService.validateCart(), after fetching products:
// Price is now ALWAYS from database, never from client input
const price = variant?.price ?? product.price;

// Optionally log price mismatches if debugging
if (process.env.NODE_ENV === 'development') {
  console.log(`[Checkout] Product: ${product.name}, DB Price: ${price}`);
}
```

**Acceptance Criteria**:
- [ ] Price field removed from all checkout API schemas
- [ ] Prices always fetched from database
- [ ] Cart frontend updated to not send price
- [ ] Manual price tampering test fails

---

### Task 1.3: Fix Hardcoded Order Summary Values
**Priority**: P0 | **Effort**: 45 min | **File**: `checkout/page.tsx`

**Problem**: Order summary sidebar shows static "$99.98" instead of real cart totals (lines 242-266)

**Implementation**:
```typescript
// In CheckoutPageContent function, add useCart hook:
import { useCart } from '@/contexts/cart-context';

function CheckoutPageContent({ ... }) {
  const { cart, loading } = useCart();
  
  // Calculate dynamic values
  const itemCount = cart?.itemCount ?? 0;
  const subtotal = cart?.subtotal ?? 0;
  const tax = cart?.tax ?? 0;
  const shipping = cart?.shipping ?? 0;
  const total = cart?.total ?? 0;
  const showCalculated = currentStep >= 1 && shippingAddress;

  return (
    <div className="container mx-auto py-10 max-w-6xl">
      {/* ... */}
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
          {/* Promo code button unchanged */}
        </CardContent>
      </Card>
      {/* ... */}
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Order summary reads from cart context
- [ ] Shows real item count and subtotal
- [ ] Tax/shipping appear after step 1
- [ ] Loading state during cart fetch
- [ ] All values use null-coalescing

---

## Phase 2: Data Integrity & Security (Week 1)
**Duration**: 2 hours  
**Goal**: Prevent multi-tenant leaks and ensure data consistency

### Task 2.1: Add Store Access Validation
**Priority**: P1 | **Effort**: 20 min | **File**: `payment-intent/route.ts`

**Problem**: API doesn't verify user has access to the store

**Implementation**:
```typescript
// After session check, before validating request body:
const session = await getServerSession(authOptions);
if (!session?.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const body = await request.json();
const validatedData = PaymentIntentSchema.parse(body);

// ADD THIS: Verify store access
const hasAccess = await prisma.membership.findFirst({
  where: {
    userId: session.user.id,
    organization: {
      stores: {
        some: {
          id: validatedData.storeId,
        },
      },
    },
  },
});

if (!hasAccess) {
  return NextResponse.json(
    { error: 'Access denied to this store' },
    { status: 403 }
  );
}
```

**Apply to**:
- [ ] `payment-intent/route.ts`
- [ ] `complete/route.ts`
- [ ] `validate/route.ts`
- [ ] `shipping/route.ts`

**Acceptance Criteria**:
- [ ] User without store membership gets 403
- [ ] User with membership proceeds normally
- [ ] Query includes organization → stores relation

---

### Task 2.2: Validate Cart Ownership
**Priority**: P1 | **Effort**: 15 min | **File**: `checkout.service.ts`

**Problem**: No verification that cart belongs to the authenticated user

**Implementation**:
```typescript
// In CheckoutService.createOrder(), before validateCart:
async createOrder(input: CreateOrderInput, userId: string): Promise<CreatedOrder> {
  // ADD THIS: Verify cart ownership
  if (input.customerId && input.customerId !== userId) {
    throw new Error('Cannot create order for another user');
  }

  // Verify cart exists and belongs to user
  const cart = await prisma.cart.findFirst({
    where: {
      userId: input.customerId || userId,
      storeId: input.storeId,
    },
  });

  if (!cart) {
    throw new Error('Cart not found or access denied');
  }

  // Continue with existing validation...
  const validated = await this.validateCart(input.storeId, input.items);
  // ... rest unchanged
}
```

**Update API route**:
```typescript
// src/app/api/checkout/complete/route.ts
const checkoutService = CheckoutService.getInstance();
const order = await checkoutService.createOrder(
  {
    ...validatedInput,
    customerId: session.user.id, // Always use authenticated user
    ipAddress,
  },
  session.user.id // Pass userId for validation
);
```

**Acceptance Criteria**:
- [ ] Cannot submit another user's customerId
- [ ] Cart ownership verified before order creation
- [ ] Error thrown if cart not found

---

### Task 2.3: Clear Cart After Order Completion
**Priority**: P1 | **Effort**: 10 min | **File**: `checkout.service.ts`

**Problem**: Cart items remain after successful order

**Implementation**:
```typescript
// In CheckoutService.createOrder(), after transaction succeeds:
async createOrder(input: CreateOrderInput, userId: string): Promise<CreatedOrder> {
  // ... existing order creation in transaction ...

  // ADD THIS: Clear cart after successful order
  await prisma.cartItem.deleteMany({
    where: {
      cart: {
        userId: userId,
        storeId: input.storeId,
      },
    },
  });

  // Reset cart totals
  await prisma.cart.update({
    where: {
      userId_storeId: {
        userId: userId,
        storeId: input.storeId,
      },
    },
    data: {
      subtotal: 0,
      lastActivityAt: new Date(),
    },
  });

  return {
    id: order.id,
    // ... rest unchanged
  };
}
```

**Acceptance Criteria**:
- [ ] Cart items deleted after order creation
- [ ] Cart subtotal reset to 0
- [ ] User sees empty cart after checkout
- [ ] Cart badge shows 0 items

---

## Phase 3: Cart Integration & Data Flow (Week 2)
**Duration**: 4 hours  
**Goal**: Wire up real cart data throughout checkout flow

### Task 3.1: Update Payment Method Component
**Priority**: P2 | **Effort**: 30 min | **File**: `payment-method-step.tsx`

**Problem**: Shows hardcoded totals instead of cart data (lines 201-217)

**Implementation**:
```typescript
// Add useCart hook at top of component:
import { useCart } from '@/contexts/cart-context';

export function PaymentMethodStep({ ... }: PaymentMethodStepProps) {
  const { cart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate totals from cart
  const subtotal = cart?.subtotal ?? 0;
  const tax = cart?.tax ?? 0;
  const shipping = cart?.shipping ?? 0;
  const total = cart?.total ?? 0;

  const handlePlaceOrder = async () => {
    if (!cart) {
      console.error('No cart available');
      return;
    }

    setIsSubmitting(true);
    try {
      // ... existing mock payment logic ...
      
      // TODO: Replace with real API calls
      const completeResponse = await fetch('/api/checkout/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: cart.storeId,
          items: cart.items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            // DON'T send price - will be fetched from DB
          })),
          shippingAddress,
          shippingMethod: 'standard', // TODO: Get from shipping step selection
          shippingCost: shipping,
        }),
      });
      
      if (!completeResponse.ok) {
        throw new Error('Failed to complete order');
      }
      
      const { id: orderId } = await completeResponse.json();
      onComplete(orderId);
    } catch (error) {
      console.error('Payment error:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ... shipping address review unchanged ... */}
      
      {/* Order Total - UPDATE THIS SECTION */}
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
      {/* ... rest unchanged ... */}
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Reads subtotal/tax/shipping from cart
- [ ] Sends cart items to complete API
- [ ] Does not send price field
- [ ] Shows cart totals in order summary

---

### Task 3.2: Implement Shipping Calculation API
**Priority**: P2 | **Effort**: 1 hour | **Files**: `shipping-details-step.tsx`, `cart-context.tsx`

**Problem**: Shipping API exists but not called; cart doesn't store shipping cost

**Step 1**: Add shipping to cart state
```typescript
// src/contexts/cart-context.tsx
export interface Cart {
  id: string;
  storeId: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  tax: number;
  shipping: number;  // ADD THIS
  total: number;
  lastActivityAt: Date;
}

// Update addToCart, updateQuantity, removeItem to recalculate:
const updateCartTotals = async (cart: Cart) => {
  const taxRate = 0.08;
  const tax = cart.subtotal * taxRate;
  const shipping = cart.subtotal > 50 ? 0 : 10.0; // Default shipping
  const total = cart.subtotal + tax + shipping;
  
  return { ...cart, tax, shipping, total };
};
```

**Step 2**: Wire up shipping API in form
```typescript
// src/components/checkout/shipping-details-step.tsx
const onSubmit = async (data: z.infer<typeof shippingFormSchema>) => {
  setIsCalculatingShipping(true);

  try {
    // UNCOMMENT AND FIX THIS:
    const response = await fetch('/api/checkout/shipping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId: 'clqm1j4k00000l8dw8z8r8z8r', // Get from cart context
        shippingAddress: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          address: data.addressLine1,
          city: data.city,
          state: data.state,
          postalCode: data.zipCode,
          country: data.country,
        },
        items: [], // Get from cart.items
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to calculate shipping');
    }
    
    const { options } = await response.json();
    
    // TODO: Let user select shipping option
    // For now, use first option (standard)
    const selectedShipping = options[0];
    
    // Update cart with shipping cost via cart context method
    // await updateShippingCost(selectedShipping.cost);
    
    onComplete(data as ShippingAddress);
  } catch (error) {
    console.error('Shipping calculation error:', error);
    // Show error toast
  } finally {
    setIsCalculatingShipping(false);
  }
};
```

**Step 3**: Add updateShippingCost to cart context
```typescript
// src/contexts/cart-context.tsx
const updateShippingCost = async (shippingCost: number) => {
  if (!cart) return;
  
  const taxRate = 0.08;
  const tax = cart.subtotal * taxRate;
  const total = cart.subtotal + tax + shippingCost;
  
  setCart({ ...cart, shipping: shippingCost, tax, total });
};

// Export in CartContextValue:
export interface CartContextValue {
  // ... existing fields
  updateShippingCost: (cost: number) => Promise<void>;
}
```

**Acceptance Criteria**:
- [ ] Shipping API called on address submit
- [ ] Cart state updated with shipping cost
- [ ] Tax recalculated based on address
- [ ] Total reflects shipping + tax changes
- [ ] Cart persists shipping across steps

---

### Task 3.3: Add Shipping Method Selection UI
**Priority**: P2 | **Effort**: 1 hour | **File**: `shipping-details-step.tsx`

**Problem**: No UI to choose shipping speed (standard vs express)

**Implementation**:
```typescript
// Add state for shipping options:
const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
const [selectedOption, setSelectedOption] = useState<string>('');

// After fetching shipping options:
const { options } = await response.json();
setShippingOptions(options);
setSelectedOption(options[0]?.id || 'standard');

// Add UI before submit button:
{shippingOptions.length > 0 && (
  <div className="space-y-4">
    <h3 className="text-lg font-medium">Shipping Method</h3>
    <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
      {shippingOptions.map(option => (
        <Card key={option.id}>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <RadioGroupItem value={option.id} id={option.id} />
              <Label htmlFor={option.id} className="flex justify-between flex-1 cursor-pointer">
                <div>
                  <p className="font-medium">{option.name}</p>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
                <p className="font-medium">${option.cost.toFixed(2)}</p>
              </Label>
            </div>
          </CardContent>
        </Card>
      ))}
    </RadioGroup>
  </div>
)}
```

**Acceptance Criteria**:
- [ ] Shipping options displayed after address entry
- [ ] User can select shipping speed
- [ ] Selected option updates cart cost
- [ ] Free shipping shown when applicable

---

## Phase 4: Payment Integration (Week 3)
**Duration**: 6 hours  
**Goal**: Enable real Stripe payment processing

### Task 4.1: Install Stripe Dependencies
**Priority**: P2 | **Effort**: 5 min

```bash
npm install @stripe/stripe-js stripe
npm install -D @types/stripe
```

**Environment Variables** (`.env.local`):
```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

### Task 4.2: Create Stripe Client Wrapper
**Priority**: P2 | **Effort**: 15 min | **File**: `lib/stripe.ts` (NEW)

```typescript
// src/lib/stripe.ts
import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// Server-side Stripe client
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});
```

---

### Task 4.3: Implement Real Payment Intent Creation
**Priority**: P2 | **Effort**: 30 min | **File**: `payment-intent/route.ts`

**Replace mock with real Stripe call**:
```typescript
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    // ... existing auth and validation ...

    // REPLACE MOCK with real Stripe payment intent:
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(validatedData.amount * 100), // Convert to cents
      currency: validatedData.currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        orderId: validatedData.orderId,
        orderNumber: order.orderNumber,
        storeId: validatedData.storeId,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      },
    });
  } catch (error) {
    console.error('[POST /api/checkout/payment-intent] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria**:
- [ ] Creates real Stripe PaymentIntent
- [ ] Returns client_secret for frontend
- [ ] Stores orderId in metadata
- [ ] Handles Stripe API errors

---

### Task 4.4: Integrate Stripe Elements in Payment Step
**Priority**: P2 | **Effort**: 2 hours | **File**: `payment-method-step.tsx`

**Step 1**: Wrap checkout page with Elements provider
```typescript
// src/app/checkout/page.tsx
'use client';

import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe';
import { useState, useEffect } from 'react';

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(0);

  // Create payment intent when reaching payment step
  useEffect(() => {
    if (currentStep === 2 && !clientSecret) {
      createPaymentIntent();
    }
  }, [currentStep]);

  const createPaymentIntent = async () => {
    try {
      // First, create order to get orderId
      const createOrderResponse = await fetch('/api/checkout/create-pending-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: 'clqm1j4k00000l8dw8z8r8z8r',
          // ... cart items, shipping address
        }),
      });

      const { orderId, totalAmount } = await createOrderResponse.json();

      // Then create payment intent
      const response = await fetch('/api/checkout/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: 'clqm1j4k00000l8dw8z8r8z8r',
          orderId,
          amount: totalAmount,
          currency: 'usd',
        }),
      });

      const { data } = await response.json();
      setClientSecret(data.clientSecret);
    } catch (error) {
      console.error('Failed to create payment intent:', error);
    }
  };

  const stripePromise = getStripe();

  return (
    <CartProvider storeId="clqm1j4k00000l8dw8z8r8z8r">
      {currentStep === 2 && clientSecret ? (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutPageContent 
            currentStep={currentStep}
            // ... props
          />
        </Elements>
      ) : (
        <CheckoutPageContent 
          currentStep={currentStep}
          // ... props
        />
      )}
    </CartProvider>
  );
}
```

**Step 2**: Replace payment form placeholder
```typescript
// src/components/checkout/payment-method-step.tsx
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

export function PaymentMethodStep({ ... }: PaymentMethodStepProps) {
  const stripe = useStripe();
  const elements = useElements();

  const handlePlaceOrder = async () => {
    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/confirmation`,
          payment_method_data: {
            billing_details: {
              name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
              email: shippingAddress.email,
              phone: shippingAddress.phone,
              address: {
                line1: shippingAddress.addressLine1,
                line2: shippingAddress.addressLine2,
                city: shippingAddress.city,
                state: shippingAddress.state,
                postal_code: shippingAddress.zipCode,
                country: shippingAddress.country,
              },
            },
          },
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error('Payment failed:', error);
        // TODO: Show error toast
        setIsSubmitting(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        // Payment successful, complete order
        const completeResponse = await fetch('/api/checkout/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            // ... other order details
          }),
        });

        const { id: orderId } = await completeResponse.json();
        onComplete(orderId);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ... shipping review ... */}

      {/* REPLACE PLACEHOLDER with real Stripe Elements */}
      <Card>
        <CardContent className="pt-6">
          <PaymentElement />
        </CardContent>
      </Card>

      {/* ... order total and actions ... */}
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] PaymentElement renders Stripe form
- [ ] Supports card, Google Pay, Apple Pay
- [ ] Billing address auto-filled from shipping
- [ ] Payment confirmed before order creation
- [ ] Handles 3D Secure authentication

---

### Task 4.5: Create Stripe Webhook Handler
**Priority**: P2 | **Effort**: 1.5 hours | **File**: `api/webhooks/stripe/route.ts` (NEW)

```typescript
// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { PaymentStatus, OrderStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle different event types
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handlePaymentSuccess(paymentIntent);
      break;

    case 'payment_intent.payment_failed':
      const failedIntent = event.data.object;
      await handlePaymentFailure(failedIntent);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentSuccess(paymentIntent: any) {
  const orderId = paymentIntent.metadata.orderId;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: PaymentStatus.PAID,
      status: OrderStatus.CONFIRMED,
      paidAt: new Date(),
      paymentIntentId: paymentIntent.id,
    },
  });

  // TODO: Send order confirmation email
  console.log(`Payment succeeded for order ${orderId}`);
}

async function handlePaymentFailure(paymentIntent: any) {
  const orderId = paymentIntent.metadata.orderId;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: PaymentStatus.FAILED,
      status: OrderStatus.CANCELLED,
    },
  });

  console.log(`Payment failed for order ${orderId}`);
}
```

**Stripe CLI Setup** (for local testing):
```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Acceptance Criteria**:
- [ ] Webhook verifies Stripe signature
- [ ] Updates order status on payment success
- [ ] Marks order cancelled on payment failure
- [ ] Logs all webhook events
- [ ] Works with Stripe CLI locally

---

## Phase 5: Order Confirmation & Notifications (Week 3)
**Duration**: 3 hours  
**Goal**: Complete post-checkout experience

### Task 5.1: Create Order Details API
**Priority**: P2 | **Effort**: 45 min | **File**: `api/orders/[orderId]/route.ts` (NEW)

```typescript
// src/app/api/orders/[orderId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: params.orderId,
        // Security: Only allow viewing own orders or orders in user's store
        OR: [
          { customerId: session.user.id },
          {
            store: {
              organization: {
                memberships: {
                  some: { userId: session.user.id },
                },
              },
            },
          },
        ],
        deletedAt: null,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                thumbnailUrl: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Parse JSON addresses
    const shippingAddress = JSON.parse(order.shippingAddress as string);
    const billingAddress = JSON.parse(order.billingAddress as string);

    return NextResponse.json({
      ...order,
      shippingAddress,
      billingAddress,
      subtotal: Number(order.subtotal),
      taxAmount: Number(order.taxAmount),
      shippingAmount: Number(order.shippingAmount),
      discountAmount: Number(order.discountAmount),
      totalAmount: Number(order.totalAmount),
      items: order.items.map(item => ({
        ...item,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
        taxAmount: Number(item.taxAmount),
        discountAmount: Number(item.discountAmount),
        totalAmount: Number(item.totalAmount),
      })),
    });
  } catch (error) {
    console.error('GET /api/orders/[orderId] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria**:
- [ ] Returns full order details
- [ ] Includes order items with product info
- [ ] Parses shipping/billing addresses
- [ ] Enforces ownership security
- [ ] Handles deleted orders

---

### Task 5.2: Fetch Order Details in Confirmation Page
**Priority**: P2 | **Effort**: 30 min | **File**: `checkout/confirmation/page.tsx`

**Replace mock with real data fetch**:
```typescript
function ConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams?.get('orderId');
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!orderId) {
      router.push('/checkout');
      return;
    }

    // REPLACE MOCK with real API call:
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (!response.ok) {
          throw new Error('Order not found');
        }
        const data = await response.json();
        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order');
        console.error('Failed to fetch order:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, router]);

  if (isLoading) {
    // ... loading state
  }

  if (error || !order) {
    return (
      <div className="container mx-auto py-20 max-w-2xl">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error || 'Order not found'}</p>
            <Button onClick={() => router.push('/dashboard/orders')}>
              View All Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-3xl">
      {/* ... success header ... */}
      
      {/* UPDATE Order Details with real data */}
      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
          <CardDescription>Order #{order.orderNumber}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order Number</span>
              <span className="font-medium">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order Date</span>
              <span className="font-medium">
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order Total</span>
              <span className="font-medium">${order.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment Status</span>
              <span className="font-medium capitalize">{order.paymentStatus.toLowerCase()}</span>
            </div>
          </div>

          {/* Add Order Items */}
          <Separator />
          <div className="space-y-3">
            <h3 className="font-medium">Items</h3>
            {order.items.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.productName} x{item.quantity}</span>
                <span>${item.totalAmount.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Add Shipping Address */}
          <Separator />
          <div className="space-y-1 text-sm">
            <h3 className="font-medium">Shipping Address</h3>
            <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
            <p>{order.shippingAddress.address}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </CardContent>
      </Card>
      {/* ... rest unchanged ... */}
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Fetches real order data from API
- [ ] Displays order number, date, total
- [ ] Shows all order items
- [ ] Shows shipping address
- [ ] Shows payment status
- [ ] Error handling for missing orders

---

### Task 5.3: Setup Email Notifications
**Priority**: P3 | **Effort**: 2 hours | **File**: `lib/email.ts` (NEW)

**Install Resend** (already configured in project):
```typescript
// src/lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface OrderConfirmationEmailData {
  to: string;
  orderNumber: string;
  orderDate: string;
  totalAmount: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export async function sendOrderConfirmationEmail(data: OrderConfirmationEmailData) {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: data.to,
      subject: `Order Confirmation - ${data.orderNumber}`,
      html: `
        <h1>Thank you for your order!</h1>
        <p>Your order <strong>${data.orderNumber}</strong> has been confirmed.</p>
        
        <h2>Order Summary</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid #ddd;">
              <th style="text-align: left; padding: 8px;">Item</th>
              <th style="text-align: center; padding: 8px;">Qty</th>
              <th style="text-align: right; padding: 8px;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map(item => `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px;">${item.name}</td>
                <td style="text-align: center; padding: 8px;">${item.quantity}</td>
                <td style="text-align: right; padding: 8px;">$${item.price.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <p style="text-align: right; font-size: 18px; margin-top: 16px;">
          <strong>Total: $${data.totalAmount.toFixed(2)}</strong>
        </p>
        
        <h2>Shipping Address</h2>
        <p>
          ${data.shippingAddress.firstName} ${data.shippingAddress.lastName}<br />
          ${data.shippingAddress.address}<br />
          ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}<br />
          ${data.shippingAddress.country}
        </p>
        
        <p>We'll send you another email when your order ships.</p>
      `,
    });
    console.log(`Order confirmation email sent to ${data.to}`);
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    // Don't throw - email failure shouldn't break checkout
  }
}
```

**Call in webhook handler**:
```typescript
// src/app/api/webhooks/stripe/route.ts
import { sendOrderConfirmationEmail } from '@/lib/email';

async function handlePaymentSuccess(paymentIntent: any) {
  const orderId = paymentIntent.metadata.orderId;

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: PaymentStatus.PAID,
      status: OrderStatus.CONFIRMED,
      paidAt: new Date(),
      paymentIntentId: paymentIntent.id,
    },
    include: {
      items: true,
      customer: true,
    },
  });

  // Send confirmation email
  const shippingAddress = JSON.parse(order.shippingAddress as string);
  await sendOrderConfirmationEmail({
    to: order.customer?.email || shippingAddress.email,
    orderNumber: order.orderNumber,
    orderDate: order.createdAt.toLocaleDateString(),
    totalAmount: Number(order.totalAmount),
    items: order.items.map(item => ({
      name: item.productName,
      quantity: item.quantity,
      price: Number(item.price),
    })),
    shippingAddress,
  });
}
```

**Acceptance Criteria**:
- [ ] Email sent on successful payment
- [ ] Contains order number, items, total
- [ ] Includes shipping address
- [ ] Uses Resend API (already configured)
- [ ] Graceful failure (doesn't break checkout)

---

## Phase 6: Enhancements & Polish (Week 4)
**Duration**: 4 hours  
**Goal**: Improve UX and add missing features

### Task 6.1: Add Discount Code Validation
**Priority**: P3 | **Effort**: 1.5 hours

**Create discount service** (`lib/services/discount.service.ts`):
```typescript
export class DiscountService {
  async validateDiscountCode(code: string, storeId: string, subtotal: number) {
    const discount = await prisma.discountCode.findFirst({
      where: {
        code: code.toUpperCase(),
        storeId,
        isActive: true,
        validFrom: { lte: new Date() },
        validUntil: { gte: new Date() },
        deletedAt: null,
      },
    });

    if (!discount) {
      return { isValid: false, error: 'Invalid or expired discount code' };
    }

    if (discount.minOrderAmount && subtotal < Number(discount.minOrderAmount)) {
      return {
        isValid: false,
        error: `Minimum order amount is $${discount.minOrderAmount}`,
      };
    }

    const discountAmount = discount.type === 'PERCENTAGE'
      ? (subtotal * Number(discount.value)) / 100
      : Number(discount.value);

    return {
      isValid: true,
      discountAmount: Math.min(discountAmount, subtotal),
      code: discount.code,
    };
  }
}
```

**Add promo code UI** in checkout sidebar

---

### Task 6.2: Create Order History Page
**Priority**: P3 | **Effort**: 2 hours | **File**: `dashboard/orders/page.tsx`

List all user orders with filtering and pagination

---

### Task 6.3: Add Inventory Race Condition Protection
**Priority**: P3 | **Effort**: 30 min

**Use database-level locks**:
```typescript
// In CheckoutService.createOrder transaction:
await tx.$executeRaw`
  UPDATE Product
  SET inventoryQty = inventoryQty - ${item.quantity}
  WHERE id = ${item.productId}
    AND inventoryQty >= ${item.quantity}
`;

// Check if update succeeded
const updated = await tx.product.findFirst({
  where: { id: item.productId },
  select: { inventoryQty: true },
});

if (!updated || updated.inventoryQty < 0) {
  throw new Error('Insufficient stock');
}
```

---

## Testing Checklist

### Unit Tests (Optional - No test suite currently)
- [ ] CheckoutService.validateCart()
- [ ] CheckoutService.calculateShipping()
- [ ] CheckoutService.calculateTax()
- [ ] CheckoutService.createOrder()

### Integration Tests
- [ ] Full checkout flow (cart → shipping → payment → confirmation)
- [ ] Multi-tenant isolation (user A can't access user B's cart/orders)
- [ ] Inventory reduction on order
- [ ] Cart clearing after order
- [ ] Price tampering prevention
- [ ] Stripe webhook processing

### Manual Testing
- [ ] Add items to cart
- [ ] Proceed to checkout
- [ ] Enter shipping address
- [ ] See shipping options
- [ ] Select payment method
- [ ] Complete payment with test card
- [ ] Receive confirmation email
- [ ] View order in order history
- [ ] Verify inventory reduced

### Test Cards (Stripe)
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0027 6000 3184
```

---

## Deployment Checklist

### Environment Variables
- [ ] `STRIPE_SECRET_KEY` set in production
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` set
- [ ] `STRIPE_WEBHOOK_SECRET` set
- [ ] `RESEND_API_KEY` verified working
- [ ] `EMAIL_FROM` domain verified in Resend

### Database
- [ ] Run all migrations on production
- [ ] Verify Order, OrderItem tables exist
- [ ] Check indexes on frequently queried fields

### Stripe Setup
- [ ] Create live Stripe account
- [ ] Add webhook endpoint in Stripe dashboard
- [ ] Configure webhook to send payment_intent.* events
- [ ] Test webhook with live events

### Monitoring
- [ ] Add error tracking (Sentry)
- [ ] Monitor checkout conversion rate
- [ ] Track payment failures
- [ ] Set up order notification alerts

---

## Success Metrics

**Week 1 (Phase 1-2)**:
- [ ] Zero runtime errors in checkout flow
- [ ] All cart totals display correctly
- [ ] Multi-tenant security validated

**Week 2 (Phase 3)**:
- [ ] Real cart data flows through all steps
- [ ] Shipping calculated from address
- [ ] Order created with correct totals

**Week 3 (Phase 4-5)**:
- [ ] Stripe payment processing live
- [ ] Webhook updates order status
- [ ] Confirmation emails sent

**Week 4 (Phase 6)**:
- [ ] Discount codes working
- [ ] Order history accessible
- [ ] Full system tested end-to-end

**Final Goal**: Functional, secure checkout system with real payment processing, ready for production deployment.

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Stripe integration delays | Medium | High | Start early, use test mode first |
| Inventory race conditions | Low | Medium | Add database locks in Phase 6 |
| Payment webhook failures | Medium | High | Implement retry logic + manual reconciliation |
| Email delivery issues | Low | Low | Use reliable provider (Resend), log failures |
| Security vulnerabilities | Medium | Critical | Security audit after Phase 2 |

---

## Notes

- **Do not proceed to next phase until previous phase acceptance criteria met**
- **Test multi-tenant security at every step**
- **All monetary values use 2 decimal precision**
- **Stripe test mode during development, live keys only in production**
- **Keep cart context as single source of truth for totals**
- **Never trust client-submitted prices - always validate from database**

---

**Document Version**: 1.0  
**Last Updated**: November 25, 2025  
**Next Review**: After Phase 2 completion
