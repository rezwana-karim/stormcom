# OpenAPI Specification Guide - StormCom E-commerce API

## 📘 Overview

This guide explains how to use the OpenAPI 3.0 specification for the StormCom E-commerce API. The OpenAPI spec provides a machine-readable definition of the entire API, enabling automatic documentation generation, client SDK generation, and API testing tools.

---

## 📁 Available Specification Files

### JSON Format
- **File**: `openapi-spec.json`
- **Size**: ~31 KB
- **Use For**: API clients, code generation, automated testing
- **Location**: `docs/openapi-spec.json`

### YAML Format
- **File**: `openapi-spec.yaml`
- **Size**: ~24 KB
- **Use For**: Human-readable documentation, editing, version control
- **Location**: `docs/openapi-spec.yaml`

Both files contain identical API definitions in different formats.

---

## 🚀 Quick Start

### 1. View Interactive Documentation

#### Option A: Swagger UI (Recommended)
```bash
# Install Swagger UI Express (if not already installed)
npm install swagger-ui-express

# Add to your Next.js API route: /api/docs
```

#### Option B: Online Swagger Editor
1. Go to https://editor.swagger.io
2. File → Import File
3. Select `docs/openapi-spec.json` or `docs/openapi-spec.yaml`
4. View interactive documentation with "Try it out" features

#### Option C: Postman
1. Open Postman
2. Import → Link → Select OpenAPI 3.0
3. Upload `docs/openapi-spec.json`
4. Auto-generates collection with all 17 endpoints

#### Option D: Redoc
```bash
# Install Redoc CLI
npm install -g redoc-cli

# Generate HTML documentation
redoc-cli bundle docs/openapi-spec.yaml -o docs/api-docs.html

# Open in browser
start docs/api-docs.html  # Windows
open docs/api-docs.html   # Mac
```

### 2. Generate API Client SDK

#### JavaScript/TypeScript Client
```bash
# Install OpenAPI Generator
npm install @openapitools/openapi-generator-cli -g

# Generate TypeScript client
openapi-generator-cli generate \
  -i docs/openapi-spec.json \
  -g typescript-axios \
  -o ./generated/api-client

# Use in your project
import { DefaultApi, Configuration } from './generated/api-client';

const config = new Configuration({
  basePath: 'http://localhost:3000/api',
  accessToken: 'your-jwt-token'
});
const api = new DefaultApi(config);
```

#### Python Client
```bash
openapi-generator-cli generate \
  -i docs/openapi-spec.json \
  -g python \
  -o ./generated/python-client
```

#### Other Languages Supported
- Java
- C#
- Ruby
- PHP
- Go
- Swift
- Kotlin
- And 50+ more languages

### 3. API Testing with OpenAPI

#### Automated Testing with Dredd
```bash
# Install Dredd
npm install -g dredd

# Run API tests against spec
dredd docs/openapi-spec.yaml http://localhost:3000/api

# With authentication
dredd docs/openapi-spec.yaml http://localhost:3000/api \
  --header "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Postman Collection Generation
```bash
# Use openapi-to-postmanv2
npm install -g openapi-to-postmanv2

# Generate Postman collection
openapi2postmanv2 -s docs/openapi-spec.json -o postman-collection-v2.json

# Import generated collection into Postman
```

---

## 📋 API Specification Structure

### 1. API Information
```yaml
info:
  title: StormCom E-commerce API
  version: 1.0.0
  description: Multi-tenant SaaS e-commerce platform API
  contact:
    name: CodeStorm Hub
    email: salman.reza.232@northsouth.edu
