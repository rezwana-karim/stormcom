# Login Troubleshooting Guide

## Test Results

### ✅ Database Status
- **Users Found:** 10 users with valid passwords
- **Test Accounts:**
  - `test@example.com` / `Test123!@#` (Regular user)
  - `superadmin@example.com` / `SuperAdmin123!@#` (Super Admin)
  - `storeadmin@example.com` / `StoreAdmin123!@#` (Store Admin)

### ✅ Configuration Files
- `.env.local` exists with all required variables
- `DATABASE_URL` points to correct SQLite file
- `NEXTAUTH_SECRET` is set
- `NEXTAUTH_URL` is correct

### ✅ Auth Setup
- NextAuth configured with CredentialsProvider
- Password hashing working correctly (bcrypt)
- Session strategy: JWT
- Prisma adapter configured

## How to Test Login

### Step 1: Start Dev Server
```bash
npm run dev
```

Wait for: `✓ Ready in X.Xs`

### Step 2: Open Browser
Navigate to: http://localhost:3000/login

### Step 3: Try Password Login
1. Select "Password" tab
2. Enter:
   - Email: `test@example.com`
   - Password: `Test123!@#`
3. Click "Sign In"

### Step 4: Check Dashboard
After successful login, you should be redirected to `/dashboard`

## Potential Issues & Solutions

### Issue 1: "Invalid email or password"
**Cause:** Database connection issue or wrong credentials

**Solution:**
```bash
# Verify database
npm run prisma:generate
node scripts/test-login.js

# Re-seed if needed
npm run seed
```

### Issue 2: Page won't load
**Cause:** Dev server not running or port conflict

**Solution:**
```bash
# Kill all node processes
Get-Process -Name node | Stop-Process -Force

# Restart dev server
npm run dev
```

### Issue 3: "CSRF token mismatch"
**Cause:** NextAuth configuration issue

**Solution:**
Check `.env.local` has:
```
NEXTAUTH_SECRET="development-secret-at-least-32-chars"
NEXTAUTH_URL="http://localhost:3000"
```

### Issue 4: Redirects to error page
**Cause:** Missing session callback or permissions

**Solution:**
Check `src/lib/auth.ts` callbacks section is complete

## Manual Testing Checklist

- [ ] Dev server starts without errors
- [ ] Can access http://localhost:3000
- [ ] Can access http://localhost:3000/login
- [ ] Login form loads with Password and Email Link tabs
- [ ] Can type in email and password fields
- [ ] "Sign In" button is clickable
- [ ] After login, redirects to /dashboard
- [ ] User info appears in header/sidebar

## API Endpoint Tests

Test these URLs in browser or Postman:

1. **CSRF Token:**
   ```
   GET http://localhost:3000/api/auth/csrf
   ```
   Should return: `{"csrfToken":"..."}`

2. **Providers:**
   ```
   GET http://localhost:3000/api/auth/providers
   ```
   Should return provider list including "credentials"

3. **Session:**
   ```
   GET http://localhost:3000/api/auth/session
   ```
   Should return null if not logged in

## Debug Mode

To see detailed logs, add to `.env.local`:
```
NEXTAUTH_DEBUG=true
```

Then restart dev server and watch console for detailed auth flow logs.

## All Test Accounts

| Email | Password | Role |
|-------|----------|------|
| test@example.com | Test123!@# | Regular User |
| superadmin@example.com | SuperAdmin123!@# | Super Admin |
| storeadmin@example.com | StoreAdmin123!@# | Store Admin |
| sales@example.com | SalesManager123!@# | Sales Manager |
| inventory@example.com | InventoryManager123!@# | Inventory Manager |
| support@example.com | CustomerService123!@# | Customer Service |
| content@example.com | ContentManager123!@# | Content Manager |
| marketing@example.com | MarketingManager123!@# | Marketing Manager |
| customer1@example.com | Customer123!@# | Customer |
| customer2@example.com | Customer123!@# | Customer |

## Quick Fix Commands

```bash
# Full reset
npm run prisma:migrate:dev
npm run seed
npm run dev

# Or just restart
npm run dev
```

## Expected Behavior

1. **Login Page:** Shows two tabs (Password / Email Link)
2. **After Login:** Redirects to `/dashboard`
3. **Dashboard:** Shows user name in header
4. **Protected Routes:** All `/dashboard/*` routes accessible
5. **Logout:** Available in user menu

## If Still Not Working

1. Check browser console for JavaScript errors
2. Check terminal for Next.js errors
3. Verify `.env.local` is in root directory
4. Ensure `prisma/dev.db` file exists
5. Try incognito/private window (clear cookies)
6. Clear Next.js cache: `rm -rf .next`

## Contact

If login still doesn't work after all troubleshooting steps, provide:
- Browser console errors
- Terminal error messages
- Which test account you're using
- Screenshot of login page
