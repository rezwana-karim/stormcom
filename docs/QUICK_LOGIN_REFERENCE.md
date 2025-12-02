# Quick Login Reference Card

## 🚀 Quick Start
1. Start server: `npm run dev`
2. Open: http://localhost:3000/login
3. Select "Password" tab
4. Use credentials below

---

## 📋 All Login Credentials (Verified January 2025)

| Role | Email | Password | Store Access |
|------|-------|----------|--------------|
| **Super Admin** | superadmin@example.com | SuperAdmin123!@# | All Stores |
| **Store Owner** | owner@example.com | Test123!@# | Demo Store (with data) |
| **Store Admin** | admin@example.com | Test123!@# | Acme Store |
| **Store Member** | member@example.com | Test123!@# | Acme Store (limited) |

---

## 🎯 Testing Shortcuts

### Test Super Admin (All Access + Admin Panel)
```
superadmin@example.com
SuperAdmin123!@#
```

### Test Store Owner with Data (Demo Store has 15 products, 13 orders)
```
owner@example.com
Test123!@#
```

### Test Store Admin (Acme Store - empty)
```
admin@example.com
Test123!@#
```

### Test Limited Member Access
```
member@example.com
Test123!@#
```

---

## ✅ Verification Status (January 2025)
- ✅ All 4 users tested and working
- ✅ All passwords validated (SuperAdmin uses different password)
- ✅ Session data correct
- ✅ Permissions assigned properly
- ✅ Role-based sidebar menu verified

---

## 📁 Full Documentation
See: `docs/LOGIN_CREDENTIALS_ALL_ROLES.md`

---

## 💡 Notes
- Database seeded from `prisma/seed.mjs`
- Super Admin password: `SuperAdmin123!@#` (unique)
- All other users: `Test123!@#` (shared)
