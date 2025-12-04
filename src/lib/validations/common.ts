/**
 * Shared Validation Schemas
 * 
 * Common Zod validation schemas used across the application.
 * Reduces duplication and ensures consistency.
 */

import { z } from 'zod';

/**
 * Email validation
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address')
  .toLowerCase();

/**
 * Password validation
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

/**
 * Slug validation
 */
export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens');

/**
 * Name validation
 */
export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .trim();

/**
 * Price validation
 */
export const priceSchema = z
  .number()
  .min(0, 'Price must be positive')
  .max(999999.99, 'Price is too large');

/**
 * Phone number validation
 */
export const phoneSchema = z
  .string()
  .regex(
    /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
    'Invalid phone number format'
  )
  .optional();
