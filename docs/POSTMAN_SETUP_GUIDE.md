# StormCom API Documentation & Testing Guide

## 📋 Overview

Complete API testing setup for StormCom multi-tenant SaaS e-commerce platform with:
- ✅ **Seeded Database**: 3 users, 2 organizations, 2 stores, 5 categories, 4 brands, 15 products, 15 customers, 20 orders, 10 reviews
- ✅ **Postman Collection**: 17 requests organized in 9 folders (Authentication, Organizations, Stores, Products, Categories, Brands, Customers, Orders, Reviews)
- ✅ **API Documentation**: Complete markdown reference with all endpoints and examples
- ✅ **Test Credentials**: Ready-to-use user accounts for testing

---

## 🚀 Quick Start

### 1. Start the Dev Server
```bash
npm run dev
```
Dev server will be available at `http://localhost:3000`

### 2. Import Postman Collection
1. Open **Postman**
2. Click **Import** (top-left)
3. Select **Upload Files**
4. Choose: `docs/StormCom_API_Postman_Collection.json`
5. Select workspace: **CodeStorm Hub Workspace**
6. Collection will be imported with all 17 requests

### 3. Set Up Variables
In Postman, collection variables are pre-configured:
- **baseUrl**: `http://localhost:3000/api`
- **storeId**: `cmijjxiag000ifmloysnyfc3x` (Demo Store - PRO plan)
- **secondaryStoreId**: `cmijjxiag000hfmloc0xtoiqg` (Acme Store - BASIC plan)
- **token**: Empty (populate by running login first)

---

## 🔐 Test Credentials

All passwords are: `Test123!@#`

### User 1: Test User (Admin)
- **Email**: `test@example.com`
- **Password**: `Test123!@#`
- **Role**: Admin
- **Access**: Demo Company (Demo Store)

### User 2: Seller User (Seller)
- **Email**: `seller@example.com`
- **Password**: `Test123!@#`
- **Role**: Seller
- **Access**: Acme Corp (Acme Store)

### User 3: Buyer User (Customer)
- **Email**: `buyer@example.com`
- **Password**: `Test123!@#`
- **Role**: Customer
- **Access**: Demo Company (Demo Store)

---

## 📚 Available Requests (17 Total)

### Authentication (4 requests)
1. **Login - Test User** - POST `/auth/login`
2. **Login - Seller User** - POST `/auth/login`
3. **Login - Buyer User** - POST `/auth/login`
4. **Signup - New User** - POST `/auth/signup`

### Organizations (2 requests)
5. **List Organizations** - GET `/organizations?page=1&limit=10`
6. **Create Organization** - POST `/organizations`

### Stores (1 request)
7. **List Stores** - GET `/stores?page=1&limit=10`

### Products (2 requests)
8. **List Products - Demo Store** - GET `/products?storeId={{storeId}}&page=1&limit=20`
9. **Search Products - MacBook** - GET `/products?storeId={{storeId}}&search=MacBook&status=ACTIVE`

### Categories (1 request)
10. **List Categories** - GET `/categories?storeId={{storeId}}`

### Brands (1 request)
11. **List Brands** - GET `/brands?storeId={{storeId}}`

### Customers (2 requests)
12. **List Customers** - GET `/customers?storeId={{storeId}}&page=1&limit=10`
13. **Search Customers** - GET `/customers?storeId={{storeId}}&search=customer`

### Orders (2 requests)
14. **List Orders** - GET `/orders?storeId={{storeId}}&page=1&limit=10`
15. **Filter Orders by Status - Delivered** - GET `/orders?storeId={{storeId}}&status=DELIVERED`

### Reviews (2 requests)
16. **List Reviews** - GET `/reviews?storeId={{storeId}}&page=1&limit=10`
17. **List Approved Reviews** - GET `/reviews?storeId={{storeId}}&approved=true`

---

## 🧪 Testing Workflow

### Step 1: Get Authentication Token
1. In Postman, navigate to **Authentication** folder
2. Run **Login - Test User** request
3. Copy the `token` value from response
4. In Postman collection variables, paste token into `token` variable
5. Now all subsequent requests will use this token automatically

### Step 2: Explore Products
1. Go to **Products** folder
2. Run **List Products - Demo Store** (returns 15 products from seeded data)
3. Run **Search Products - MacBook** (filters products by search term)
4. Try with different search terms to test filtering

### Step 3: Browse Customers & Orders
1. Go to **Customers** folder
2. Run **List Customers** (returns 15 seeded customers)
3. Go to **Orders** folder
4. Run **List Orders** (returns 20 seeded orders)
5. Run **Filter Orders by Status - Delivered** (shows completed orders)