```

### 2. Servers
- **Development**: http://localhost:3000/api
- **Production**: https://stormcom.vercel.app/api

### 3. Authentication
**Type**: Bearer JWT Token
**Header**: `Authorization: Bearer {token}`
**Obtain Token**: POST `/auth/login`

### 4. API Tags (Resource Groups)
- 🔐 **Authentication** (2 endpoints)
- 🏢 **Organizations** (2 endpoints)
- 🏪 **Stores** (1 endpoint)
- 📦 **Products** (1 endpoint with filters)
- 📂 **Categories** (1 endpoint)
- 🏷️ **Brands** (1 endpoint)
- 👥 **Customers** (1 endpoint)
- 🛒 **Orders** (1 endpoint)
- ⭐ **Reviews** (1 endpoint)

**Total**: 17 documented endpoints

### 5. Data Models (9 Schemas)
1. `User` - User account information
2. `Organization` - Multi-tenant organization
3. `Store` - E-commerce store (PRO/BASIC/FREE plans)
4. `Product` - Product with variants
5. `ProductVariant` - Product variant (color, size, etc.)
6. `Category` - Product category
7. `Brand` - Product brand
8. `Customer` - Store customer
9. `Order` - Order with items
10. `OrderItem` - Individual order item
11. `Review` - Product review with ratings

---

## 🔍 Common Use Cases

### Use Case 1: Generate Swagger UI Documentation

**Step 1**: Install dependencies
```bash
npm install swagger-ui-express swagger-jsdoc
```

**Step 2**: Create API route `src/app/api/docs/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  const specPath = path.join(process.cwd(), 'docs', 'openapi-spec.json');
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  
  return NextResponse.json(spec);
}
```

**Step 3**: Create Swagger UI page `src/app/api-docs/page.tsx`
```typescript
'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">StormCom API Documentation</h1>
      <SwaggerUI url="/api/docs" />
    </div>
  );
}
```

**Step 4**: Access documentation
```
http://localhost:3000/api-docs
```

### Use Case 2: Validate API Responses

**Using AJV (Another JSON Validator)**
```typescript
import Ajv from 'ajv';
import spec from './docs/openapi-spec.json';

const ajv = new Ajv();

// Get schema for Product
const productSchema = spec.components.schemas.Product;
const validate = ajv.compile(productSchema);

// Validate API response
const response = await fetch('http://localhost:3000/api/products?storeId=...');
const data = await response.json();

const valid = validate(data.products[0]);
if (!valid) {
  console.error('Validation errors:', validate.errors);
}
```

### Use Case 3: Mock Server Generation

**Using Prism Mock Server**
```bash
# Install Prism
npm install -g @stoplight/prism-cli

# Start mock server
prism mock docs/openapi-spec.yaml

# Mock server running at http://127.0.0.1:4010
# Test mock endpoints
curl http://127.0.0.1:4010/products?storeId=test
```

### Use Case 4: API Contract Testing

**Using Pact + OpenAPI**
```bash
# Install Pact
npm install @pact-foundation/pact

# Run contract tests
npm run test:contract
```

---

## 📊 OpenAPI Specification Features

### Request/Response Examples
Every endpoint includes:
- ✅ Complete request examples
- ✅ Response schemas with types
- ✅ Error response examples
- ✅ Authentication requirements
- ✅ Query parameter documentation
- ✅ Request body schemas

### Data Validation
- Required fields marked
- Data types specified (string, number, boolean, array, object)
- Format constraints (email, date-time, uri, etc.)
- Min/max values for numbers
- Enum values for status fields
- Pattern validation for slugs

### Multi-Tenant Architecture
All protected endpoints require:
1. **Authorization Header**: `Bearer {jwt_token}`
2. **Store ID Parameter**: `?storeId={store_id}` (for store-scoped resources)

Example:
```http
GET /api/products?storeId=cmijjxiag000ifmloysnyfc3x&page=1&limit=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🛠️ Advanced Features

### 1. API Versioning
Current version: `1.0.0`

Future versions can be added:
```yaml
servers:
  - url: http://localhost:3000/api/v1
    description: Version 1
  - url: http://localhost:3000/api/v2
    description: Version 2 (Coming Soon)
```

### 2. Webhooks (Future Feature)
```yaml
webhooks:
  orderCreated:
    post:
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Order'
```

