/**
 * Form Utilities - Reusable Form Helpers
 * 
 * Common utilities for form handling across the application.
 * Reduces duplication and standardizes form behavior.
 */

/**
 * Generate URL-friendly slug from a string
 * Used for categories, brands, products, etc.
 * 
 * @param text - The text to convert to a slug
 * @returns URL-friendly slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Handle API errors consistently
 * Extracts error message from response or uses fallback
 * 
 * @param response - Fetch response object
 * @param fallbackMessage - Default error message if parsing fails
 * @returns Error message string
 */
export async function getErrorMessage(
  response: Response,
  fallbackMessage: string = 'An error occurred'
): Promise<string> {
  try {
    const data = await response.json();
    return data.error || data.message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

/**
 * Common form state interface
 * Standardizes form loading and error states
 */
export interface FormState<T = Record<string, unknown>> {
  data: T;
  loading: boolean;
  error: string | null;
}

/**
 * Create initial form state
 */
export function createFormState<T>(initialData: T): FormState<T> {
  return {
    data: initialData,
    loading: false,
    error: null,
  };
}

/**
 * Handle form field change
 * Type-safe helper for updating nested form state
 */
export function updateFormField<T>(
  prevState: FormState<T>,
  field: keyof T,
  value: T[keyof T]
): FormState<T> {
  return {
    ...prevState,
    data: {
      ...prevState.data,
      [field]: value,
    },
  };
}

/**
 * Submit form to API endpoint
 * Standardizes API calls with error handling
 * 
 * @param url - API endpoint URL
 * @param method - HTTP method (POST, PATCH, PUT, DELETE)
 * @param data - Form data to submit
 * @returns Response data or throws error
 */
export async function submitForm<T = unknown, R = unknown>(
  url: string,
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  data?: T
): Promise<R> {
  const response = await fetch(url, {
    method,
    headers: data ? { 'Content-Type': 'application/json' } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response);
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Validate required fields
 * Returns array of missing field names
 * 
 * @param data - Object to validate
 * @param requiredFields - Array of required field names
 * @returns Array of missing field names
 */
export function validateRequired<T extends Record<string, unknown>>(
  data: T,
  requiredFields: (keyof T)[]
): string[] {
  return requiredFields.filter(field => {
    const value = data[field];
    return value === null || value === undefined || value === '';
  }) as string[];
}

/**
 * Format validation errors for display
 * 
 * @param missingFields - Array of missing field names
 * @returns Formatted error message
 */
export function formatValidationErrors(missingFields: string[]): string {
  if (missingFields.length === 0) return '';
  
  const fields = missingFields
    .map(field => field.charAt(0).toUpperCase() + field.slice(1))
    .join(', ');
  
  return `Required fields missing: ${fields}`;
}