### Step 4: View Reviews
1. Go to **Reviews** folder
2. Run **List Reviews** (returns all 10 seeded reviews)
3. Run **List Approved Reviews** (returns approved reviews only)

---

## 📊 Seeded Data Summary

| Entity | Count | Details |
|--------|-------|---------|
| **Users** | 3 | test@, seller@, buyer@ with roles and store access |
| **Organizations** | 2 | Demo Company, Acme Corp |
| **Stores** | 2 | Demo Store (PRO plan), Acme Store (BASIC plan) |
| **Categories** | 5 | Electronics, Clothing, Accessories, Home & Garden, Sports |
| **Brands** | 4 | Apple, Nike, Samsung, Sony |
| **Products** | 15 | Mixed categories with 40+ variants (colors, sizes) |
| **Customers** | 15 | Linked to orders and reviews |
| **Orders** | 20 | Various statuses (PENDING, PAID, PROCESSING, SHIPPED, DELIVERED) |
| **Reviews** | 10 | Mix of approved and pending reviews |

---

## 🔗 API Base URLs

- **Development**: `http://localhost:3000/api`
- **Production**: `https://api.stormcom.example.com` (configure in Postman variables)

---

## 🛡️ Authentication

All protected endpoints (except login/signup) require:
```
Authorization: Bearer <JWT_TOKEN>
```

The token is obtained by:
1. POSTing credentials to `/auth/login`
2. Copying the `token` from response
3. Adding it to request headers

**Token Validity**: Tokens are JWT-based with configurable expiration

---

## 📝 Common Use Cases

### Find all products from a specific brand
```
GET /api/products?storeId={{storeId}}&brandId=<brandId>&status=ACTIVE
```

### Get completed orders for a customer
```
GET /api/orders?storeId={{storeId}}&customerId=<customerId>&status=DELIVERED
```

### View pending reviews that need moderation
```
GET /api/reviews?storeId={{storeId}}&approved=false
```

### Search across categories
```
GET /api/categories?storeId={{storeId}}
```

---

## 🐛 Troubleshooting

### "Unauthorized" Response (401)
- **Issue**: Token is missing or invalid
- **Solution**: 
  1. Run a login request first
  2. Copy the returned token
  3. Paste into Postman collection variable `token`
  4. Retry the request

### "Store Not Found" Response (404)
- **Issue**: Using wrong storeId variable
- **Solution**:
  - Use `{{storeId}}` for Demo Store (Default)
  - Use `{{secondaryStoreId}}` for Acme Store
  - Both are pre-configured in collection variables

### "Forbidden" Response (403)
- **Issue**: User doesn't have permission for this store/operation
- **Solution**:
  - Verify user role matches operation (admins/sellers can modify)
  - Check store ownership/membership
  - Try with different test user (seller@ vs buyer@)

### CORS Errors
- **Issue**: Cross-origin request blocked
- **Solution**:
  - Ensure dev server is running on `http://localhost:3000`
  - Clear Postman cache (Settings > Cookies)
  - Restart dev server

---

## 📖 Full API Documentation

For complete endpoint documentation including:
- Request/response schemas
- Error codes and explanations
- Implementation details
- Multi-tenancy information

See: **[API_DOCUMENTATION_COMPLETE.md](./API_DOCUMENTATION_COMPLETE.md)**

---

## ✅ Validation Checklist

Before deploying to production:

- [ ] All 17 Postman requests pass with valid tokens
- [ ] Authentication flow works (login → token → access protected routes)
- [ ] All 15 seeded products retrieve successfully
- [ ] All 15 seeded customers are accessible
- [ ] All 20 seeded orders show correct status filtering
- [ ] Reviews properly filter by approval status
- [ ] Search functionality works for products and customers
- [ ] Pagination works correctly (limit/page parameters)
- [ ] Error responses return proper HTTP status codes
- [ ] Multi-tenancy isolation verified (data visible only for correct store)

---

## 📞 Support

For issues with:
- **API endpoints**: Check [API_DOCUMENTATION_COMPLETE.md](./API_DOCUMENTATION_COMPLETE.md)
- **Database seeding**: Verify `prisma/seed.mjs` executed successfully
- **Dev server**: Run `npm run dev` and check `http://localhost:3000/health`
- **Postman import**: Verify JSON syntax with `json -e "JSON.parse(fs.readFileSync('docs/StormCom_API_Postman_Collection.json'))"`

---

**Last Updated**: 2025-01-22  
**Collection Version**: 1.0.0  
**API Version**: 1.0.0  
**Status**: ✅ Production Ready
