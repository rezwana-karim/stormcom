# Stripe Payment Integration - Testing Guide

## Overview
This guide provides step-by-step instructions for testing the Stripe payment integration implementation.

## Prerequisites

1. **Stripe Account**
   - Sign up at https://stripe.com
   - Get test mode API keys from Dashboard > Developers > API keys
   - Set up webhook endpoint in Dashboard > Developers > Webhooks

2. **Environment Setup**
   ```bash
   # Update .env.local with your Stripe test keys
   STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY
   STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_KEY
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
   ```

3. **Database Setup**
   ```bash
   npm run prisma:generate
   npm run db:seed  # Optional: seed test data
   ```

4. **Stripe CLI** (for webhook testing)
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Login
   stripe login
   ```

## Test Cases

### 1. Successful Payment Flow

**Objective:** Verify end-to-end payment completion

**Steps:**
1. Create a test order via API or UI
2. Get the order ID
3. Call the payment session creation API:
   ```bash
   curl -X POST http://localhost:3000/api/payments/create-session \
     -H "Content-Type: application/json" \
     -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
     -d '{"orderId": "clxxx..."}'
   ```
4. Open the returned `sessionUrl` in browser
5. Complete payment with test card: `4242 4242 4242 4242`
6. Verify order status changed to PAID in database
7. Verify PaymentAttempt created with status SUCCESS
8. Verify paidAt timestamp set

**Expected Results:**
- Order.status = "PAID"
- Order.paymentStatus = "PAID"
- Order.paidAt = timestamp
- PaymentAttempt.status = "SUCCESS"
- PaymentAttempt.externalId = Stripe payment intent ID
- AuditLog entry created with action "PAYMENT_COMPLETED"

### 2. Declined Payment

**Objective:** Verify payment failure handling

**Steps:**
1. Create a test order
2. Create payment session
3. Use declined test card: `4000 0000 0000 0002`
4. Verify order status changed to PAYMENT_FAILED
5. Check PaymentAttempt for error details

**Expected Results:**
- Order.status = "PAYMENT_FAILED"
- Order.paymentStatus = "FAILED"
- PaymentAttempt.status = "FAILED"
- PaymentAttempt.errorCode = "card_declined"
- PaymentAttempt.errorMessage contains error description

### 3. Full Refund

**Objective:** Verify full refund processing and inventory restoration

**Steps:**
1. Complete a successful payment (Test Case 1)
2. Note the product inventory quantities before refund
3. Process full refund:
   ```bash
   curl -X POST http://localhost:3000/api/payments/refund \
     -H "Content-Type: application/json" \
     -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
     -d '{
       "orderId": "clxxx...",
       "amount": 100.00,
       "reason": "REQUESTED_BY_CUSTOMER"
     }'
   ```
4. Verify inventory restored
5. Check order status

**Expected Results:**
- Order.status = "REFUNDED"
- Order.refundedAmount = Order.totalAmount
- Refund.status = "COMPLETED"
- Refund.externalId = Stripe refund ID
- Product inventory quantities incremented by order quantities

### 4. Partial Refund

**Objective:** Verify partial refund handling

**Steps:**
1. Complete a successful payment for $100
2. Process partial refund for $40:
   ```bash
   curl -X POST http://localhost:3000/api/payments/refund \
     -H "Content-Type: application/json" \
     -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
     -d '{
       "orderId": "clxxx...",
       "amount": 40.00
     }'
   ```
3. Verify refundable balance

**Expected Results:**
- Order.status remains "PAID" or "PROCESSING"
- Order.refundedAmount = 40.00
- Refund.status = "COMPLETED"
- Refund.amount = 40.00
- Inventory NOT restored (partial refund)
- Refundable balance = $60.00

### 5. Multi-Currency Payment

**Objective:** Verify BDT (Bangladeshi Taka) payment processing

**Steps:**
1. Create store with currency = "BDT"
2. Create order with amount in BDT (e.g., 1000 BDT)
3. Create payment session
4. Verify Stripe session created with currency "bdt"
5. Verify amount converted to paisa (100000 paisa)

**Expected Results:**
- PaymentAttempt.currency = "BDT"
- PaymentAttempt.amount = 1000 (in taka)
- Stripe session amount_total = 100000 (in paisa)

### 6. Webhook Signature Verification

**Objective:** Verify webhook security

**Steps:**
1. Send webhook with invalid signature:
   ```bash
   curl -X POST http://localhost:3000/api/webhooks/stripe \
     -H "stripe-signature: invalid_signature" \
     -d '{"type": "checkout.session.completed"}'
   ```
2. Verify 400 response

**Expected Results:**
- HTTP 400 Bad Request
- Response: `{"error": "Invalid signature"}`
- Webhook event NOT processed

### 7. Webhook Event Processing

**Objective:** Verify webhook handlers using Stripe CLI

**Steps:**
1. Start dev server: `npm run dev`
2. Forward webhooks: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. Trigger events:
   ```bash
   # Successful checkout
   stripe trigger checkout.session.completed
   
   # Payment succeeded
   stripe trigger payment_intent.succeeded
   
   # Payment failed
   stripe trigger payment_intent.payment_failed
   
   # Charge refunded
   stripe trigger charge.refunded
   ```
4. Check console logs for event processing
5. Verify database updates

**Expected Results:**
- Each event processed successfully
- Corresponding database records updated
- Webhook returns 200 OK

### 8. Multi-Tenancy Isolation

**Objective:** Verify payment isolation between stores

**Steps:**
1. Create two stores (Store A and Store B)
2. Create order in Store A
3. Attempt to create payment session as user from Store B
4. Verify access denied

**Expected Results:**
- HTTP 403 Forbidden
- Response: `{"error": "Access denied"}`
- Payment session NOT created

### 9. Idempotency

**Objective:** Verify duplicate refund prevention

**Steps:**
1. Complete a successful payment
2. Note the refund count in database
3. Process refund twice with same data
4. Verify only one refund created

**Expected Results:**
- First refund: Success
- Second refund: Idempotent (Stripe returns same refund)
- Only one Refund record in database

### 10. Stripe Connect

**Objective:** Verify multi-tenant payment routing

**Steps:**
1. Set Store.stripeAccountId to a test connected account ID
2. Create payment session
3. Verify Stripe API called with stripeAccount parameter
4. Check Stripe dashboard for payment under connected account

**Expected Results:**
- Payment routed to connected account
- Platform receives connect fee (if configured)

## Performance Testing

### Response Time Benchmarks

**Create Checkout Session:** < 500ms
```bash
time curl -X POST http://localhost:3000/api/payments/create-session \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=TOKEN" \
  -d '{"orderId": "clxxx..."}'
