# Stripe Payment Integration

## Overview

This implementation provides complete Stripe payment integration for StormCom, including:
- Checkout session creation
- Webhook handling for payment events
- Refund processing
- Multi-currency support
- Stripe Connect for multi-tenant payments

## Architecture

### Database Models

#### PaymentAttempt
Tracks all payment attempts for orders.

```typescript
{
  id: string
  orderId: string
  storeId: string
  provider: string // "STRIPE"
  amount: number
  currency: string // "USD", "BDT", "EUR", etc.
  status: "PENDING" | "SUCCESS" | "FAILED"
  externalId: string // Stripe payment intent ID
  errorCode?: string
  errorMessage?: string
  metadata?: string // JSON: { sessionId, sessionUrl }
  processedAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

#### Refund
Tracks refund transactions.

```typescript
{
  id: string
  orderId: string
  storeId: string
  paymentAttemptId: string
  amount: number
  status: "PENDING" | "COMPLETED" | "FAILED"
  externalId?: string // Stripe refund ID
  reason?: string
  processedAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

### Services

#### PaymentService (`src/lib/services/payment.service.ts`)

**createCheckoutSession(params)**
- Creates Stripe Checkout session
- Supports multi-currency (USD, BDT, EUR, GBP, etc.)
- Handles Stripe Connect for multi-tenant payments
- Creates pending PaymentAttempt record

**processRefund(params)**
- Processes full or partial refunds
- Restores inventory on full refund
- Updates order status to REFUNDED when fully refunded
- Supports idempotency via idempotencyKey

**getPaymentIntent(paymentIntentId, stripeAccountId?)**
- Retrieves payment intent details from Stripe

### API Routes

#### POST /api/payments/create-session
Creates Stripe Checkout session for an order.

**Request:**
```json
{
  "orderId": "clxxx..."
}
```

**Response:**
```json
{
  "sessionId": "cs_test_...",
  "sessionUrl": "https://checkout.stripe.com/..."
}
```

**Authentication:** Required (NextAuth session)
**Validation:**
- Order must exist
- User must have access to store
- Order status must be PENDING or PAYMENT_FAILED

#### POST /api/payments/refund
Processes refund for an order.

**Request:**
```json
{
  "orderId": "clxxx...",
  "amount": 50.00,
  "reason": "REQUESTED_BY_CUSTOMER" // optional
}
```

**Response:**
```json
{
  "success": true,
  "refund": {
    "id": "clyyy...",
    "amount": 50.00,
    "status": "COMPLETED",
    "externalId": "re_...",
    "processedAt": "2024-12-06T18:00:00Z"
  }
}
```

**Authentication:** Required (NextAuth session)
**Validation:**
- Order must exist
- User must have access to store
- Order status must be PAID, PROCESSING, or DELIVERED
- Refund amount must not exceed order total

#### POST /api/webhooks/stripe
Handles Stripe webhook events.

**Supported Events:**
- `checkout.session.completed`: Updates order to PAID, marks payment attempt SUCCESS
- `payment_intent.succeeded`: Updates payment attempt to SUCCESS
- `payment_intent.payment_failed`: Updates order to PAYMENT_FAILED with error details
- `charge.refunded`: Updates refund status to COMPLETED

**Security:** 
- Verifies webhook signature using STRIPE_WEBHOOK_SECRET
- Returns 400 for invalid signatures

### Components

#### CheckoutButton (`src/components/checkout-button.tsx`)
Client component that initiates Stripe checkout flow.

**Props:**
```typescript
{
  orderId: string
  disabled?: boolean
  className?: string
}
```

**Usage:**
```tsx
import { CheckoutButton } from "@/components/checkout-button";

<CheckoutButton orderId={order.id} />
```

## Environment Variables

Required environment variables in `.env.local`:

```bash
# Stripe Test Mode
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Production
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Multi-Currency Support

The system supports multiple currencies through the Store model's `currency` field.

**Supported Currencies:**
- USD (United States Dollar)
- BDT (Bangladeshi Taka)
- EUR (Euro)
- GBP (British Pound)
- And all other Stripe-supported currencies

**Implementation:**
- Amounts stored in base currency (e.g., dollars, taka)
- Converted to smallest unit (cents, paisa) for Stripe: `Math.round(amount * 100)`
- Currency code passed to Stripe in lowercase: `currency.toLowerCase()`

## Multi-Tenancy (Stripe Connect)

Each store can have its own Stripe Connect account for payment routing.

**Store Configuration:**
```typescript
{
  stripeAccountId: "acct_..." // Stripe Connect account ID
  stripeSecretKey: "sk_..." // Encrypted secret key
  stripePublishableKey: "pk_..." // Publishable key
}
```

**Payment Routing:**
When creating checkout session or processing refund, if store has `stripeAccountId`:
```typescript
stripe.checkout.sessions.create(
  sessionOptions,
  { stripeAccount: store.stripeAccountId }
);
```

## Payment Flow

### 1. Checkout Initiation
```
User clicks "Proceed to Payment"
  ↓
CheckoutButton calls /api/payments/create-session
  ↓
PaymentService.createCheckoutSession()
  ↓
Create PaymentAttempt (PENDING)
  ↓
Return Stripe Checkout URL
  ↓
Redirect user to Stripe Checkout
```

### 2. Payment Completion
```
User completes payment on Stripe
  ↓
Stripe sends webhook: checkout.session.completed
  ↓
Webhook handler verifies signature
  ↓
Update PaymentAttempt (SUCCESS)
Update Order (PAID, paidAt = now)
Create AuditLog
  ↓
User redirected to success page
```

### 3. Payment Failure
```
Payment fails (declined card, etc.)
  ↓
Stripe sends webhook: payment_intent.payment_failed
  ↓
Update PaymentAttempt (FAILED, errorCode, errorMessage)
Update Order (PAYMENT_FAILED)
  ↓
User can retry payment
```

### 4. Refund Processing
```
Admin initiates refund
  ↓
POST /api/payments/refund
  ↓
PaymentService.processRefund()
  ↓
Create refund in Stripe
Create Refund record (PENDING/COMPLETED)
  ↓
If full refund:
  - Update Order (REFUNDED)
  - Restore inventory
If partial refund:
  - Update Order.refundedAmount
  ↓
Stripe sends webhook: charge.refunded
  ↓
Update Refund (COMPLETED)
```

## Testing

### Test Cards

**Successful Payment:**
```
Card: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
```

**Declined Payment:**
```
Card: 4000 0000 0000 0002
Expiry: Any future date
CVC: Any 3 digits
```

**Insufficient Funds:**
```
Card: 4000 0000 0000 9995
```

### Webhook Testing with Stripe CLI

**Install Stripe CLI:**
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux/Windows
# Download from https://github.com/stripe/stripe-cli/releases
```

**Login and Forward Webhooks:**
```bash
# Login
stripe login

# Forward webhooks to local dev server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Trigger Test Events:**
```bash
# Successful checkout
stripe trigger checkout.session.completed

# Payment succeeded
stripe trigger payment_intent.succeeded

# Payment failed
stripe trigger payment_intent.payment_failed

# Refund completed
stripe trigger charge.refunded
```

## Error Handling

### Payment Attempt Errors
Stored in PaymentAttempt model:
- `errorCode`: Stripe error code (e.g., "card_declined", "insufficient_funds")
- `errorMessage`: Human-readable error message

### Common Error Codes
- `card_declined`: Card was declined
- `expired_card`: Card has expired
- `insufficient_funds`: Insufficient funds
- `invalid_cvc`: Invalid security code
- `processing_error`: Error processing the card

### Webhook Error Handling
- Invalid signature: Returns 400 status
- Missing orderId: Logs error and returns 200 (to prevent retries)
- Database errors: Logs error and returns 500 (Stripe will retry)

## Security

### Webhook Signature Verification
All webhooks must pass signature verification:
```typescript
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  webhookSecret
);
```

### API Authentication
All payment APIs require authenticated NextAuth session.

### Multi-Tenant Isolation
- All queries filtered by `storeId`
- User access validated via Membership relation
- Stripe Connect accounts isolated per store

### Environment Security
- API keys stored in environment variables
- Store-specific keys encrypted in database
- Never expose secret keys to client

## Performance Targets

- Create checkout session: < 500ms
- Process webhook: < 2 seconds
- Process refund: < 3 seconds

## Audit Trail

All payment events logged in AuditLog:
```typescript
{
  action: "PAYMENT_COMPLETED",
  entityType: "Order",
  entityId: orderId,
  changes: {
    paymentIntentId: "pi_...",
    amount: 5000
  }
}
```

## Future Enhancements

1. **Subscription Support**: Recurring payments via Stripe Subscriptions
2. **Payment Method Storage**: Save cards for future payments
3. **3D Secure**: Enhanced authentication for European cards
4. **Alternative Payment Methods**: Bank transfers, wallets, etc.
5. **Split Payments**: Platform fee + vendor payout
6. **Dispute Management**: Handle chargebacks and disputes
7. **Payment Analytics**: Revenue reports and trends
