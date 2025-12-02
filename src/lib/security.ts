/**
 * Security Utilities
 * Common security functions for input validation, sanitization, and protection
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Security headers to prevent common vulnerabilities
 */
export const securityHeaders = {
  // Prevent clickjacking attacks
  'X-Frame-Options': 'DENY',
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  // Enable XSS filter in browsers
  'X-XSS-Protection': '1; mode=block',
  // Referrer policy for privacy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Permissions policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline/eval for dev
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
};

/**
 * Add security headers to API response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Validate and sanitize input string
 * Removes potentially dangerous characters
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Remove angle brackets to prevent HTML injection
}

/**
 * Validate email format
 * More strict than basic regex to prevent injection
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate CUID format (Prisma IDs)
 * Prevents injection of invalid IDs
 */
export function isValidCuid(id: string): boolean {
  // CUID format: c[a-z0-9]{24}
  const cuidRegex = /^c[a-z0-9]{24}$/;
  return cuidRegex.test(id);
}

/**
 * Validate UUID format
 */
export function isValidUuid(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Rate limiting token generator
 * Creates a safe identifier for rate limiting
 */
export function generateRateLimitToken(request: NextRequest, userId?: string): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return userId ? `user:${userId}` : `ip:${ip}`;
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page: number, limit: number): { 
  isValid: boolean; 
  error?: string;
  safePage: number;
  safeLimit: number;
} {
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit))); // Max 100 items per page

  if (page < 1) {
    return { isValid: false, error: 'Page must be greater than 0', safePage, safeLimit };
  }

  if (limit < 1 || limit > 100) {
    return { isValid: false, error: 'Limit must be between 1 and 100', safePage, safeLimit };
  }

  return { isValid: true, safePage, safeLimit };
}

/**
 * Validate slug format
 * Only lowercase letters, numbers, and hyphens
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50;
}

/**
 * Check if user owns resource
 * Prevents unauthorized access to user-specific data
 */
export function verifyOwnership(resourceUserId: string, currentUserId: string): boolean {
  return resourceUserId === currentUserId;
}

/**
 * Constant-time string comparison
 * Prevents timing attacks when comparing sensitive data
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    token += chars[randomValues[i] % chars.length];
  }
  
  return token;
}

/**
 * Validate file upload
 */
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateFileUpload(
  file: File,
  options: {
    maxSizeBytes?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): FileValidationResult {
  const {
    maxSizeBytes = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  } = options;

  // Check file size
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File size exceeds ${Math.round(maxSizeBytes / 1024 / 1024)}MB limit`,
    };
  }

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} not allowed. Allowed: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file extension
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!extension || !allowedExtensions.includes(extension)) {
    return {
      isValid: false,
      error: `File extension ${extension} not allowed. Allowed: ${allowedExtensions.join(', ')}`,
    };
  }

  return { isValid: true };
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace unsafe characters
    .replace(/\.{2,}/g, '.') // No double dots (path traversal)
    .slice(0, 255); // Max filename length
}

/**
 * Check for SQL injection patterns (defense in depth - Prisma already prevents this)
 */
export function hasSqlInjectionPattern(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi,
    /(--|#|\/\*|\*\/)/g, // SQL comments
    /('|"|`|;)/g, // SQL delimiters (might be too strict for regular use)
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Redact sensitive data for logging
 */
export function redactSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['password', 'passwordHash', 'secret', 'apiKey', 'token', 'accessToken', 'refreshToken'];
  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      redacted[key] = redactSensitiveData(value as Record<string, unknown>);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}
