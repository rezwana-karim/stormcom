# Product CRUD API Documentation

## Overview

The Product API provides comprehensive endpoints for managing products in a multi-tenant e-commerce platform. All endpoints require authentication and enforce store-level access control.

## Base URL

```
/api/products
```

## Authentication

All endpoints require a valid session. The API uses NextAuth.js for authentication.

**Headers:**
- `Cookie`: Session cookie from NextAuth authentication

## Multi-Tenant Security

All product operations are scoped to a specific store. The `storeId` parameter is required and validated against the authenticated user's organization membership to prevent cross-tenant data access.

---

## Endpoints

### List Products

```http
GET /api/products?storeId={storeId}
```

Retrieves a paginated list of products for a store.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `storeId` | string | Yes | - | Store ID (CUID format) |
| `page` | number | No | 1 | Page number (1-indexed) |
| `perPage` | number | No | 10 | Items per page (max 100) |
| `search` | string | No | - | Search in name and SKU |
| `categoryId` | string | No | - | Filter by category ID |
| `brandId` | string | No | - | Filter by brand ID |
| `status` | string | No | - | Filter by status: `DRAFT`, `ACTIVE`, `ARCHIVED` |
| `isFeatured` | boolean | No | - | Filter featured products |
| `minPrice` | number | No | - | Minimum price filter |
| `maxPrice` | number | No | - | Maximum price filter |
| `inventoryStatus` | string | No | - | Filter: `IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`, `DISCONTINUED` |
| `sortBy` | string | No | `createdAt` | Sort field: `name`, `price`, `createdAt`, `updatedAt` |
| `sortOrder` | string | No | `desc` | Sort direction: `asc`, `desc` |

#### Response

