/**
 * Customer Utility Functions
 * 
 * Shared utilities for customer data handling.
 * 
 * @module lib/utils/customer
 */

interface CustomerLike {
  name?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Get display name for a customer
 * Falls back through name -> firstName+lastName -> default
 */
export function getCustomerDisplayName(
  customer: CustomerLike,
  defaultName = 'Unknown Customer'
): string {
  if (customer.name) return customer.name;
  
  const fullName = [customer.firstName, customer.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
    
  return fullName || defaultName;
}
