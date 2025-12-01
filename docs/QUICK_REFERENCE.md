# 🚀 StormCom API - Quick Reference Card

## Start Here (2 minutes)

```bash
# 1. Start dev server
npm run dev

# 2. Open browser
http://localhost:3000/dashboard

# 3. Import Postman collection
# File: docs/StormCom_API_Postman_Collection.json

# 4. Test API with seeded data
# Run: Authentication → Login - Test User
```

---

## 📍 Test Credentials

| Role | Email | Password | Store |
|------|-------|----------|-------|
| Admin | test@example.com | Test123!@# | Demo Store (PRO) |
| Seller | seller@example.com | Test123!@# | Acme Store (BASIC) |
| Customer | buyer@example.com | Test123!@# | Demo Store (PRO) |

---

## 🔑 Store IDs

| Store | ID | Plan |
|-------|----|----|
| Demo Store | `cmijjxiag000ifmloysnyfc3x` | PRO |
| Acme Store | `cmijjxiag000hfmloc0xtoiqg` | BASIC |

---

## 📊 Seeded Data Available

- **15 Products** (Electronics, Clothing, Accessories, Sports, Home & Garden)
- **15 Customers** (Ready for orders/reviews)
- **20 Orders** (Various statuses: PENDING, PAID, PROCESSING, SHIPPED, DELIVERED)
- **10 Reviews** (Approved and pending)
- **5 Categories** (Pre-configured)
- **4 Brands** (Apple, Nike, Samsung, Sony)

---

## 🧪 17 Ready-to-Use Requests

| # | Category | Request | Method |
|---|----------|---------|--------|
| 1 | Auth | Login - Test User | POST |
| 2 | Auth | Login - Seller User | POST |
| 3 | Auth | Login - Buyer User | POST |
| 4 | Auth | Signup - New User | POST |
| 5 | Orgs | List Organizations | GET |
| 6 | Orgs | Create Organization | POST |
| 7 | Stores | List Stores | GET |
| 8 | Products | List Products - Demo Store | GET |
| 9 | Products | Search Products - MacBook | GET |
| 10 | Categories | List Categories | GET |
| 11 | Brands | List Brands | GET |
| 12 | Customers | List Customers | GET |
| 13 | Customers | Search Customers | GET |
| 14 | Orders | List Orders | GET |
| 15 | Orders | Filter Orders by Status | GET |
| 16 | Reviews | List Reviews | GET |
| 17 | Reviews | List Approved Reviews | GET |

---

## 🔗 API Endpoints Summary

### Authentication
```
POST /api/auth/login          # Get JWT token
POST /api/auth/signup         # Create new account
```

### Organizations
```
GET    /api/organizations     # List all
POST   /api/organizations     # Create new
GET    /api/organizations/:id # Get details
PUT    /api/organizations/:id # Update
DELETE /api/organizations/:id # Delete
```

### Stores
```
GET    /api/stores            # List all
POST   /api/stores            # Create new
GET    /api/stores/:id        # Get details
PUT    /api/stores/:id        # Update
DELETE /api/stores/:id        # Delete
```

### Products
```
GET    /api/products          # List with filters
POST   /api/products          # Create new
GET    /api/products/:id      # Get details
PUT    /api/products/:id      # Update
DELETE /api/products/:id      # Delete
```

### Customers
```
GET    /api/customers         # List all
POST   /api/customers         # Create new
GET    /api/customers/:id     # Get details
PUT    /api/customers/:id     # Update
DELETE /api/customers/:id     # Delete
```

### Orders
```
GET    /api/orders            # List all
POST   /api/orders            # Create new
GET    /api/orders/:id        # Get details
PUT    /api/orders/:id        # Update
DELETE /api/orders/:id        # Delete
```

### Reviews
```
GET    /api/reviews           # List all
POST   /api/reviews           # Create new
GET    /api/reviews/:id       # Get details
PUT    /api/reviews/:id       # Update
DELETE /api/reviews/:id       # Delete
```

### Categories & Brands
```
GET    /api/categories        # List categories
GET    /api/brands            # List brands
```

---

## 🔐 Authentication Flow

