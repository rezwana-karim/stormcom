# StormCom E-Commerce API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:3000/api` (Development)  
**Base URL:** `https://api.stormcom.io/api` (Production)  

## 📋 Quick Navigation

| Format | Description | Location |
|--------|-------------|----------|
| 📘 **OpenAPI 3.0 Spec (JSON)** | Machine-readable API specification | [openapi-spec.json](./openapi-spec.json) |
| 📘 **OpenAPI 3.0 Spec (YAML)** | Human-readable API specification | [openapi-spec.yaml](./openapi-spec.yaml) |
| 📖 **OpenAPI Guide** | How to use OpenAPI specs | [OPENAPI_SPECIFICATION_GUIDE.md](./OPENAPI_SPECIFICATION_GUIDE.md) |
| 🚀 **Postman Collection** | Ready-to-import 17 requests | [StormCom_API_Postman_Collection.json](./StormCom_API_Postman_Collection.json) |
| ⚡ **Quick Reference** | 2-minute quick start | [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) |

> 💡 **New!** This API is now fully documented using **OpenAPI 3.0** standard. Import the spec into Swagger UI, Postman, or use it to generate client SDKs in 50+ languages. See [OPENAPI_SPECIFICATION_GUIDE.md](./OPENAPI_SPECIFICATION_GUIDE.md) for details.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Error Handling](#error-handling)
3. [Data Models](#data-models)
4. [API Endpoints](#api-endpoints)
   - [Authentication & Users](#authentication--users)
   - [Organizations](#organizations)
   - [Stores](#stores)
   - [Products](#products)
   - [Categories](#categories)
   - [Brands](#brands)
   - [Orders](#orders)
   - [Customers](#customers)
   - [Reviews](#reviews)
5. [Test Credentials](#test-credentials)
6. [Implementation Notes](#implementation-notes)
7. [OpenAPI Integration](#openapi-integration)

---

## Authentication

### JWT Bearer Token

All endpoints require authentication via JWT Bearer Token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

### Login Flow

1. Call `/auth/login` with email and password
2. Receive JWT token in response
3. Include token in `Authorization` header for subsequent requests

**Test Credentials:**

| Email | Password | Role | Store Access |
|-------|----------|------|--------------|
| test@example.com | Test123!@# | Admin | Demo Store (PRO) |
| seller@example.com | Test123!@# | Seller | Demo Store (PRO) |
| buyer@example.com | Test123!@# | Customer | Acme Store (BASIC) |

---

## Error Handling

### Standard Error Response

```json
{
  "code": "ERROR_CODE",
  "message": "Human readable message",
  "details": {}
}
```

### Common HTTP Status Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (Deleted) |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (e.g., duplicate slug) |
| 500 | Internal Server Error |

---

## Data Models

### User

```json
{
  "id": "cmijjxiag000ifmloysnyfc3x",
  "email": "test@example.com",
  "name": "Test User",
  "image": "https://...",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Organization

```json
{
  "id": "org_123",
  "name": "Demo Company",
  "slug": "demo-company",
  "description": "Demo organization for testing",
  "logo": "https://...",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Store

```json
{
  "id": "store_123",
  "name": "Demo Store",
  "description": "Primary demonstration store",
  "organizationId": "org_123",
  "plan": "PRO",
  "status": "ACTIVE",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Available Plans:** FREE, BASIC, PRO, ENTERPRISE  
**Available Status:** ACTIVE, SUSPENDED, INACTIVE

### Product

```json
{
  "id": "prod_123",
  "name": "MacBook Pro 16-inch",
  "slug": "macbook-pro-16-inch",
  "description": "High-performance laptop for professionals",
  "price": 2499.99,
  "status": "ACTIVE",
  "storeId": "store_123",
  "categoryId": "cat_123",
  "brandId": "brand_123",
  "imageUrl": "https://...",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Status Values:** DRAFT, ACTIVE, ARCHIVED

### Product Variant

```json
{
  "id": "variant_123",
  "productId": "prod_123",
  "sku": "MBP-16-512GB",
  "options": {
    "storage": "512GB",
    "ram": "16GB",
    "color": "Space Gray"
  },
  "price": 2499.99,
  "stock": 45,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Category

```json
{
  "id": "cat_123",
  "name": "Electronics",
  "slug": "electronics",
  "description": "Electronic devices and gadgets",
  "image": "https://...",
  "storeId": "store_123",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Brand

```json
{
  "id": "brand_123",
  "name": "Apple",
  "slug": "apple",
  "description": "Apple Inc.",
  "logo": "https://...",
  "website": "https://apple.com",
  "storeId": "store_123",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Customer

```json
{
  "id": "cust_123",
  "email": "customer@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1-555-0123",
  "storeId": "store_123",
  "totalOrders": 5,
  "totalSpent": 1250.50,
  "averageOrderValue": 250.10,
  "lastOrderAt": "2024-01-14T15:30:00Z",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Order

```json
{
  "id": "order_123",
  "orderNumber": "ORD-2024-001",
  "status": "DELIVERED",
  "customerId": "cust_123",
  "storeId": "store_123",
  "totalAmount": 2749.98,
  "paymentStatus": "COMPLETED",
  "paymentMethod": "CREDIT_CARD",
  "paymentGateway": "STRIPE",
  "items": [
    {
      "id": "oi_123",
      "productId": "prod_123",
      "quantity": 1,
      "price": 2499.99
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Status Values:** PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELED  
**Payment Status:** PENDING, COMPLETED, FAILED, REFUNDED  
**Payment Methods:** CREDIT_CARD, DEBIT_CARD, PAYPAL, BANK_TRANSFER, CASH  
**Payment Gateways:** STRIPE, PAYPAL, SQUARE, RAZORPAY

### Review

```json
{
  "id": "rev_123",
  "rating": 5,
  "comment": "Excellent product, highly recommended!",
  "productId": "prod_123",
  "customerId": "cust_123",
  "storeId": "store_123",
  "isVerifiedPurchase": true,
  "isApproved": true,
  "approvedAt": "2024-01-15T12:00:00Z",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

## API Endpoints

### Authentication & Users

#### POST /auth/login

Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "test@example.com",
  "password": "Test123!@#"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "user_123",
    "email": "test@example.com",
    "name": "Test User"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- 401: Invalid credentials
- 400: Missing email or password

---

#### POST /auth/signup

Create a new user account.

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!@#",
  "name": "New User"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "user_456",
    "email": "newuser@example.com",
    "name": "New User"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- 400: Validation error
- 409: User already exists

---

#### GET /users/{userId}

Retrieve user information.

**Parameters:**
- `userId` (path, required): User ID

**Response (200):**
```json
{
  "id": "user_123",
  "email": "test@example.com",
  "name": "Test User",
  "image": "https://...",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Errors:**
- 404: User not found

---

#### PUT /users/{userId}

Update user information.

**Parameters:**
- `userId` (path, required): User ID

**Request:**
```json
{
  "name": "Updated Name",
  "image": "https://..."
}
```

**Response (200):**
```json
{
  "id": "user_123",
  "email": "test@example.com",
  "name": "Updated Name",
  "image": "https://...",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Errors:**
- 400: Validation error
- 404: User not found

---

#### DELETE /users/{userId}

Delete a user account.

**Parameters:**
- `userId` (path, required): User ID

**Response (204):** No content

**Errors:**
- 404: User not found

---

### Organizations

#### GET /organizations

List all organizations (paginated).

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page

**Response (200):**
```json
{
  "data": [
    {
      "id": "org_123",
      "name": "Demo Company",
      "slug": "demo-company",
      "description": "...",
      "logo": "https://...",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 10
}
```

---

#### POST /organizations

Create a new organization.

**Request:**
```json
{
  "name": "Acme Corp",
  "slug": "acme-corp",
  "description": "Acme Corporation"
}
```

**Response (201):**
```json
{
  "id": "org_456",
  "name": "Acme Corp",
  "slug": "acme-corp",
  "description": "Acme Corporation",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Errors:**
- 400: Validation error
- 409: Slug already exists

---

#### GET /organizations/{orgId}

Get organization details.

**Parameters:**
- `orgId` (path, required): Organization ID

**Response (200):**
```json
{
  "id": "org_123",
  "name": "Demo Company",
  "slug": "demo-company",
  "description": "...",
  "logo": "https://...",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Errors:**
- 404: Organization not found

---

#### PUT /organizations/{orgId}

Update organization details.

**Parameters:**
- `orgId` (path, required): Organization ID

**Request:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "logo": "https://..."
}
```

**Response (200):** Updated organization object

**Errors:**
- 400: Validation error
- 404: Organization not found

---

#### DELETE /organizations/{orgId}

Delete an organization.

**Parameters:**
- `orgId` (path, required): Organization ID

**Response (204):** No content

**Errors:**
- 404: Organization not found

---

### Stores

#### GET /stores

List all stores with optional filtering.

**Query Parameters:**
- `organizationId` (optional): Filter by organization
- `status` (optional): Filter by status (ACTIVE, SUSPENDED, INACTIVE)
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page

**Response (200):**
```json
{
  "data": [
    {
      "id": "store_123",
      "name": "Demo Store",
      "description": "...",
      "organizationId": "org_123",
      "plan": "PRO",
      "status": "ACTIVE",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 10
}
```

---

#### POST /stores

Create a new store.

**Request:**
```json
{
  "name": "Demo Store",
  "description": "Primary demonstration store",
  "organizationId": "org_123",
  "plan": "PRO"
}
```

**Response (201):** Created store object

**Errors:**
- 400: Validation error
- 404: Organization not found

---

#### GET /stores/{storeId}

Get store details.

**Parameters:**
- `storeId` (path, required): Store ID

**Response (200):** Store object

**Errors:**
- 404: Store not found

---

#### PUT /stores/{storeId}

Update store details.

**Parameters:**
- `storeId` (path, required): Store ID

**Request:**
```json
{
  "name": "Updated Store Name",
  "description": "Updated description",
  "status": "ACTIVE",
  "plan": "PRO"
}
```

**Response (200):** Updated store object

**Errors:**
- 400: Validation error
- 404: Store not found

---

#### DELETE /stores/{storeId}

Delete a store.

**Parameters:**
- `storeId` (path, required): Store ID

**Response (204):** No content

**Errors:**
- 404: Store not found

---

### Products

#### GET /products

List all products with optional filtering and search.

**Query Parameters:**
- `storeId` (required): Store ID
- `categoryId` (optional): Filter by category
- `brandId` (optional): Filter by brand
- `status` (optional): Filter by status (DRAFT, ACTIVE, ARCHIVED)
- `search` (optional): Search by name or description
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page

**Response (200):**
```json
{
  "data": [
    {
      "id": "prod_123",
      "name": "MacBook Pro 16-inch",
      "slug": "macbook-pro-16-inch",
      "description": "...",
      "price": 2499.99,
      "status": "ACTIVE",
      "storeId": "store_123",
      "categoryId": "cat_123",
      "brandId": "brand_123",
      "imageUrl": "https://...",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 20
}
```

**Note:** Seeded data includes 15 products across 5 categories and 4 brands.

---

#### POST /products

Create a new product.

**Request:**
```json
{
  "name": "New Product",
  "slug": "new-product",
  "description": "Product description",
  "price": 99.99,
  "storeId": "store_123",
  "categoryId": "cat_123",
  "brandId": "brand_123",
  "imageUrl": "https://...",
  "status": "DRAFT"
}
```

**Response (201):** Created product object

**Errors:**
- 400: Validation error
- 404: Store not found

---

#### GET /products/{productId}

Get product details including variants.

**Parameters:**
- `productId` (path, required): Product ID

**Response (200):**
```json
{
  "id": "prod_123",
  "name": "MacBook Pro 16-inch",
  "slug": "macbook-pro-16-inch",
  "description": "...",
  "price": 2499.99,
  "status": "ACTIVE",
  "storeId": "store_123",
  "categoryId": "cat_123",
  "brandId": "brand_123",
  "imageUrl": "https://...",
  "variants": [
    {
      "id": "variant_1",
      "sku": "MBP-16-512GB",
      "options": {
        "storage": "512GB",
        "ram": "16GB"
      },
      "price": 2499.99,
      "stock": 45
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Errors:**
- 404: Product not found

---

#### PUT /products/{productId}

Update product information.

**Parameters:**
- `productId` (path, required): Product ID

**Request:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "price": 1999.99,
  "status": "ACTIVE",
  "categoryId": "cat_123",
  "brandId": "brand_123",
  "imageUrl": "https://..."
}
```

**Response (200):** Updated product object

**Errors:**
- 400: Validation error
- 404: Product not found

---

#### DELETE /products/{productId}

Delete a product.

**Parameters:**
- `productId` (path, required): Product ID

**Response (204):** No content

**Errors:**
- 404: Product not found

---

### Categories

#### GET /categories

List all product categories.

**Query Parameters:**
- `storeId` (required): Store ID
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page

**Response (200):**
```json
{
  "data": [
    {
      "id": "cat_123",
      "name": "Electronics",
      "slug": "electronics",
      "description": "...",
      "image": "https://...",
      "storeId": "store_123",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20
}
```

**Note:** Seeded data includes 5 categories: Electronics, Clothing, Accessories, Home & Garden, Sports

---

#### POST /categories

Create a new product category.

**Request:**
```json
{
  "name": "New Category",
  "slug": "new-category",
  "description": "Category description",
  "storeId": "store_123",
  "image": "https://..."
}
```

**Response (201):** Created category object

**Errors:**
- 400: Validation error
- 404: Store not found

---

#### GET /categories/{categoryId}

Get category details.

**Parameters:**
- `categoryId` (path, required): Category ID

**Response (200):** Category object

**Errors:**
- 404: Category not found

---

#### PUT /categories/{categoryId}

Update category information.

**Parameters:**
- `categoryId` (path, required): Category ID

**Request:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "image": "https://..."
}
```

**Response (200):** Updated category object

**Errors:**
- 400: Validation error
- 404: Category not found

---

#### DELETE /categories/{categoryId}

Delete a category.

**Parameters:**
- `categoryId` (path, required): Category ID

**Response (204):** No content

**Errors:**
- 404: Category not found

---

### Brands

#### GET /brands

List all brands.

**Query Parameters:**
- `storeId` (required): Store ID
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page

**Response (200):**
```json
{
  "data": [
    {
      "id": "brand_123",
      "name": "Apple",
      "slug": "apple",
      "description": "...",
      "logo": "https://...",
      "website": "https://apple.com",
      "storeId": "store_123",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 4,
  "page": 1,
  "limit": 20
}
```

**Note:** Seeded data includes 4 brands: Apple, Nike, Samsung, Sony

---

#### POST /brands

Create a new brand.

**Request:**
```json
{
  "name": "New Brand",
  "slug": "new-brand",
  "description": "Brand description",
  "storeId": "store_123",
  "logo": "https://...",
  "website": "https://..."
}
```

**Response (201):** Created brand object

**Errors:**
- 400: Validation error
- 404: Store not found

---

#### GET /brands/{brandId}

Get brand details.

**Parameters:**
- `brandId` (path, required): Brand ID

**Response (200):** Brand object

**Errors:**
- 404: Brand not found

---

#### PUT /brands/{brandId}

Update brand information.

**Parameters:**
- `brandId` (path, required): Brand ID

**Request:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "logo": "https://...",
  "website": "https://..."
}
```

**Response (200):** Updated brand object

**Errors:**
- 400: Validation error
- 404: Brand not found

---

#### DELETE /brands/{brandId}

Delete a brand.

**Parameters:**
- `brandId` (path, required): Brand ID

**Response (204):** No content

**Errors:**
- 404: Brand not found

---

### Orders

#### GET /orders

List all orders with optional filtering.

**Query Parameters:**
- `storeId` (required): Store ID
- `status` (optional): Filter by status (PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELED)
- `customerId` (optional): Filter by customer
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page

**Response (200):**
```json
{
  "data": [
    {
      "id": "order_123",
      "orderNumber": "ORD-2024-001",
      "status": "DELIVERED",
      "customerId": "cust_123",
      "storeId": "store_123",
      "totalAmount": 2749.98,
      "paymentStatus": "COMPLETED",
      "paymentMethod": "CREDIT_CARD",
      "paymentGateway": "STRIPE",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 20,
  "page": 1,
  "limit": 10
}
```

**Note:** Seeded data includes 20 orders with varied statuses

---

#### POST /orders

Create a new order.

**Request:**
```json
{
  "customerId": "cust_123",
  "storeId": "store_123",
  "items": [
    {
      "productId": "prod_123",
      "quantity": 2,
      "price": 99.99
    }
  ],
  "paymentMethod": "CREDIT_CARD",
  "paymentGateway": "STRIPE"
}
```

**Response (201):** Created order object

**Errors:**
- 400: Validation error
- 404: Customer or store not found

---

#### GET /orders/{orderId}

Get order details including items.

**Parameters:**
- `orderId` (path, required): Order ID

**Response (200):**
```json
{
  "id": "order_123",
  "orderNumber": "ORD-2024-001",
  "status": "DELIVERED",
  "customerId": "cust_123",
  "storeId": "store_123",
  "totalAmount": 2749.98,
  "paymentStatus": "COMPLETED",
  "paymentMethod": "CREDIT_CARD",
  "paymentGateway": "STRIPE",
  "items": [
    {
      "id": "oi_123",
      "productId": "prod_123",
      "quantity": 1,
      "price": 2499.99
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Errors:**
- 404: Order not found

---

#### PUT /orders/{orderId}

Update order status or details.

**Parameters:**
- `orderId` (path, required): Order ID

**Request:**
```json
{
  "status": "SHIPPED",
  "paymentStatus": "COMPLETED",
  "trackingNumber": "TRACK-123456"
}
```

**Response (200):** Updated order object

**Errors:**
- 400: Validation error
- 404: Order not found

---

#### DELETE /orders/{orderId}

Delete an order.

**Parameters:**
- `orderId` (path, required): Order ID

**Response (204):** No content

**Errors:**
- 404: Order not found

---

### Customers

#### GET /customers

List all customers with optional filtering.

**Query Parameters:**
- `storeId` (required): Store ID
- `search` (optional): Search by email or name
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page

**Response (200):**
```json
{
  "data": [
    {
      "id": "cust_123",
      "email": "customer@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1-555-0123",
      "storeId": "store_123",
      "totalOrders": 5,
      "totalSpent": 1250.50,
      "averageOrderValue": 250.10,
      "lastOrderAt": "2024-01-14T15:30:00Z",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 10
}
```

**Note:** Seeded data includes 15 customers with diverse profiles

---

#### POST /customers

Create a new customer.

**Request:**
```json
{
  "email": "newcustomer@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1-555-0456",
  "storeId": "store_123"
}
```

**Response (201):** Created customer object

**Errors:**
- 400: Validation error
- 404: Store not found

---

#### GET /customers/{customerId}

Get customer details.

**Parameters:**
- `customerId` (path, required): Customer ID

**Response (200):** Customer object

**Errors:**
- 404: Customer not found

---

#### PUT /customers/{customerId}

Update customer information.

**Parameters:**
- `customerId` (path, required): Customer ID

**Request:**
```json
{
  "firstName": "Updated Name",
  "lastName": "Updated Last Name",
  "phone": "+1-555-0789"
}
```

**Response (200):** Updated customer object

**Errors:**
- 400: Validation error
- 404: Customer not found

---

#### DELETE /customers/{customerId}

Delete a customer.

**Parameters:**
- `customerId` (path, required): Customer ID

**Response (204):** No content

**Errors:**
- 404: Customer not found

---

### Reviews

#### GET /reviews

List all reviews with optional filtering.

**Query Parameters:**
- `storeId` (required): Store ID
- `productId` (optional): Filter by product
- `approved` (optional): Filter by approval status (true/false)
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page

**Response (200):**
```json
{
  "data": [
    {
      "id": "rev_123",
      "rating": 5,
      "comment": "Excellent product, highly recommended!",
      "productId": "prod_123",
      "customerId": "cust_123",
      "storeId": "store_123",
      "isVerifiedPurchase": true,
      "isApproved": true,
      "approvedAt": "2024-01-15T12:00:00Z",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 10
}
```

**Note:** Seeded data includes 10 reviews with ratings and approval status

---

#### POST /reviews

Create a product review.

**Request:**
```json
{
  "rating": 4,
  "comment": "Great product!",
  "productId": "prod_123",
  "customerId": "cust_123",
  "storeId": "store_123",
  "isVerifiedPurchase": true
}
```

**Response (201):** Created review object

**Errors:**
- 400: Validation error
- 404: Product or store not found

---

#### GET /reviews/{reviewId}

Get review details.

**Parameters:**
- `reviewId` (path, required): Review ID

**Response (200):** Review object

**Errors:**
- 404: Review not found

---

#### PUT /reviews/{reviewId}

Update review or approve/reject it.

**Parameters:**
- `reviewId` (path, required): Review ID

**Request:**
```json
{
  "rating": 5,
  "comment": "Updated comment",
  "isApproved": true
}
```

**Response (200):** Updated review object

**Errors:**
- 400: Validation error
- 404: Review not found

---

#### DELETE /reviews/{reviewId}

Delete a review.

**Parameters:**
- `reviewId` (path, required): Review ID

**Response (204):** No content

**Errors:**
- 404: Review not found

---

## Test Credentials

Use these credentials to test the API endpoints:

### Primary Account (Admin)
- **Email:** test@example.com
- **Password:** Test123!@#
- **Organization:** Demo Company
- **Store:** Demo Store (PRO plan)
- **Store ID:** cmijjxiag000ifmloysnyfc3x

### Secondary Account (Seller)
- **Email:** seller@example.com
- **Password:** Test123!@#
- **Organization:** Demo Company
- **Store:** Demo Store (PRO plan)
- **Store ID:** cmijjxiag000ifmloysnyfc3x

### Third Account (Customer)
- **Email:** buyer@example.com
- **Password:** Test123!@#
- **Organization:** Acme Corp
- **Store:** Acme Store (BASIC plan)
- **Store ID:** cmijjxiag000hfmloc0xtoiqg

---

## Implementation Notes

### Multi-Tenancy

All endpoints enforce multi-tenancy by:
1. Requiring `storeId` in query parameters for filtered operations
2. Validating that authenticated user has access to the specified store
3. Preventing cross-store data leakage through authorization checks

### Pagination

List endpoints support pagination:
- **page:** 1-based page number (default: 1)
- **limit:** Items per page (default varies by endpoint)

### Timestamps

All timestamps are in ISO 8601 format (UTC):
- `createdAt`: Record creation timestamp
- `updatedAt`: Last modification timestamp

### Status Codes

- **200:** Successful GET/PUT request
- **201:** Successful POST request (resource created)
- **204:** Successful DELETE request (no content)
- **400:** Validation error or malformed request
- **401:** Missing or invalid authentication token
- **404:** Resource not found
- **409:** Conflict (e.g., duplicate slug)
- **500:** Server error

### Rate Limiting

Not currently implemented. Will be added in production.

### CORS

CORS is configured to allow requests from:
- localhost:3000
- localhost:3000
- Production domain (when deployed)

### Request/Response Content-Type

All requests and responses use `application/json` content type.

---

## Seeded Test Data Summary

The database has been seeded with comprehensive test data:

| Entity | Count | Details |
|--------|-------|---------|
| Users | 3 | test@, seller@, buyer@ (all with Test123!@# password) |
| Organizations | 2 | Demo Company, Acme Corp |
| Stores | 2 | Demo Store (PRO), Acme Store (BASIC) |
| Categories | 5 | Electronics, Clothing, Accessories, Home & Garden, Sports |
| Brands | 4 | Apple, Nike, Samsung, Sony |
| Products | 15 | Distributed across categories with 2-3 variants each |
| Product Variants | 40+ | With SKU, options, pricing, and stock information |
| Customers | 15 | With email, phone, and purchase history |
| Orders | 20 | With varied statuses and payment methods |
| Reviews | 10 | With ratings and approval status |

---

## OpenAPI Integration

### 🎯 What is OpenAPI?

OpenAPI (formerly Swagger) is an industry-standard specification for describing RESTful APIs. The StormCom API is now fully documented using **OpenAPI 3.0**, providing:

- ✅ Machine-readable API definition
- ✅ Automatic client SDK generation (50+ languages)
- ✅ Interactive documentation (Swagger UI)
- ✅ API contract testing
- ✅ Mock server generation
- ✅ Request/response validation

### 📁 Available Specification Files

| File | Format | Size | Use Case |
|------|--------|------|----------|
| `openapi-spec.json` | JSON | 31 KB | API clients, code generation, automation |
| `openapi-spec.yaml` | YAML | 24 KB | Human editing, version control, readability |

### 🚀 Quick Start with OpenAPI

#### 1. View Interactive Documentation

**Swagger Editor (Online)**
1. Go to https://editor.swagger.io
2. File → Import File → Select `docs/openapi-spec.json`
3. View interactive docs with "Try it out" feature

**Postman**
1. Import → Link → OpenAPI 3.0
2. Upload `docs/openapi-spec.json`
3. Auto-generates collection with all endpoints

#### 2. Generate Client SDK

```bash
# Install OpenAPI Generator
npm install @openapitools/openapi-generator-cli -g

# Generate TypeScript client
openapi-generator-cli generate \
  -i docs/openapi-spec.json \
  -g typescript-axios \
  -o ./generated/api-client

# Generate Python client
openapi-generator-cli generate \
  -i docs/openapi-spec.json \
  -g python \
  -o ./generated/python-client
```

#### 3. Set Up Swagger UI in Next.js

```bash
# Install dependencies
npm install swagger-ui-react swagger-ui-express

# Create API docs page at /api-docs
# See OPENAPI_SPECIFICATION_GUIDE.md for complete setup
```

#### 4. API Contract Testing

```bash
# Install Dredd
npm install -g dredd

# Run API tests against spec
dredd docs/openapi-spec.yaml http://localhost:3000/api
```

### 📚 Complete OpenAPI Documentation

For comprehensive OpenAPI usage guide, see:
- **[OPENAPI_SPECIFICATION_GUIDE.md](./OPENAPI_SPECIFICATION_GUIDE.md)** - Complete guide with examples, tools, and best practices

### 🔗 OpenAPI Features

The OpenAPI spec includes:
- ✅ All 17 endpoints documented
- ✅ Complete request/response schemas
- ✅ Authentication requirements (JWT Bearer)
- ✅ Error response definitions
- ✅ Data model schemas (11 entities)
- ✅ Query parameter validation
- ✅ Multi-tenant architecture documented
- ✅ Examples for every endpoint

### 💡 Benefits of Using OpenAPI

1. **Client SDK Generation**: Generate type-safe clients for JavaScript, Python, Java, C#, Go, and 50+ more languages
2. **Interactive Documentation**: Swagger UI provides "Try it out" functionality
3. **API Testing**: Automate testing with tools like Dredd, Postman, or Pact
4. **Mock Servers**: Generate mock APIs for frontend development (Prism)
5. **Validation**: Ensure requests/responses match the schema
6. **Documentation Sync**: Single source of truth for API behavior

### 🛠️ Recommended Tools

| Tool | Purpose | Link |
|------|---------|------|
| Swagger UI | Interactive API documentation | https://swagger.io/tools/swagger-ui/ |
| Swagger Editor | Edit and validate OpenAPI specs | https://editor.swagger.io |
| OpenAPI Generator | Generate client SDKs | https://openapi-generator.tech |
| Redoc | Beautiful API documentation | https://redocly.com/redoc |
| Prism | Mock API server | https://stoplight.io/open-source/prism |
| Dredd | API contract testing | https://dredd.org |

---

## Support

For issues or questions about the API, contact:
- **Email:** support@stormcom.io
- **GitHub:** https://github.com/stormcom/stormcom-ui
- **Documentation Issues:** See [OPENAPI_SPECIFICATION_GUIDE.md](./OPENAPI_SPECIFICATION_GUIDE.md)

---

**Last Updated:** November 29, 2025  
**API Version:** 1.0.0  
**OpenAPI Version:** 3.0.3  
**Status:** Production Ready ✅
