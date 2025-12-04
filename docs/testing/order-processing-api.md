# Order Processing API - Testing Guide

## Overview
This document provides comprehensive testing instructions for the Order Processing API implementation (Phase 1: Order Management).

## Prerequisites
- Next.js dev server running (`npm run dev`)
- Database migrated (`npm run prisma:migrate:dev` or `npm run prisma:push`)
- Environment variables configured in `.env.local`:
  - `DATABASE_URL` (SQLite or PostgreSQL)
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL`
  - `EMAIL_FROM`
  - `RESEND_API_KEY` (optional for dev, required for email notifications)
  - `STRIPE_SECRET_KEY` (optional, required for refund testing)

## API Endpoints

### 1. POST /api/orders - Create Order

**Headers:**
- `x-store-id`: Store ID (required)
- `idempotency-key`: Unique key for duplicate prevention (optional but recommended)
- `Content-Type`: application/json

**Request Body:**
```json
{
  "customerEmail": "customer@example.com",
  "customerName": "John Doe",
  "customerPhone": "+1234567890",
  "shippingAddress": "123 Main St, City, State 12345",
  "billingAddress": "123 Main St, City, State 12345",
  "items": [
    {
      "productId": "clx12345",
      "variantId": "clx67890",
      "quantity": 2,
      "price": 29.99
    }
  ],
  "paymentMethod": "STRIPE",
  "shippingMethod": "standard",
  "notes": "Please deliver before 5pm"
}
```

**Response (201 Created):**
```json
{
  "id": "clx_order_id",
  "storeId": "clx_store_id",
  "orderNumber": "ORD-20251204-0001",
  "status": "PENDING",
  "customerEmail": "customer@example.com",
  "customerName": "John Doe",
  "totalAmount": 59.98,
  "items": [
    {
      "productName": "Product Name",
      "quantity": 2,
      "price": 29.99,
      "subtotal": 59.98
    }
  ],
  "createdAt": "2025-12-04T14:00:00.000Z"
}
```

**Error Responses:**
- `400`: Validation error
- `404`: Product not found
- `409`: Insufficient stock
- `403`: Permission denied

### 2. PUT /api/orders/[id]/status - Update Order Status

**Request Body:**
```json
{
  "storeId": "clx_store_id",
  "status": "PROCESSING",
  "trackingNumber": "1Z999AA10123456784",
  "trackingUrl": "https://tracking.example.com/...",
  "adminNote": "Order processed"
}
```

### 3. POST /api/orders/[id]/refund - Refund Order

**Request Body:**
```json
{
  "storeId": "clx_store_id",
  "refundAmount": 59.98,
  "reason": "Customer request"
}
```

## Test Cases

### Test 1: Create Order with Single Product
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "x-store-id: YOUR_STORE_ID" \
  -H "idempotency-key: test-order-$(date +%s)" \
  -d '{
    "customerEmail": "test@example.com",
    "customerName": "Test Customer",
    "customerPhone": "+1234567890",
    "shippingAddress": "123 Test St",
    "items": [{
      "productId": "YOUR_PRODUCT_ID",
      "quantity": 1,
      "price": 29.99
    }],
    "paymentMethod": "CASH_ON_DELIVERY"
  }'
```

### Test 2: Idempotency (Duplicate Prevention)
1. Send order with `idempotency-key: test-123`
2. Send EXACT same request again
3. Verify only ONE order created, inventory decremented once

### Test 3: Insufficient Stock Error
1. Create product with stock = 5
2. Order quantity = 10
3. Expect 409 error

### Test 4: Multi-Tenancy Isolation
1. Create order for Store A with Store B's product
2. Expect error: "Product does not belong to store"

## References
- Issue: [Phase 1] Order Processing API
- Service: `src/lib/services/order-processing.service.ts`
- API Routes: `src/app/api/orders/route.ts`