```
1. POST /api/auth/login
   { "email": "test@example.com", "password": "Test123!@#" }

2. Response includes: { "token": "eyJhbGc..." }

3. Use token in all requests:
   Header: Authorization: Bearer eyJhbGc...

4. Token expires in 24 hours (configurable)
```

---

## 📥 Import Steps (30 seconds)

1. **Open Postman** → Click **Import**
2. **Upload Files** → Select `docs/StormCom_API_Postman_Collection.json`
3. **Select Workspace** → CodeStorm Hub Workspace
4. **Click Import** → Done!
5. **Get Token** → Run "Authentication → Login - Test User"
6. **Copy Token** → Paste into collection variable `token`
7. **Start Testing** → All requests ready to use

---

## 🧪 Quick Test Workflow

```
1. Run: Login - Test User
   ↓ Copy token from response
   ↓
2. Paste token into {{token}} variable
   ↓
3. Run: List Products - Demo Store
   ✅ See 15 seeded products
   ↓
4. Run: List Customers
   ✅ See 15 seeded customers
   ↓
5. Run: List Orders
   ✅ See 20 seeded orders
   ↓
6. Run: List Reviews
   ✅ See 10 seeded reviews
```

---

## ⚠️ Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| **401 Unauthorized** | Run login first, copy token, paste in {{token}} variable |
| **404 Store Not Found** | Use `{{storeId}}` (not hardcoded ID) |
| **CORS Error** | Ensure dev server running on localhost:3000 |
| **Postman import fails** | Check JSON valid: `node -e "JSON.parse(require('fs').readFileSync('docs/StormCom_API_Postman_Collection.json'))"` |
| **No seeded data** | Run: `npm run prisma:seed` |

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| [API_DOCUMENTATION_COMPLETE.md](./API_DOCUMENTATION_COMPLETE.md) | Full endpoint reference (1,100+ lines) |
| [POSTMAN_SETUP_GUIDE.md](./POSTMAN_SETUP_GUIDE.md) | Detailed setup instructions |
| [COMPLETION_STATUS.md](./COMPLETION_STATUS.md) | Project completion summary |
| [StormCom_API_Postman_Collection.json](./StormCom_API_Postman_Collection.json) | Ready-to-import Postman collection |

---

## 🎯 Key URLs

| Page | URL |
|------|-----|
| Dev Server | http://localhost:3000 |
| Dashboard | http://localhost:3000/dashboard |
| Products | http://localhost:3000/dashboard/products |
| Customers | http://localhost:3000/dashboard/customers |
| API Base | http://localhost:3000/api |

---

## 💾 Database Info

- **Type**: SQLite (development)
- **File**: `prisma/dev.db`
- **Models**: 9 (User, Organization, Store, Product, Category, Brand, Customer, Order, Review)
- **Records**: 75+ across all models
- **Status**: ✅ Seeded and ready

---

## 📝 Helpful Commands

```bash
# Development
npm run dev                  # Start dev server

# Database
npm run prisma:seed        # Seed database
npm run prisma:generate    # Generate Prisma Client
npm run prisma:studio      # Open Prisma Studio

# Code Quality
npm run type-check         # TypeScript check
npm run lint              # ESLint

# Build
npm run build             # Production build
npm run start             # Start production server
```

---

## 🎓 Learning Path

**Beginner** → Read POSTMAN_SETUP_GUIDE.md (20 min)
**Intermediate** → Explore 17 Postman requests (30 min)
**Advanced** → Read API_DOCUMENTATION_COMPLETE.md (1 hour)
**Expert** → Review src/app/api/ routes (2 hours)

---

## ✅ Validation

All systems operational:
- ✅ Dev server running
- ✅ Database seeded with test data
- ✅ 17 Postman requests ready
- ✅ Authentication working
- ✅ API responding with 200 status codes
- ✅ Seeded data visible in browser
- ✅ Documentation complete

---

**Last Updated**: January 22, 2025  
**Status**: 🟢 Ready to Use  
**Support**: See [POSTMAN_SETUP_GUIDE.md](./POSTMAN_SETUP_GUIDE.md) for troubleshooting

---

### 🚀 Let's Get Started!

1. Run: `npm run dev`
2. Import Postman collection
3. Run: "Login - Test User"
4. Explore 15 products, 15 customers, 20 orders
5. Everything works! 🎉
