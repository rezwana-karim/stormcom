// src/lib/cart-session.ts
// Helper to manage cart session for guest users

import { cookies } from 'next/headers';

const CART_SESSION_COOKIE = 'cart_session_id';
const CART_SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

/**
 * Get or create cart session ID for guest users
 */
export async function getCartSessionId(): Promise<string> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value;

  if (!sessionId) {
    // Generate a simple random session ID
    sessionId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    cookieStore.set(CART_SESSION_COOKIE, sessionId, {
      maxAge: CART_SESSION_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  return sessionId;
}

/**
 * Clear cart session (e.g., after login or checkout)
 */
export async function clearCartSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CART_SESSION_COOKIE);
}
