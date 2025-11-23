# StormCom API Endpoints - Comprehensive Documentation

**Generated:** November 18, 2025  
**Project:** stormcom-old  
**Scope:** All non-auth API endpoints

---

## Table of Contents

1. [Analytics](#analytics)
2. [Attributes](#attributes)
3. [Audit Logs](#audit-logs)
4. [Brands](#brands)
5. [Bulk Operations](#bulk-operations)
6. [Categories](#categories)
7. [Checkout](#checkout)
8. [CSRF Token](#csrf-token)
9. [Documentation](#documentation)
10. [Emails](#emails)
11. [GDPR](#gdpr)
12. [Integrations](#integrations)
13. [Inventory](#inventory)
14. [Notifications](#notifications)
15. [Orders](#orders)
16. [Products](#products)
17. [Stores](#stores)
18. [Subscriptions](#subscriptions)
19. [Themes](#themes)
20. [Webhooks](#webhooks)

---

## Analytics

### 1. Dashboard Analytics
**GET** `/api/analytics/dashboard`

**Description:** Comprehensive analytics dashboard with all metrics in a single optimized call (4-6x faster than sequential fetching).

**Query Parameters:**
- `startDate` (optional): ISO date string (default: 30 days ago)
- `endDate` (optional): ISO date string (default: today)
- `groupBy` (optional): `day` | `week` | `month` (default: `day`)

**Response:**
```json
{
  "data": {
    "metrics": { "totalRevenue": 0, "orderCount": 0, "averageOrderValue": 0 },
    "revenue": [{ "date": "2025-01-01", "revenue": 0, "orderCount": 0 }],
    "topProducts": [{ "id": "", "name": "", "totalQuantity": 0, "totalRevenue": 0 }],
    "customerMetrics": { "totalCustomers": 0, "newCustomers": 0, "returningCustomers": 0 }
  },
  "meta": { "dateRange": {}, "groupBy": "day", "generatedAt": "" }
}
```

**Dependencies:** NextAuth session, analytics-service, storeId

---

### 2. Sales Metrics
**GET** `/api/analytics/sales`

**Description:** Retrieve sales metrics for a date range.

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response:**
```json
{
  "data": {
    "totalRevenue": 0,
    "orderCount": 0,
    "averageOrderValue": 0
  },
  "meta": { "dateRange": {} }
}
```

**Dependencies:** NextAuth session, analytics-service

---

### 3. Revenue by Period
**GET** `/api/analytics/revenue`

**Description:** Revenue breakdown by time period with summary statistics.

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `groupBy` (optional): `day` | `week` | `month` (default: `day`)

**Response:**
```json
{
  "data": [{ "date": "", "revenue": 0, "orderCount": 0 }],
  "meta": {
    "dateRange": {},
    "groupBy": "day",
    "summary": {
      "totalRevenue": 0,
      "totalOrders": 0,
      "averageOrderValue": 0,
      "dataPoints": 0
    }
  }
}
```

**Dependencies:** NextAuth session, analytics-service

---

### 4. Top Selling Products
**GET** `/api/analytics/products`

**Description:** Top-selling products analytics by quantity and revenue.

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `limit` (optional): Number (default: 10, max: 50)

**Response:**
```json
{
  "data": [
    {
      "id": "",
      "name": "",
      "totalQuantity": 0,
      "totalRevenue": 0,
      "orderCount": 0
    }
  ],
  "meta": {
    "dateRange": {},
    "limit": 10,
    "summary": {
      "totalProducts": 0,
      "totalQuantitySold": 0,
      "totalRevenue": 0,
      "totalOrders": 0
    }
  }
}
```

**Dependencies:** NextAuth session, analytics-service

---

### 5. Customer Metrics
**GET** `/api/analytics/customers`

**Description:** Customer acquisition and retention metrics with insights.

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response:**
```json
{
  "data": {
    "totalCustomers": 0,
    "newCustomers": 0,
    "returningCustomers": 0,
    "customerRetentionRate": 0,
    "insights": {
      "customerGrowthRate": 0,
      "returningCustomerRate": 0,
      "newCustomerPercentage": 0
    }
  },
  "meta": {
    "dateRange": {},
    "description": {}
  }
}
```

**Dependencies:** NextAuth session, analytics-service

---

## Attributes

Product attributes for variations (color, size, material, etc.)

### 1. List Attributes
**GET** `/api/attributes`

**Description:** List product attributes with pagination and filtering.

**Query Parameters:**
- `storeId` (required): Store UUID
- `search` (optional): Search term
- `sortBy` (optional): `name` | `createdAt` | `updatedAt` (default: `name`)
- `sortOrder` (optional): `asc` | `desc` (default: `asc`)
- `page` (optional): Page number (default: 1)
- `perPage` (optional): Items per page (default: 10, max: 100)

**Response:**
```json
{
  "data": [
    {
      "id": "",
      "name": "",
      "slug": "",
      "type": "text|number|boolean|select|multiselect|date",
      "description": "",
      "isRequired": false,
      "defaultValue": "",
      "options": [],
      "displayOrder": 0,
      "isPublished": true
    }
  ],
  "meta": { "page": 1, "perPage": 10, "total": 0, "totalPages": 0 }
}
```

**Dependencies:** attribute-service

---

### 2. Create Attribute
**POST** `/api/attributes`

**Description:** Create a new product attribute.

**Request Body:**
```json
{
  "name": "Color",
  "slug": "color",
  "type": "select",
  "description": "Product color",
  "isRequired": false,
  "defaultValue": "black",
  "options": ["red", "blue", "green"],
  "validation": { "min": 1, "max": 50 },
  "displayOrder": 0,
  "isPublished": true,
  "storeId": "uuid"
}
```

**Response:** 201 Created
```json
{
  "data": { "id": "", "name": "", "values": [] },
  "message": "Attribute created successfully"
}
```

**Dependencies:** attribute-service, Zod validation

---

### 3. Get Attribute by ID
**GET** `/api/attributes/[id]`

**Description:** Retrieve a single attribute by ID.

**Response:**
```json
{
  "data": {
    "id": "",
    "name": "",
    "slug": "",
    "type": "",
    "options": []
  }
}
```

**Dependencies:** attribute-service

---

### 4. Update Attribute
**PATCH** `/api/attributes/[id]`

**Description:** Update an existing attribute (partial updates supported).

**Request Body:** Same as POST (all fields optional)

**Response:** 200 OK
```json
{
  "data": { "id": "", "name": "" },
  "message": "Attribute updated successfully"
}
```

**Dependencies:** attribute-service

---

### 5. Delete Attribute
**DELETE** `/api/attributes/[id]`

**Description:** Soft delete an attribute.

**Response:** 200 OK
```json
{
  "message": "Attribute deleted successfully"
}
```

**Dependencies:** attribute-service

---

## Audit Logs

### 1. List Audit Logs
**GET** `/api/audit-logs`

**Description:** Retrieve audit logs with filtering and pagination (SUPER_ADMIN sees all, STORE_ADMIN/STAFF see only their store).

**Query Parameters:**
- `storeId` (optional): Filter by store UUID
- `userId` (optional): Filter by user UUID
- `entityType` (optional): Entity type (Product, Order, User, etc.)
- `entityId` (optional): Specific entity UUID
- `action` (optional): `CREATE` | `UPDATE` | `DELETE`
- `startDate` (optional): ISO 8601 datetime
- `endDate` (optional): ISO 8601 datetime
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)

**Response:**
```json
{
  "data": {
    "logs": [
      {
        "id": "",
        "action": "UPDATE",
        "entityType": "Product",
        "entityId": "",
        "storeId": "",
        "userId": "",
        "changes": "{}",
        "ipAddress": "",
        "userAgent": "",
        "createdAt": "",
        "user": { "id": "", "name": "", "email": "" },
        "store": { "id": "", "name": "" }
      }
    ],
    "total": 0,
    "page": 1,
    "limit": 50,
    "totalPages": 0
  }
}
```

**Dependencies:** NextAuth session, AuditLogService

---

## Brands

### 1. List Brands
**GET** `/api/brands`

**Description:** List product brands with pagination and search (public access for storefront).

**Query Parameters:**
- `storeId` (optional): Store UUID (falls back to session or demo store)
- `search` (optional): Search term
- `sortBy` (optional): `name` | `createdAt` | `updatedAt` (default: `name`)
- `sortOrder` (optional): `asc` | `desc` (default: `asc`)
- `page` (optional): Page number (default: 1)
- `perPage` (optional): Items per page (default: 10, max: 100)

**Response:**
```json
{
  "data": [
    {
      "id": "",
      "name": "",
      "slug": "",
      "description": "",
      "logo": "https://...",
      "website": "https://...",
      "isPublished": true
    }
  ],
  "meta": { "page": 1, "perPage": 10, "total": 0, "totalPages": 0 }
}
```

**Dependencies:** brand-service, getCurrentUser helper

---

### 2. Create Brand
**POST** `/api/brands`

**Description:** Create a new brand (requires authentication).

**Request Body:**
```json
{
  "name": "Apple",
  "slug": "apple",
  "description": "Apple Inc.",
  "logo": "https://...",
  "website": "https://apple.com",
  "metaTitle": "Apple Products",
  "metaDescription": "Official Apple products",
  "isPublished": true
}
```

**Response:** 201 Created
```json
{
  "data": { "id": "", "name": "", "slug": "" },
  "message": "Brand created successfully"
}
```

**Dependencies:** brand-service, getCurrentUser

---

### 3. Get Brand by ID
**GET** `/api/brands/[id]`

**Description:** Retrieve a single brand.

**Response:**
```json
{
  "data": {
    "id": "",
    "name": "",
    "slug": "",
    "logo": "",
    "website": ""
  }
}
```

**Dependencies:** brand-service

---

### 4. Update Brand
**PATCH** `/api/brands/[id]`

**Description:** Update brand details.

**Request Body:** Same as POST (all fields optional)

**Response:** 200 OK

**Dependencies:** brand-service

---

### 5. Delete Brand
**DELETE** `/api/brands/[id]`

**Description:** Soft delete a brand.

**Response:** 200 OK

**Dependencies:** brand-service

---

## Bulk Operations

### 1. Import Products
**POST** `/api/bulk/products/import`

**Description:** Bulk import products from CSV/Excel file (max 10MB).

**Request:** multipart/form-data
- `file`: CSV/Excel file
- `config` (optional): JSON string with import settings

**Config Schema:**
```json
{
  "updateExisting": false,
  "skipDuplicates": true,
  "validateOnly": false,
  "batchSize": 100
}
```

**Response:** 202 Accepted (placeholder implementation)
```json
{
  "data": {
    "jobId": "",
    "status": "processing",
    "totalRows": 0,
    "processedRows": 0,
    "successCount": 0,
    "errorCount": 0,
    "errors": []
  },
  "message": "Import job started successfully"
}
```

**Dependencies:** NextAuth session, product-service (to be implemented)

---

### 2. Export Products
**POST** `/api/bulk/products/export`

**Description:** Export products to CSV/Excel file.

**Request Body:**
```json
{
  "format": "csv",
  "fields": ["name", "sku", "price", "quantity"],
  "filters": {
    "categoryId": "",
    "brandId": "",
    "status": "PUBLISHED",
    "inventoryStatus": "IN_STOCK",
    "search": ""
  },
  "includeDeleted": false
}
```

**Response:**
```json
{
  "data": {
    "downloadUrl": "",
    "fileName": "",
    "totalProducts": 0,
    "format": "csv",
    "fields": []
  },
  "message": "Export prepared successfully"
}
```

**Dependencies:** product-service

---

### 3. Import Categories
**POST** `/api/bulk/categories/import`

**Description:** Bulk import categories from CSV/Excel file.

**Request:** multipart/form-data
- `file`: CSV/Excel file
- `config` (optional): JSON string

**Config Schema:**
```json
{
  "updateExisting": false,
  "skipDuplicates": true,
  "validateOnly": false,
  "preserveHierarchy": true
}
```

**Response:** 202 Accepted (placeholder implementation)

**Dependencies:** category-service (to be implemented)

---

### 4. Export Categories
**POST** `/api/bulk/categories/export`

**Description:** Export categories to CSV/Excel file.

**Request Body:**
```json
{
  "format": "csv",
  "structure": "hierarchical",
  "fields": ["name", "slug", "parentId", "position"],
  "includeDeleted": false
}
```

**Response:**
```json
{
  "data": {
    "downloadUrl": "",
    "fileName": "",
    "totalCategories": 0,
    "format": "csv",
    "structure": "hierarchical",
    "fields": []
  }
}
```

**Dependencies:** category-service

---

## Categories

### 1. List Categories
**GET** `/api/categories`

**Description:** List categories with filtering, tree structure, or root-only view (public access for storefront).

**Query Parameters:**
- `storeId` (optional): Store UUID (falls back to session or demo store)
- `tree` (optional): Boolean - return hierarchical tree structure
- `rootOnly` (optional): Boolean - return only root categories
- `search` (optional): Search term
- `parentId` (optional): Filter by parent UUID (use `null` for root categories)
- `isPublished` (optional): Boolean filter
- `page` (optional): Page number (default: 1)
- `perPage` (optional): Items per page (default: 10, max: 100)

**Response (tree mode):**
```json
{
  "data": {
    "categories": [
      {
        "id": "",
        "name": "",
        "slug": "",
        "children": []
      }
    ],
    "meta": { "structure": "tree" }
  },
  "message": "Category tree retrieved successfully"
}
```

**Response (paginated):**
```json
{
  "data": {
    "categories": [],
    "meta": { "page": 1, "perPage": 10, "total": 0, "totalPages": 0 }
  }
}
```

**Dependencies:** category-service, getCurrentUser

---

### 2. Create Category
**POST** `/api/categories`

**Description:** Create a new category with optional parent hierarchy.

**Request Body:**
```json
{
  "name": "Electronics",
  "slug": "electronics",
  "description": "Electronic devices and accessories",
  "image": "https://...",
  "parentId": "uuid",
  "metaTitle": "",
  "metaDescription": "",
  "isPublished": true,
  "sortOrder": 0
}
```

**Response:** 201 Created

**Dependencies:** category-service

---

### 3. Get Category by ID
**GET** `/api/categories/[id]`

**Description:** Retrieve single category or its breadcrumb path.

**Query Parameters:**
- `breadcrumb` (optional): Boolean - return breadcrumb path instead

**Response:**
```json
{
  "data": {
    "id": "",
    "name": "",
    "slug": "",
    "parentId": "",
    "children": []
  }
}
```

**Dependencies:** category-service

---

### 4. Update Category
**PATCH** `/api/categories/[id]`

**Description:** Update category details (validates circular references).

**Request Body:** Same as POST (all fields optional)

**Response:** 200 OK

**Dependencies:** category-service

---

### 5. Delete Category
**DELETE** `/api/categories/[id]`

**Description:** Soft delete category (validates it has no products).

**Response:** 200 OK

**Dependencies:** category-service

---

### 6. Reorder Categories
**PATCH** `/api/categories/reorder`

**Description:** Bulk reorder categories at the same hierarchy level.

**Request Body:**
```json
{
  "categoryIds": ["uuid1", "uuid2", "uuid3"],
  "parentId": "uuid"
}
```

**Response:**
```json
{
  "data": { "updated": 3 },
  "message": "Categories reordered successfully"
}
```

**Dependencies:** category-service

---

## Checkout

Multi-step checkout process with validation, shipping, payment, and order creation.

### 1. Validate Cart
**POST** `/api/checkout/validate`

**Description:** Validate cart items before checkout (stock availability, pricing).

**Request Body:**
```json
{
  "storeId": "",
  "items": [
    {
      "productId": "",
      "variantId": "",
      "quantity": 1,
      "price": 99.99
    }
  ]
}
```

**Response:**
```json
{
  "data": {
    "valid": true,
    "errors": [],
    "warnings": [],
    "items": []
  }
}
```

**Dependencies:** checkout-service, Zod validation

---

### 2. Calculate Shipping
**POST** `/api/checkout/shipping`

**Description:** Calculate shipping options and costs based on cart and address.

**Request Body:**
```json
{
  "storeId": "",
  "shippingAddress": {
    "country": "US",
    "state": "NY",
    "city": "New York",
    "postalCode": "10001",
    "address1": "123 Main St",
    "address2": ""
  },
  "cartItems": []
}
```

**Response:**
```json
{
  "data": {
    "options": [
      {
        "method": "standard",
        "cost": 5.99,
        "estimatedDays": 5
      }
    ]
  }
}
```

**Dependencies:** checkout-service

---

### 3. Create Payment Intent
**POST** `/api/checkout/payment-intent`

**Description:** Create Stripe payment intent for order (requires order ownership validation).

**Request Body:**
```json
{
  "orderId": "",
  "amount": 105.99,
  "currency": "usd",
  "customerId": ""
}
```

**Response:**
```json
{
  "data": {
    "clientSecret": "",
    "paymentIntentId": ""
  }
}
```

**Dependencies:** NextAuth session, payment-service, db (order validation)

---

### 4. Complete Checkout
**POST** `/api/checkout/complete`

**Description:** Complete checkout and create order with payment and shipping details.

**Request Body:**
```json
{
  "storeId": "",
  "customerId": "",
  "items": [],
  "shippingAddress": {},
  "billingAddress": {},
  "subtotal": 100.0,
  "taxAmount": 8.0,
  "shippingCost": 5.99,
  "discountAmount": 0,
  "shippingMethod": "standard",
  "paymentMethod": "CREDIT_CARD",
  "notes": ""
}
```

**Response:** 201 Created
```json
{
  "data": {
    "orderId": "",
    "orderNumber": "ORD-12345",
    "status": "PENDING"
  },
  "message": "Order created successfully"
}
```

**Dependencies:** checkout-service

---

## CSRF Token

### 1. Get CSRF Token
**GET** `/api/csrf-token`

**Description:** Generate and return CSRF token for state-changing requests (set as HTTP-only cookie).

**Response:**
```json
{
  "csrfToken": "abc123:1234567890:def456",
  "expiresIn": 86400000
}
```

**Cookie:** `csrf-token` (HTTP-only, SameSite=Lax, expires in 24h)

**Dependencies:** csrf library

---

**OPTIONS** `/api/csrf-token`

**Description:** CORS preflight handler.

**Response:** 204 No Content

---

## Documentation

### 1. API Documentation UI
**GET** `/api/docs`

**Description:** Interactive Swagger UI for API documentation (loads OpenAPI spec from `specs/001-multi-tenant-ecommerce/contracts/openapi.yaml`).

**Response:** HTML page with Swagger UI

**Dependencies:** OpenAPI YAML spec, swagger-ui, js-yaml

---

## Emails

### 1. Send Email
**POST** `/api/emails/send`

**Description:** Send email via Resend API with authentication, RBAC (Store Admin+), rate limiting by subscription plan, and audit logging.

**Rate Limits by Plan:**
- FREE: 60 req/min, 100 emails/hour
- BASIC: 120 req/min, 500 emails/hour
- PRO: 300 req/min, 1000 emails/hour
- ENTERPRISE: 1000 req/min, 5000 emails/hour

**Request Body:**
```json
{
  "to": "user@example.com",
  "subject": "Welcome",
  "html": "<p>Hello!</p>",
  "text": "Hello!",
  "from": "noreply@example.com",
  "replyTo": "support@example.com",
  "tags": [
    { "name": "category", "value": "welcome" }
  ]
}
```

**Response:**
```json
{
  "data": {
    "success": true,
    "messageId": "",
    "remaining": 59
  },
  "message": "Email sent successfully"
}
```

**Dependencies:** NextAuth session, email-service, audit log, db (store subscription plan)

---

## GDPR

GDPR compliance endpoints for consent management, data export, and account deletion.

### 1. Get Consent Records
**GET** `/api/gdpr/consent`

**Description:** Retrieve user's consent preferences (GDPR Article 7).

**Query Parameters:**
- `storeId` (optional): Filter by store UUID

**Response:**
```json
{
  "data": [
    {
      "id": "",
      "consentType": "ESSENTIAL",
      "granted": true,
      "grantedAt": "",
      "revokedAt": null
    }
  ]
}
```

**Dependencies:** NextAuth session, gdpr-service

---

### 2. Update Consent
**POST** `/api/gdpr/consent`

**Description:** Update consent preference (GDPR Article 7 - right to withdraw).

**Request Body:**
```json
{
  "consentType": "ANALYTICS",
  "granted": false,
  "storeId": ""
}
```

**Response:** 201 Created
```json
{
  "data": {
    "id": "",
    "userId": "",
    "consentType": "ANALYTICS",
    "granted": false,
    "revokedAt": ""
  },
  "message": "Consent preference updated successfully"
}
```

**Dependencies:** NextAuth session, gdpr-service, audit metadata (IP, User-Agent)

---

### 3. Request Data Export
**POST** `/api/gdpr/export`

**Description:** Create data export request (GDPR Article 15 - right of access). Download link expires in 7 days.

**Request Body:**
```json
{
  "storeId": ""
}
```

**Response:** 201 Created
```json
{
  "data": {
    "id": "",
    "userId": "",
    "type": "EXPORT",
    "status": "PENDING",
    "expiresAt": "",
    "createdAt": ""
  },
  "message": "Data export request created. You will receive an email when ready."
}
```

**Dependencies:** NextAuth session, gdpr-service

---

### 4. Request Account Deletion
**POST** `/api/gdpr/delete`

**Description:** Create account deletion request (GDPR Article 17 - right to erasure). Requires explicit confirmation.

**Request Body:**
```json
{
  "confirmation": "DELETE_MY_ACCOUNT",
  "storeId": ""
}
```

**Response:** 201 Created
```json
{
  "data": {
    "id": "",
    "userId": "",
    "type": "DELETE",
    "status": "PENDING",
    "createdAt": ""
  },
  "message": "Account deletion request created. Your account will be permanently deleted within 30 days."
}
```

**Dependencies:** NextAuth session, gdpr-service

---

## Integrations

Third-party platform integrations (Shopify, Mailchimp).

### 1. Connect Shopify
**POST** `/api/integrations/shopify/connect`

**Description:** OAuth connection endpoint - exchange authorization code for access token and save encrypted config.

**Request Body:**
```json
{
  "code": "shopify-auth-code",
  "shop": "test-store.myshopify.com",
  "state": "storeId-for-csrf-validation"
}
```

**Response:**
```json
{
  "data": {
    "config": {
      "id": "",
      "platform": "shopify",
      "apiUrl": "",
      "syncProducts": true,
      "syncOrders": true,
      "syncCustomers": true,
      "isActive": true,
      "lastSyncAt": null
    }
  },
  "message": "Shopify connected successfully"
}
```

**Dependencies:** NextAuth session, IntegrationService

---

### 2. Export Products to Shopify
**POST** `/api/integrations/shopify/export`

**Description:** Export products to connected Shopify store.

**Request Body:**
```json
{
  "productIds": ["uuid1", "uuid2"]
}
```

**Response:**
```json
{
  "data": {
    "exported": 2,
    "failed": 0,
    "results": [
      {
        "productId": "",
        "productName": "",
        "success": true,
        "externalId": "shopify-product-id"
      }
    ]
  },
  "message": "Exported 2 products (0 failed)"
}
```

**Dependencies:** IntegrationService, db

---

### 3. Connect Mailchimp
**POST** `/api/integrations/mailchimp/connect`

**Description:** OAuth connection endpoint for Mailchimp integration.

**Request Body:**
```json
{
  "code": "mailchimp-auth-code",
  "state": "storeId-for-csrf"
}
```

**Response:**
```json
{
  "data": {
    "config": {
      "id": "",
      "platform": "mailchimp",
      "apiUrl": "",
      "syncCustomers": true,
      "isActive": true
    }
  },
  "message": "Mailchimp connected successfully"
}
```

**Dependencies:** IntegrationService

---

### 4. Sync Customers to Mailchimp
**POST** `/api/integrations/mailchimp/sync`

**Description:** Sync customers to Mailchimp mailing list.

**Request Body:**
```json
{
  "customerIds": ["uuid1", "uuid2"]
}
```

**Response:**
```json
{
  "data": {
    "synced": 2,
    "failed": 0
  },
  "message": "Successfully synced 2 customers to Mailchimp"
}
```

**Dependencies:** IntegrationService, db

---

## Inventory

### 1. Get Inventory Levels
**GET** `/api/inventory`

**Description:** Retrieve inventory levels with filtering and pagination (Store Admin, Staff, Super Admin only).

**Query Parameters:**
- `search` (optional): Filter by product name or SKU
- `categoryId` (optional): Filter by category UUID
- `brandId` (optional): Filter by brand UUID
- `lowStockOnly` (optional): Boolean - show only low/out of stock items
- `page` (optional): Page number (default: 1)
- `perPage` (optional): Items per page (default: 20, max: 100)

**Response:**
```json
{
  "data": [
    {
      "productId": "",
      "productName": "",
      "sku": "",
      "quantity": 50,
      "lowStockThreshold": 10,
      "status": "IN_STOCK"
    }
  ],
  "meta": { "page": 1, "perPage": 20, "total": 0, "totalPages": 0 }
}
```

**Dependencies:** NextAuth session, inventory-service, RBAC

---

### 2. Adjust Stock
**POST** `/api/inventory/adjust`

**Description:** Adjust product stock levels (ADD, REMOVE, or SET quantity) with audit trail.

**Request Body:**
```json
{
  "productId": "",
  "quantity": 10,
  "type": "ADD",
  "reason": "Restock from supplier",
  "note": "Shipment #12345"
}
```

**Response:**
```json
{
  "data": {
    "productId": "",
    "newQuantity": 60,
    "status": "IN_STOCK"
  },
  "message": "Stock added successfully"
}
```

**Dependencies:** NextAuth session, inventory-service, Zod validation

---

## Notifications

### 1. List Notifications
**GET** `/api/notifications`

**Description:** Retrieve notifications for authenticated user with filtering and pagination.

**Query Parameters:**
- `isRead` (optional): Boolean filter (`true` | `false`)
- `limit` (optional): Number (default: 50, max: 100)
- `offset` (optional): Number (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "",
        "type": "ORDER_PLACED",
        "title": "",
        "message": "",
        "isRead": false,
        "createdAt": ""
      }
    ],
    "unreadCount": 5,
    "total": 42
  }
}
```

**Dependencies:** NextAuth session, notification-service

---

## Orders

### 1. List Orders
**GET** `/api/orders`

**Description:** List orders with filtering, pagination, search, and CSV export (Store Admin, Staff with orders:read permission, Super Admin).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `perPage` (optional): Items per page (default: 20, max: 100)
- `status` (optional): OrderStatus enum value
- `search` (optional): Search by order number, customer name, email (max 200 chars)
- `dateFrom` (optional): ISO 8601 datetime
- `dateTo` (optional): ISO 8601 datetime
- `sortBy` (optional): `createdAt` | `totalAmount` | `orderNumber` (default: `createdAt`)
- `sortOrder` (optional): `asc` | `desc` (default: `desc`)
- `export` (optional): `csv` - export to CSV file instead of JSON

**Response (JSON):**
```json
{
  "success": true,
  "data": [
    {
      "id": "",
      "orderNumber": "ORD-12345",
      "status": "PENDING",
      "totalAmount": 105.99,
      "customerName": "",
      "createdAt": ""
    }
  ],
  "meta": { "page": 1, "perPage": 20, "total": 0, "totalPages": 0 },
  "message": "Orders retrieved successfully"
}
```

**Response (CSV):**
Content-Type: `text/csv`  
Content-Disposition: `attachment; filename="orders-2025-01-26.csv"`

**Dependencies:** NextAuth session, order-service, Zod validation, multi-tenant isolation

---

### 2. Get Order by ID
**GET** `/api/orders/[id]`

**Description:** Retrieve detailed order information including customer, items, payments, addresses, and history.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "",
    "orderNumber": "",
    "status": "",
    "customer": {},
    "items": [],
    "payments": [],
    "shippingAddress": {},
    "billingAddress": {},
    "history": []
  },
  "message": "Order retrieved successfully"
}
```

**Dependencies:** NextAuth session, order-service

---

## Products

### 1. List Products
**GET** `/api/products`

**Description:** List products with pagination and filtering (authenticated users only, multi-tenant isolated).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `perPage` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search term
- `categoryId` (optional): Filter by category UUID
- `brandId` (optional): Filter by brand UUID
- `isPublished` (optional): Boolean (default: true if not provided)
- `isFeatured` (optional): Boolean
- `minPrice` (optional): Number
- `maxPrice` (optional): Number
- `inventoryStatus` (optional): `IN_STOCK` | `LOW_STOCK` | `OUT_OF_STOCK`

**Response:**
```json
{
  "data": [
    {
      "id": "",
      "name": "",
      "sku": "",
      "price": 99.99,
      "salePrice": null,
      "images": [],
      "thumbnailUrl": "",
      "status": "PUBLISHED"
    }
  ],
  "meta": { "total": 0, "page": 1, "perPage": 10, "totalPages": 0 }
}
```

**Dependencies:** NextAuth session, product-service

---

### 2. Create Product
**POST** `/api/products`

**Description:** Create new product with full validation.

**Request Body:**
```json
{
  "name": "Product Name",
  "slug": "product-name",
  "sku": "PROD-001",
  "description": "",
  "shortDescription": "",
  "price": 99.99,
  "salePrice": 89.99,
  "costPrice": 50.0,
  "categoryId": "",
  "brandId": "",
  "images": ["https://..."],
  "trackQuantity": true,
  "quantity": 100,
  "lowStockThreshold": 10,
  "status": "PUBLISHED",
  "isVisible": true,
  "metaTitle": "",
  "metaDescription": "",
  "metaKeywords": []
}
```

**Response:** 201 Created

**Dependencies:** NextAuth session, product-service, Zod validation

---

### 3. Get Product by ID
**GET** `/api/products/[id]`

**Description:** Retrieve single product details.

**Response:**
```json
{
  "data": {
    "id": "",
    "name": "",
    "sku": "",
    "price": 99.99,
    "images": [],
    "category": {},
    "brand": {}
  }
}
```

**Dependencies:** product-service

---

### 4. Update Product (Full)
**PUT** `/api/products/[id]`

**Description:** Full product replacement (partial updates supported in implementation).

**Request Body:** Same as POST (all fields optional in practice)

**Response:** 200 OK

**Dependencies:** product-service

---

### 5. Update Product (Partial)
**PATCH** `/api/products/[id]`

**Description:** Update specific product fields.

**Request Body:** Same as POST (all fields optional)

**Response:** 200 OK

**Dependencies:** product-service

---

### 6. Delete Product
**DELETE** `/api/products/[id]`

**Description:** Soft delete product.

**Response:** 204 No Content

**Dependencies:** product-service

---

### 7. Export Products
**POST** `/api/products/export`

**Description:** Start bulk export job to CSV/Excel/JSON with filtering (max 50,000 records).

**Request Body:**
```json
{
  "format": "csv",
  "fields": ["name", "sku", "price"],
  "filters": {
    "search": "",
    "categoryId": "",
    "brandId": "",
    "priceFrom": 0,
    "priceTo": 1000,
    "inventoryStatus": "IN_STOCK",
    "dateFrom": "",
    "dateTo": ""
  },
  "includeDeleted": false,
  "maxRecords": 50000,
  "dateFormat": "YYYY-MM-DD HH:mm:ss",
  "includeHeaders": true,
  "delimiter": ","
}
```

**Response:**
```json
{
  "data": {
    "jobId": "",
    "progress": 0
  },
  "message": "Export job started successfully"
}
```

**Dependencies:** bulkExportService

---

### 8. Get Export Status
**GET** `/api/products/export?jobId=[id]&download=false`

**Description:** Get export job progress.

**Response:**
```json
{
  "data": {
    "jobId": "",
    "status": "processing",
    "progress": 45,
    "recordsProcessed": 450,
    "totalRecords": 1000
  }
}
```

**Dependencies:** bulkExportService

---

### 9. Download Export
**GET** `/api/products/export?jobId=[id]&download=true`

**Description:** Download completed export file.

**Response:**
```json
{
  "data": {
    "downloadUrl": "",
    "fileName": "",
    "fileSize": 1024000,
    "recordCount": 1000
  }
}
```

**Dependencies:** bulkExportService

---

### 10. Cancel Export
**DELETE** `/api/products/export?jobId=[id]`

**Description:** Cancel running export job.

**Response:**
```json
{
  "message": "Export job cancelled successfully"
}
```

**Dependencies:** bulkExportService

---

### 11. Import Products
**POST** `/api/products/import`

**Description:** Start bulk import job from CSV data with validation and rollback options.

**Request Body:**
```json
{
  "csvData": "name,sku,price\nProduct 1,SKU1,99.99",
  "config": {
    "updateExisting": false,
    "skipDuplicates": true,
    "validateOnly": false,
    "batchSize": 100,
    "createCategories": true,
    "createBrands": true,
    "rollbackOnError": true
  }
}
```

**Response:**
```json
{
  "data": {
    "jobId": "",
    "progress": 0
  },
  "message": "Import job started successfully"
}
```

**Dependencies:** bulkImportService

---

### 12. Get Import Status
**GET** `/api/products/import?jobId=[id]`

**Description:** Get import job progress.

**Response:**
```json
{
  "data": {
    "jobId": "",
    "status": "processing",
    "progress": 60,
    "recordsProcessed": 600,
    "totalRecords": 1000,
    "successCount": 590,
    "errorCount": 10,
    "errors": []
  }
}
```

**Dependencies:** bulkImportService

---

### 13. Cancel Import
**DELETE** `/api/products/import?jobId=[id]`

**Description:** Cancel running import job.

**Response:**
```json
{
  "message": "Import job cancelled successfully"
}
```

**Dependencies:** bulkImportService

---

## Stores

Store management for multi-tenant platform (SUPER_ADMIN full access, STORE_ADMIN limited to assigned stores).

### 1. List Stores
**GET** `/api/stores`

**Description:** List stores with pagination, search, and filtering (role-based access).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `search` (optional): Search by name, slug, email
- `subscriptionPlan` (optional): `FREE` | `BASIC` | `PRO` | `ENTERPRISE`
- `subscriptionStatus` (optional): `TRIAL` | `ACTIVE` | `PAST_DUE` | `CANCELED` | `PAUSED`
- `sortBy` (optional): `name` | `createdAt` | `updatedAt` (default: `createdAt`)
- `sortOrder` (optional): `asc` | `desc` (default: `desc`)

**Response:**
```json
{
  "data": {
    "stores": [
      {
        "id": "",
        "name": "",
        "slug": "",
        "email": "",
        "phone": "",
        "address": "",
        "currency": "USD",
        "timezone": "",
        "createdAt": "",
        "updatedAt": "",
        "_count": { "products": 0, "orders": 0, "customers": 0, "admins": 0 }
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0, "hasNext": false, "hasPrev": false }
  }
}
```

**Dependencies:** storeService, mock auth (to be replaced)

---

### 2. Create Store
**POST** `/api/stores`

**Description:** Create new store with subdomain validation (SUPER_ADMIN only).

**Request Body:**
```json
{
  "name": "Demo Store",
  "slug": "demo-store",
  "description": "",
  "email": "admin@demo-store.com",
  "phone": "+1-555-0123",
  "website": "https://demo-store.com",
  "subscriptionPlan": "BASIC",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "country": "US",
  "currency": "USD",
  "timezone": "America/New_York",
  "locale": "en",
  "ownerId": "user-uuid"
}
```

**Response:** 201 Created

**Dependencies:** storeService, subdomain validation, audit logging

---

### 3. Get Store by ID
**GET** `/api/stores/[id]`

**Description:** Retrieve store details with counts (SUPER_ADMIN all stores, STORE_ADMIN assigned stores only).

**Response:**
```json
{
  "data": {
    "id": "",
    "name": "",
    "slug": "",
    "email": "",
    "phone": "",
    "address": "",
    "currency": "",
    "timezone": "",
    "_count": { "products": 0, "orders": 0, "customers": 0, "admins": 0 }
  }
}
```

**Dependencies:** storeService

---

### 4. Update Store
**PUT** `/api/stores/[id]`

**Description:** Update store settings (SUPER_ADMIN all stores, STORE_ADMIN assigned stores only).

**Request Body:** Same as POST (all fields optional)

**Response:** 200 OK

**Dependencies:** storeService, validation, audit logging

---

### 5. Delete Store
**DELETE** `/api/stores/[id]`

**Description:** Soft delete store with data preservation (SUPER_ADMIN only).

**Response:** 204 No Content

**Dependencies:** storeService

---

## Subscriptions

Stripe subscription management for store plans.

### 1. Create Subscription Checkout
**POST** `/api/subscriptions`

**Description:** Create Stripe checkout session for subscription upgrade (FREE not allowed via Stripe).

**Request Body:**
```json
{
  "plan": "BASIC",
  "storeId": "",
  "successUrl": "https://example.com/success",
  "cancelUrl": "https://example.com/cancel",
  "trialDays": 14
}
```

**Response:**
```json
{
  "data": {
    "sessionId": "",
    "sessionUrl": "https://checkout.stripe.com/...",
    "plan": "BASIC",
    "storeId": ""
  },
  "message": "Checkout session created successfully"
}
```

**Dependencies:** NextAuth session, subscription-service, Stripe, db (store/user validation)

---

## Themes

### 1. Get Theme Configuration
**GET** `/api/themes?storeId=[id]`

**Description:** Get current store theme, available fonts, theme modes, and color palettes.

**Response:**
```json
{
  "data": {
    "currentTheme": {
      "primaryColor": "#3B82F6",
      "secondaryColor": "#10B981",
      "accentColor": "#F59E0B",
      "fontHeading": "Inter",
      "fontBody": "Open Sans",
      "mode": "light"
    },
    "availableFonts": ["Inter", "Open Sans", "Roboto", "Lato"],
    "themeModeOptions": ["light", "dark", "auto"],
    "colorPalettes": [
      { "name": "Ocean Blue", "primaryColor": "", "secondaryColor": "", "accentColor": "" }
    ]
  }
}
```

**Dependencies:** NextAuth session, theme-service

---

## Webhooks

### 1. Stripe Webhook Handler
**POST** `/api/webhooks/stripe`

**Description:** Handle Stripe webhook events with signature verification and idempotency (payment_intent.succeeded, payment_intent.payment_failed, charge.refunded).

**Headers:**
- `stripe-signature`: Required for webhook verification

**Request Body:** Stripe webhook event payload

**Response:**
```json
{
  "received": true
}
```

**Idempotency:** Uses webhook:stripe:{entity}:{identifier} key to prevent duplicate processing (24h TTL).

**Dependencies:** payment-service, webhook-idempotency, Stripe signature verification

---

## Summary Statistics

**Total Endpoints:** 75+  
**Categories:** 20  
**Methods Used:** GET, POST, PUT, PATCH, DELETE, OPTIONS

### Key Features Across All Endpoints:
- ✅ Multi-tenant data isolation (storeId filtering)
- ✅ NextAuth session-based authentication
- ✅ Role-based access control (SUPER_ADMIN, STORE_ADMIN, STAFF, CUSTOMER)
- ✅ Zod schema validation
- ✅ Pagination support (page, perPage/limit)
- ✅ Search and filtering capabilities
- ✅ Audit logging for critical operations
- ✅ Error handling with standardized error codes
- ✅ Soft delete pattern (deletedAt timestamp)
- ✅ Rate limiting (email sending)
- ✅ GDPR compliance (consent, export, delete)
- ✅ Webhook idempotency (Stripe)

### Common Response Patterns:
```json
// Success
{
  "data": {},
  "message": "Operation successful",
  "meta": {}
}

// Error
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### Common HTTP Status Codes:
- 200: OK (success)
- 201: Created (resource created)
- 204: No Content (successful deletion)
- 400: Bad Request (validation error)
- 401: Unauthorized (not authenticated)
- 403: Forbidden (insufficient permissions)
- 404: Not Found (resource not found)
- 409: Conflict (duplicate resource)
- 429: Too Many Requests (rate limit exceeded)
- 500: Internal Server Error (server error)

---

**End of API Documentation**
