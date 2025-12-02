# Super Admin Store Creation - Testing Checklist

## Pre-Test Verification ✅

- [x] TypeScript compilation: **0 errors**
- [x] Lint check: **No new errors**
- [x] Super admin exists: `superadmin@example.com`
- [x] Test slug available: `test-store-superadmin`
- [x] Code changes deployed:
  - [x] `src/app/api/stores/route.ts`
  - [x] `src/lib/services/store.service.ts`

## Manual Testing Steps

### 1. Start Development Server
```bash
npm run dev
```
- [ ] Dev server starts without errors
- [ ] Server running at http://localhost:3000
- [ ] No console errors visible

### 2. Login as Super Admin
Navigate to: http://localhost:3000/login

Credentials:
```
Email: superadmin@example.com
Password: SuperAdmin123!@#
```

- [ ] Login page loads correctly
- [ ] Can enter credentials
- [ ] Login succeeds
- [ ] Redirected to /dashboard

### 3. Navigate to Stores Management
Go to: http://localhost:3000/dashboard/stores

- [ ] Stores page loads
- [ ] "Create Store" button visible
- [ ] Existing stores listed (if any)

### 4. Open Create Store Dialog
Click "Create Store" button

- [ ] Dialog opens
- [ ] Form fields visible:
  - [ ] Store Name
  - [ ] Slug (auto-generated)
  - [ ] Email
  - [ ] Phone (optional)
  - [ ] Custom Domain (optional)
  - [ ] Description (optional)
  - [ ] Address (optional)
  - [ ] Subscription Plan dropdown
  - [ ] Subscription Status dropdown
  - [ ] Active Store toggle
  - [ ] Currency (default USD)
  - [ ] Tax Rate (default 0)

### 5. Fill Store Form

**Required Fields:**
```
Store Name: Test Super Admin Store
Slug: test-store-superadmin (auto-generated from name)
Email: teststore@example.com
Subscription Plan: FREE
Subscription Status: TRIALING
Active Store: ✓ (checked)
```

**Optional Fields (can leave empty):**
```
Phone: (empty)
Custom Domain: (empty)
Description: Test store created by super admin
Address: (empty)
```

- [ ] Name auto-generates slug
- [ ] All fields accept input
- [ ] No validation errors

### 6. Submit Form
Click "Create Store" button

**Expected Behavior:**
- [ ] Loading spinner appears
- [ ] No browser console errors
- [ ] Success toast notification: "{Store Name} has been created successfully"
- [ ] Dialog closes automatically
- [ ] Store list refreshes
- [ ] New store appears in list

**New Store Details Should Show:**
- [ ] Name: Test Super Admin Store
- [ ] Email: teststore@example.com
- [ ] Domain: (empty or default)
- [ ] Subscription Plan: FREE
- [ ] Subscription Status: TRIALING (badge)
- [ ] Status: Active (green badge)
- [ ] Actions dropdown available

### 7. Verify Store Creation in Database

**Option 1: Using Prisma Studio**
```bash
npx prisma studio
```

Open Browser at http://localhost:5555

**Check Store Table:**
- [ ] New store exists with slug `test-store-superadmin`
- [ ] Name matches: "Test Super Admin Store"
- [ ] Email matches: `teststore@example.com`
- [ ] `subscriptionPlan` = FREE
- [ ] `subscriptionStatus` = TRIALING
- [ ] `isActive` = true
- [ ] `organizationId` is set
- [ ] `createdAt` is recent
- [ ] `trialEndsAt` is 14 days from now

**Check Organization Table:**
- [ ] New organization exists
- [ ] Name: "Test Super Admin Store Organization"
- [ ] Slug: `test-store-superadmin-org`
- [ ] Has relationship to store

**Check Membership Table:**
- [ ] New membership exists
- [ ] `userId` matches super admin ID
- [ ] `organizationId` matches new organization
- [ ] `role` = OWNER
- [ ] `createdAt` is recent

**Option 2: Using Test Script**
```bash
node scripts/test-superadmin-store.js
```
- [ ] Shows increased store count
- [ ] Shows increased organization count

### 8. Verify Store Access
Click on newly created store in list

- [ ] Store details page loads (if implemented)
- [ ] OR edit dialog opens
- [ ] Super admin can modify store settings
- [ ] Can deactivate/activate store
- [ ] Can update subscription plan

### 9. Test Edge Cases

**Test 1: Create Another Store**
- [ ] Create second store with different name/slug
- [ ] Both stores visible in list
- [ ] Each has own organization
- [ ] Super admin is OWNER of both