```

**Webhook Processing:** < 2 seconds
Monitor webhook endpoint response times in Stripe dashboard.

**Refund Processing:** < 3 seconds
```bash
time curl -X POST http://localhost:3000/api/payments/refund \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=TOKEN" \
  -d '{"orderId": "clxxx...", "amount": 50.00}'
```

## Database Verification

After each test, verify database state:

```sql
-- Check order status
SELECT id, orderNumber, status, paymentStatus, paidAt, refundedAmount 
FROM Order 
WHERE id = 'clxxx...';

-- Check payment attempts
SELECT id, provider, amount, currency, status, errorCode, processedAt 
FROM PaymentAttempt 
WHERE orderId = 'clxxx...';

-- Check refunds
SELECT id, amount, status, externalId, reason, processedAt 
FROM Refund 
WHERE orderId = 'clxxx...';

-- Check audit logs
SELECT action, entityType, entityId, changes 
FROM AuditLog 
WHERE entityId = 'clxxx...' 
ORDER BY createdAt DESC;
```

## Error Scenarios

### Test Error Handling

1. **Expired Card:** `4000 0000 0000 0069`
2. **Processing Error:** `4000 0000 0000 0119`
3. **Insufficient Funds:** `4000 0000 0000 9995`

For each, verify:
- Appropriate error code stored
- User-friendly error message
- Order remains in PAYMENT_FAILED state
- User can retry payment

## Security Checklist

- [ ] Webhook signatures verified
- [ ] API keys never exposed to client
- [ ] Authentication required for all payment APIs
- [ ] Multi-tenant queries filtered by storeId
- [ ] User access validated before operations
- [ ] Stripe API errors logged but not exposed to users
- [ ] HTTPS enforced for webhook endpoints
- [ ] Environment variables properly configured
- [ ] No hardcoded credentials in code

## Integration Testing

For complete integration testing:

1. Set up test Stripe account
2. Configure webhook endpoint in Stripe dashboard
3. Run full payment flow from order creation to refund
4. Verify all database records created correctly
5. Check Stripe dashboard for payment records
6. Test failure scenarios
7. Verify audit trail completeness

## Troubleshooting

**Payment session creation fails:**
- Check STRIPE_SECRET_KEY is set
- Verify order exists and status is PENDING
- Check user has access to store

**Webhook not received:**
- Verify webhook URL in Stripe dashboard
- Check STRIPE_WEBHOOK_SECRET matches
- Use Stripe CLI to test locally

**Refund fails:**
- Verify payment was successful
- Check refund amount ≤ order total
- Ensure payment intent ID exists

**Type errors during build:**
- Run `npm run prisma:generate`
- Check Stripe API version matches

## Success Criteria

All tests pass when:
- ✅ Type-check passes
- ✅ Lint passes (0 errors, 1 expected warning)
- ✅ Build succeeds
- ✅ All 10 test cases pass
- ✅ Performance targets met
- ✅ Security checklist complete
- ✅ No CodeQL alerts
- ✅ No dependency vulnerabilities