```json
{
  "products": [
    {
      "id": "clx123...",
      "storeId": "clx456...",
      "name": "Product Name",
      "slug": "product-name",
      "description": "Product description",
      "shortDescription": "Short description",
      "price": 29.99,
      "compareAtPrice": 39.99,
      "costPrice": 15.00,
      "sku": "PROD-001",
      "barcode": "123456789",
      "trackInventory": true,
      "inventoryQty": 100,
      "lowStockThreshold": 10,
      "inventoryStatus": "IN_STOCK",
      "weight": 0.5,
      "length": 10,
      "width": 5,
      "height": 2,
      "categoryId": "clx789...",
      "category": {
        "id": "clx789...",
        "name": "Electronics",
        "slug": "electronics"
      },
      "brandId": "clxabc...",
      "brand": {
        "id": "clxabc...",
        "name": "Brand Name",
        "slug": "brand-name"
      },
      "images": ["https://example.com/image1.jpg"],
      "thumbnailUrl": "https://example.com/thumb.jpg",
      "metaTitle": "SEO Title",
      "metaDescription": "SEO Description",
      "metaKeywords": "keyword1, keyword2",
      "seoTitle": "Additional SEO Title",
      "seoDescription": "Additional SEO Description",
      "status": "ACTIVE",
      "publishedAt": "2024-01-15T10:30:00.000Z",
      "isFeatured": false,
      "variants": [
        {
          "id": "clxvar...",
          "name": "Small",
          "sku": "PROD-001-S",
          "price": 29.99,
          "inventoryQty": 50,
          "isDefault": true,
          "image": null
        }
      ],
      "attributes": [
        {
          "id": "clxattr...",
          "attributeId": "clxattrdef...",
          "value": "Blue",
          "attribute": {
            "id": "clxattrdef...",
            "name": "Color",
            "values": "[\"Red\", \"Blue\", \"Green\"]"
          }
        }
      ],
      "_count": {
        "orderItems": 5,
        "reviews": 12
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "deletedAt": null
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

---

### Get Product by ID

```http
GET /api/products/{id}?storeId={storeId}
```

Retrieves a single product by ID.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Product ID (CUID format) |

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `storeId` | string | Yes | Store ID (CUID format) |

#### Response

Returns a single product object (same structure as list item).

#### Error Responses

| Status | Description |
|--------|-------------|
| 401 | Unauthorized - No valid session |
| 403 | Access denied - User not authorized for store |
| 404 | Product not found |

---

### Create Product

```http
POST /api/products
```

Creates a new product.

#### Request Body

```json
{
  "storeId": "clx456...",
  "name": "New Product",
  "slug": "new-product",
  "description": "Product description",
  "shortDescription": "Short description",
  "price": 29.99,
  "compareAtPrice": 39.99,
  "costPrice": 15.00,
  "sku": "PROD-001",
  "barcode": "123456789",
  "trackInventory": true,
  "inventoryQty": 100,
  "lowStockThreshold": 10,
  "weight": 0.5,
  "length": 10,
  "width": 5,
  "height": 2,
  "categoryId": "clx789...",
  "brandId": "clxabc...",
  "images": ["https://example.com/image1.jpg"],
  "thumbnailUrl": "https://example.com/thumb.jpg",
  "metaTitle": "SEO Title",
  "metaDescription": "SEO Description",
  "metaKeywords": "keyword1, keyword2",
  "seoTitle": "Additional SEO Title",
  "seoDescription": "Additional SEO Description",
  "status": "DRAFT",
  "isFeatured": false,
  "variants": [
    {
      "name": "Small",
      "sku": "PROD-001-S",
      "price": 29.99,
      "inventoryQty": 50,
      "lowStockThreshold": 5,
      "weight": 0.4,
      "image": "https://example.com/small.jpg",
      "options": {"size": "S"},
      "isDefault": true
    }
  ],
  "attributes": [
    {
      "attributeId": "clxattrdef...",
      "value": "Blue"
    }
  ]
}
```

#### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `storeId` | string | Store ID (verified against user's access) |
| `name` | string | Product name (1-255 chars) |
| `sku` | string | Stock Keeping Unit (unique per store) |
| `price` | number | Product price (≥ 0) |

#### Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `slug` | string | auto-generated | URL-friendly identifier (unique per store) |
| `description` | string | null | Full product description |
| `shortDescription` | string | null | Short description (max 500 chars) |
| `compareAtPrice` | number | null | Original price for sale display |
| `costPrice` | number | null | Cost price for profit calculation |
| `barcode` | string | null | Product barcode |
| `trackInventory` | boolean | true | Enable inventory tracking |
| `inventoryQty` | number | 0 | Current stock quantity |
| `lowStockThreshold` | number | 5 | Low stock alert threshold |
| `weight` | number | null | Product weight (kg) |
| `length` | number | null | Length (cm) |
| `width` | number | null | Width (cm) |
| `height` | number | null | Height (cm) |
| `categoryId` | string | null | Category ID |
| `brandId` | string | null | Brand ID |
| `images` | string[] | [] | Array of image URLs |
| `thumbnailUrl` | string | null | Thumbnail image URL |
| `metaTitle` | string | null | SEO title (max 255 chars) |
| `metaDescription` | string | null | SEO description (max 500 chars) |
| `metaKeywords` | string | null | SEO keywords |
| `seoTitle` | string | null | Additional SEO title |
| `seoDescription` | string | null | Additional SEO description |
| `status` | string | "DRAFT" | Status: DRAFT, ACTIVE, ARCHIVED |
| `isFeatured` | boolean | false | Featured product flag |
| `variants` | array | [] | Product variants (max 100) |
| `attributes` | array | [] | Product attribute values |

#### Response

```json
{
  "id": "clx123...",
  "storeId": "clx456...",
  "name": "New Product",
  "slug": "new-product",
  // ... full product object
}
```

**Status Code:** 201 Created

---

### Update Product (PATCH)

```http
PATCH /api/products/{id}
```

Partially updates a product. Only provided fields are updated.

#### Request Body

Include only the fields you want to update:

```json
{
  "storeId": "clx456...",
  "name": "Updated Product Name",
  "price": 34.99,
  "status": "ACTIVE"
}
```

---

### Update Product (PUT)

```http
PUT /api/products/{id}
```

Full product update. Replaces all fields with provided values.

Same request body structure as POST.

---

### Delete Product (Soft Delete)

```http
DELETE /api/products/{id}?storeId={storeId}
```

Soft deletes a product by setting `deletedAt` timestamp. The product is also archived.

#### Response

```json
{
  "success": true,
  "message": "Product deleted successfully",
  "deletedAt": "2024-01-15T10:30:00.000Z"
}
```

---

## Bulk Import

### CSV Import

```http
POST /api/products/import
```

Bulk imports products from a CSV file using [papaparse](https://www.papaparse.com/) for robust CSV parsing that handles edge cases like multiline quoted fields, different line endings, and escaped characters.

#### Request

- **Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | CSV file (max 10MB) |
| `storeId` | string | Yes | Store ID (verified against user's organization membership) |

#### CSV Format

Required columns:
- `name` - Product name
- `sku` - Stock Keeping Unit
- `price` - Product price

Optional columns:
- `description`
- `categoryId`
- `brandId`
- `inventoryQty`
- `status`
- `images` (comma-separated URLs or JSON array)

**Example CSV:**
```csv
name,sku,price,description,categoryId,inventoryQty,status
"Product 1",SKU001,29.99,"Description here",clxcat123,100,DRAFT
"Product 2",SKU002,49.99,"Another product",clxcat456,50,ACTIVE
"Product with ""quotes""",SKU003,19.99,"Description with, comma",clxcat789,25,DRAFT
```

> **Note:** The CSV parser handles quoted fields, escaped quotes (doubled `""`), and commas within quotes correctly.

#### Response

```json
{
  "success": true,
  "imported": 95,
  "total": 100,
  "errors": [
    {
      "row": 5,
      "error": "Invalid price format"
    }
  ]
}
```

---

## Image Upload

### Single Image Upload

```http
POST /api/products/upload
```

Uploads a single product image.

#### Request

- **Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | File | Yes | Image file (max 10MB) |
| `storeId` | string | Yes | Store ID |

**Allowed MIME types:**
- `image/jpeg`
- `image/png`
- `image/gif`
- `image/webp`

> **Note:** SVG files are not allowed to prevent XSS attacks.

#### Response

```json
{
  "success": true,
  "url": "/uploads/products/clx456.../1704067200000-abc123.jpg",
  "filename": "1704067200000-abc123.jpg",
  "originalName": "product-photo.jpg",
  "size": 245678,
  "type": "image/jpeg"
}
```

### Multiple Image Upload

```http
PUT /api/products/upload
```

Uploads multiple product images (max 10 per request).

#### Request

- **Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `images` | File[] | Yes | Array of image files |
| `storeId` | string | Yes | Store ID |

#### Response

```json
{
  "success": true,
  "uploaded": 8,
  "total": 10,
  "urls": [
    "/uploads/products/clx456.../1704067200000-abc123.jpg",
    "/uploads/products/clx456.../1704067200001-def456.jpg"
  ],
  "results": [
    {
      "success": true,
      "url": "/uploads/products/clx456.../1704067200000-abc123.jpg",
      "filename": "1704067200000-abc123.jpg",
      "originalName": "photo1.jpg"
    },
    {
      "success": false,
      "originalName": "toolarge.jpg",
      "error": "File size exceeds maximum allowed size of 10MB"
    }
  ]
}
```

---

## Error Responses

All endpoints return consistent error responses:

### 400 Bad Request

```json
{
  "error": "Validation error",
  "details": [
    {
      "code": "too_small",
      "message": "Name must be at least 1 character",
      "path": ["name"]
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "error": "Access denied. You do not have permission to access this store."
}
```

### 404 Not Found

```json
{
  "error": "Product not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Failed to fetch products"
}
```

---

## Data Models

### Product Status

| Value | Description |
|-------|-------------|
| `DRAFT` | Product is not yet published |
| `ACTIVE` | Product is live and visible |
| `ARCHIVED` | Product is archived (soft deleted) |

### Inventory Status

| Value | Description |
|-------|-------------|
| `IN_STOCK` | Stock above low threshold |
| `LOW_STOCK` | Stock at or below threshold |
| `OUT_OF_STOCK` | Zero stock |
| `DISCONTINUED` | No longer available |

### Variant Options

Variant options are stored as JSON:

```json
{
  "size": "Large",
  "color": "Blue",
  "material": "Cotton"
}
```

---

## Rate Limits

- Standard API: 100 requests/minute
- Bulk Import: 10 requests/minute
- Image Upload: 50 requests/minute

---

## Best Practices

1. **Always provide `storeId`** - Required for multi-tenant isolation
2. **Use PATCH for partial updates** - Avoids overwriting unintended fields
3. **Validate images client-side** - Check size and type before upload
4. **Handle pagination** - Use `page` and `perPage` for large datasets
5. **Check response status** - Handle errors gracefully in your client

---

## Changelog

### v1.1.0 (Code Review Improvements)
- **CSV Import**: Replaced custom CSV parser with [papaparse](https://www.papaparse.com/) library for robust handling of edge cases (multiline quoted fields, different line endings, escaped characters)
- **Type Safety**: Improved Zod error handling using proper `ZodIssue` type
- **Store ID Validation**: Enhanced CUID format validation for store IDs with support for both CUID and CUID2 formats
- **Documentation**: Added transaction guarantee documentation for variant/attribute updates
- **Migration**: Added documentation for Product_sku_idx index removal (replaced by multi-tenant composite unique constraint)

### v1.0.0 (Initial Release)
- Product CRUD operations
- Variant management (0-100 variants per product)
- CSV bulk import
- Image upload (single and multiple)
- Multi-tenant security with store access verification
- Zod schema validation
- SEO fields support
- Product attributes support
