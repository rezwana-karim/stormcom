# Security Quick Reference Guide

## For Developers: Secure Coding Checklist

---

## ✅ Before Writing Code

### 1. **Always Validate Inputs**
```typescript
import { z } from 'zod';
import { isValidCuid, isValidEmail } from '@/lib/security';

// Use Zod schemas
const schema = z.object({
  id: z.string().cuid('Invalid ID format'),
  email: z.string().email().max(254),
  age: z.number().min(0).max(150),
});

// Or manual validation
if (!isValidCuid(userId)) {
  return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
}
```

### 2. **Check Permissions FIRST**
```typescript
// ✅ CORRECT ORDER
export async function POST(request: NextRequest) {
  // 1. Check permission
  const hasPermission = await checkPermission('products:create');
  if (!hasPermission) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  
  // 2. Then authenticate
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  // 3. Then process request
  // ...
}

// ❌ WRONG ORDER
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions); // Don't do this first!
  const hasPermission = await checkPermission('products:create');
}
```

### 3. **Always Verify Resource Ownership**
```typescript
// ✅ ALWAYS filter by organization/store
const products = await prisma.product.findMany({
  where: {
    storeId: storeId,           // REQUIRED - multi-tenant isolation
    organizationId: orgId,      // REQUIRED - prevent cross-tenant access
    deletedAt: null,
  },
});

// ❌ NEVER query without tenant context
const products = await prisma.product.findMany(); // DANGEROUS!
```

---

## 🛡️ Common Security Patterns

### Sanitize User Input (XSS Prevention)
```typescript
import DOMPurify from 'isomorphic-dompurify';
import { sanitizeString } from '@/lib/security';

// Client-side HTML rendering
const cleanHtml = DOMPurify.sanitize(userHtml);
<div dangerouslySetInnerHTML={{ __html: cleanHtml }} />

// Simple string sanitization
const cleanName = sanitizeString(userInput, 100); // max 100 chars
```

### Validate File Uploads
```typescript
import { validateFileUpload, sanitizeFilename } from '@/lib/security';

const result = validateFileUpload(file, {
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png'],
  allowedExtensions: ['.jpg', '.png'],
});

if (!result.isValid) {
  return NextResponse.json({ error: result.error }, { status: 400 });
}

const safeFilename = sanitizeFilename(file.name);
```

### Add Security Headers
```typescript
import { addSecurityHeaders } from '@/lib/security';

export async function GET(request: NextRequest) {
  const data = { /* ... */ };
  const response = NextResponse.json(data);
  return addSecurityHeaders(response); // Add CSP, XSS protection, etc.
}
```

---

## ⚠️ Security Anti-Patterns (DON'T DO THIS)

### ❌ Trusting Client Data
```typescript
// ❌ BAD: Trust client-provided storeId without verification
const { storeId } = await request.json();
const store = await prisma.store.findUnique({ where: { id: storeId } });

// ✅ GOOD: Verify user has access
const { storeId } = await request.json();
const hasAccess = await verifyStoreAccess(storeId);
if (!hasAccess) throw new Error('Access denied');
const store = await prisma.store.findUnique({ where: { id: storeId } });
```

### ❌ Rendering Unescaped HTML
```typescript
// ❌ BAD: XSS vulnerability
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ GOOD: Sanitize first
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

### ❌ Weak Password Hashing
```typescript
// ❌ BAD: Weak hash
const hash = await bcrypt.hash(password, 10);

// ✅ GOOD: Strong hash (12+ rounds)
const hash = await bcrypt.hash(password, 12);
```

### ❌ Exposing Internal IDs
```typescript
// ❌ BAD: Sequential IDs leak info
CREATE TABLE products (id SERIAL PRIMARY KEY);

// ✅ GOOD: Use CUID/UUID
id String @id @default(cuid())
```

### ❌ Missing Rate Limiting
```typescript
// ❌ BAD: No rate limiting on sensitive endpoint
export async function POST(request: NextRequest) {
  await sendPasswordResetEmail();
}

// ✅ GOOD: Rate limit
import { checkRateLimit } from '@/lib/rate-limit';
export async function POST(request: NextRequest) {
  const limited = await checkRateLimit(identifier, 5, 60000); // 5 req/min
  if (limited) return limited;
  await sendPasswordResetEmail();
}
```

---

## 🔐 Quick Security Checks

### Before Committing Code
- [ ] All user inputs validated with Zod schemas?
- [ ] Permission checks before authentication?
- [ ] Database queries filter by organizationId/storeId?
- [ ] No hardcoded secrets or API keys?
- [ ] Sensitive data redacted from logs?
- [ ] File uploads validated?
- [ ] HTML sanitized before rendering?
- [ ] Security headers added to responses?

### Code Review Checklist
- [ ] No SQL injection risk (Prisma handles this)?
- [ ] No XSS vulnerability?
- [ ] No IDOR vulnerability?
- [ ] No privilege escalation?
- [ ] No timing attacks?
- [ ] No path traversal?
- [ ] No mass assignment?
- [ ] No race conditions?

---

## 📚 Security Utilities Reference

### Input Validation
```typescript
import {
  isValidCuid,
  isValidEmail,
  isValidSlug,
  isValidUuid,
  validatePagination,
  sanitizeString,
  sanitizeFilename,
} from '@/lib/security';
```

### Permission Checking
```typescript
import {
  checkPermission,
  requirePermission,
  checkAnyPermission,
  hasRole,
  isSuperAdmin,
} from '@/lib/auth-helpers';
```

### Data Protection
```typescript
import {
  constantTimeCompare,
  generateSecureToken,
  redactSensitiveData,
} from '@/lib/security';
```

---

## 🚨 Emergency Response

### If You Find a Security Issue

1. **Don't Commit**: Don't push vulnerable code
2. **Report Immediately**: Contact security team
3. **Document**: Note the issue details
4. **Fix Urgently**: Critical issues = immediate fix
5. **Test**: Verify fix works
6. **Deploy**: Hot-fix if in production

### Security Contact
- **Email**: security@example.com
- **Slack**: #security-alerts
- **On-Call**: [phone number]

---

## 📖 Further Reading

### OWASP Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)

### Next.js Security
- [Next.js Security Headers](https://nextjs.org/docs/app/api-reference/next-config-js/headers)
- [Next.js Authentication](https://nextjs.org/docs/pages/building-your-application/authentication)

### Prisma Security
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/query-optimization-performance)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/connection-management)

---

## 💡 Pro Tips

1. **Defense in Depth**: Multiple security layers are better than one
2. **Fail Secure**: Default to denying access
3. **Principle of Least Privilege**: Grant minimum necessary permissions
4. **Zero Trust**: Verify everything, trust nothing
5. **Security by Design**: Think security from the start, not as an afterthought

---

*Keep this guide handy while developing. Security is everyone's responsibility!*