**Test 2: Duplicate Slug Handling**
- [ ] Try creating store with existing slug
- [ ] Should show error: "Store with slug 'X' already exists"
- [ ] Form does not submit

**Test 3: Invalid Data**
Try submitting with:
- [ ] Empty name → Validation error
- [ ] Empty email → Validation error
- [ ] Invalid email format → Validation error
- [ ] Invalid slug (spaces/capitals) → Validation error

**Test 4: Organization Slug Uniqueness**
If somehow `test-store-superadmin-org` already exists:
- [ ] System appends timestamp
- [ ] Creates with slug: `test-store-superadmin-org-{timestamp}`
- [ ] No duplicate slug errors

### 10. Test Regular User (Should Still Work)

**Logout and login as regular user:**
```
Email: test@example.com
Password: Test123!@#
```

Navigate to stores:
- [ ] If user has organization → Can create store
- [ ] If user has no organization → See error message
- [ ] Regular user's store uses their existing organization
- [ ] Regular user does NOT get new organization created

### 11. Network Tab Verification

Open Browser DevTools → Network Tab

**During Store Creation:**
- [ ] POST request to `/api/stores`
- [ ] Status: 201 Created
- [ ] Response includes store data
- [ ] Response includes success message

**Request Payload Should Include:**
```json
{
  "name": "Test Super Admin Store",
  "slug": "test-store-superadmin",
  "email": "teststore@example.com",
  "subscriptionPlan": "FREE",
  "subscriptionStatus": "TRIALING",
  "isActive": true,
  "settings": {
    "currency": "USD",
    "taxRate": 0
  }
}
```

**Response Should Include:**
```json
{
  "data": {
    "id": "...",
    "name": "Test Super Admin Store",
    "slug": "test-store-superadmin",
    "email": "teststore@example.com",
    "createdAt": "..."
  },
  "message": "Store created successfully"
}
```

### 12. Console Logs Verification

**No Errors Should Appear For:**
- [ ] Database connection
- [ ] Prisma queries
- [ ] Session handling
- [ ] Organization creation
- [ ] Store creation

**Acceptable Warnings:**
- [ ] Prisma deprecation warnings (config file)
- [ ] React dev mode warnings

## Post-Test Cleanup

### Optional: Delete Test Store
1. [ ] Click Actions → Delete on test store
2. [ ] Confirm deletion
3. [ ] Store removed from list

### Optional: Database Cleanup
```bash
npx prisma studio
```
- [ ] Delete test store record
- [ ] Delete test organization record
- [ ] Delete test membership record

## Test Results

### ✅ Success Criteria
All checkboxes above should be checked. Specifically:

1. ✅ Super admin can open store creation form
2. ✅ Can fill and submit form without errors
3. ✅ Store is created in database
4. ✅ Organization is auto-created
5. ✅ Super admin gets OWNER membership
6. ✅ Store appears in list immediately
7. ✅ Store is functional and accessible
8. ✅ Regular users still work as before

### ❌ Failure Indicators
If any of these occur, the fix has issues:

- ❌ "Organization required" error for super admin
- ❌ Cannot open create store form
- ❌ Form validation blocks submission incorrectly
- ❌ 500 Server Error during creation
- ❌ Organization not created
- ❌ Super admin not added as OWNER
- ❌ Store not visible in list
- ❌ Database records inconsistent

## Troubleshooting

### Issue: "Organization required" Error
**Solution:** Check session includes `isSuperAdmin: true`
```javascript
// Browser console
fetch('/api/auth/session').then(r => r.json()).then(console.log)
```

### Issue: Database Errors
**Solution:** Run migrations
```bash
npm run prisma:migrate:dev
npm run seed
```

### Issue: Store Not Appearing
**Solution:** Refresh stores list
- Click away from stores page
- Navigate back to `/dashboard/stores`
- Or refresh browser

### Issue: Permission Denied
**Solution:** Verify super admin flag in database
```bash
npx prisma studio
# User table → Find superadmin@example.com
# Verify isSuperAdmin = true
```

## Documentation Links

- [Full Documentation](./SUPERADMIN_STORE_CREATION.md)
- [Fix Summary](./FIX_SUPERADMIN_STORE_CREATION_SUMMARY.md)
- [Test Script](../scripts/test-superadmin-store.js)

## Sign-off

- [ ] All tests passed
- [ ] No regressions found
- [ ] Regular users unaffected
- [ ] Super admins can create stores
- [ ] Documentation complete
- [ ] Ready for production

**Tested By:** _________________  
**Date:** _________________  
**Result:** PASS / FAIL  
**Notes:** _________________________________