### 3. API Rate Limiting
Not yet documented in spec (coming soon):
- Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`
- Status code: `429 Too Many Requests`

### 4. Pagination
Standard pagination schema included:
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

---

## 📚 Related Documentation

| Document | Description | Location |
|----------|-------------|----------|
| **API Documentation** | Comprehensive API reference (1,100+ lines) | `docs/API_DOCUMENTATION_COMPLETE.md` |
| **Postman Setup Guide** | Step-by-step Postman testing guide | `docs/POSTMAN_SETUP_GUIDE.md` |
| **Quick Reference** | 2-minute quick start card | `docs/QUICK_REFERENCE.md` |
| **OpenAPI JSON** | Machine-readable API spec | `docs/openapi-spec.json` |
| **OpenAPI YAML** | Human-readable API spec | `docs/openapi-spec.yaml` |
| **Postman Collection** | Ready-to-import 17 requests | `docs/StormCom_API_Postman_Collection.json` |

---

## 🔗 Useful Links

### OpenAPI Tools
- **Swagger Editor**: https://editor.swagger.io
- **Swagger UI**: https://swagger.io/tools/swagger-ui/
- **Redoc**: https://redocly.com/redoc
- **OpenAPI Generator**: https://openapi-generator.tech
- **Postman**: https://www.postman.com
- **Prism Mock Server**: https://stoplight.io/open-source/prism

### Learning Resources
- **OpenAPI Specification**: https://spec.openapis.org/oas/v3.0.3
- **OpenAPI Guide**: https://swagger.io/docs/specification/about/
- **API Design Best Practices**: https://swagger.io/resources/articles/best-practices-in-api-design/

---

## 🎯 Next Steps

### Immediate Actions
1. ✅ Import `openapi-spec.json` into Swagger Editor
2. ✅ View interactive documentation
3. ✅ Test "Try it out" features with seeded data
4. ✅ Generate client SDK for your language

### Integration
1. Add Swagger UI route to Next.js app
2. Set up API contract testing
3. Generate client libraries for frontend
4. Create mock server for frontend development

### Maintenance
1. Update OpenAPI spec when adding new endpoints
2. Regenerate client SDKs after spec changes
3. Run contract tests in CI/CD pipeline
4. Keep version numbers in sync

---

## 💡 Pro Tips

### Tip 1: Auto-Generate from Code
Consider using tools like:
- `tsoa` - Generate OpenAPI from TypeScript decorators
- `swagger-jsdoc` - Generate from JSDoc comments
- `nest-swagger` - For NestJS applications

### Tip 2: Keep Spec in Sync
- Store OpenAPI spec in version control
- Update spec alongside API changes
- Use CI/CD to validate spec on every commit

### Tip 3: Use Spec for Testing
```typescript
// Example: Test all endpoints exist
import spec from './docs/openapi-spec.json';

describe('API Coverage', () => {
  Object.keys(spec.paths).forEach(path => {
    Object.keys(spec.paths[path]).forEach(method => {
      it(`should have ${method.toUpperCase()} ${path}`, () => {
        // Test implementation
      });
    });
  });
});
```

### Tip 4: Generate Changelogs
Use tools like `openapi-diff` to generate API changelogs:
```bash
npm install -g openapi-diff
openapi-diff docs/openapi-spec-v1.json docs/openapi-spec-v2.json
```

---

## 🎉 Summary

You now have:
- ✅ Complete OpenAPI 3.0 specification (JSON + YAML)
- ✅ 17 documented endpoints with examples
- ✅ 11 data model schemas
- ✅ Authentication & security documented
- ✅ Ready for Swagger UI, Postman, and code generation
- ✅ Machine-readable format for automation

**All API routes are now formally specified using OpenAPI 3.0 standard!**

---

**Last Updated**: November 29, 2025  
**Spec Version**: 1.0.0  
**Status**: ✅ Production Ready
