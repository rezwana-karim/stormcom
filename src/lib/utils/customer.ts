/**
 * Customer Utility Functions
 * 
 * Shared utilities for customer data handling.
 * 
 * @module lib/utils/customer
 */

interface CustomerLike {
  firstName?: string;
  lastName?: string;
}

/**
 * Get display name for a customer
 * Combines firstName and lastName, falls back to default if both are empty
 */
export function getCustomerDisplayName(
  customer: CustomerLike,
  defaultName = 'Unknown Customer'
): string {
  const fullName = [customer.firstName, customer.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
    
  return fullName || defaultName;
}
