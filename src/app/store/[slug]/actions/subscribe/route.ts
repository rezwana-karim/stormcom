/**
 * Newsletter Subscription API Route
 * 
 * Handles newsletter subscription requests
 * Future integration point for email service (Resend)
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

/**
 * POST /store/[slug]/actions/subscribe
 * Subscribe to newsletter
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Get store from headers or slug
    const headersList = await headers();
    const storeId = headersList.get("x-store-id");

    const store = await prisma.store.findFirst({
      where: storeId 
        ? { id: storeId, deletedAt: null }
        : { slug, deletedAt: null },
      select: { id: true, name: true },
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    // TODO: Future implementation
    // 1. Check if email already subscribed
    // 2. Store subscription in database (create NewsletterSubscription model)
    // 3. Send confirmation email via Resend
    // 4. Handle double opt-in confirmation
    
    // For now, just log and return success
    console.log(`Newsletter subscription for ${store.name}: ${email}`);

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json(
      { 
        success: true,
        message: 'Successfully subscribed to newsletter' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to process subscription' },
      { status: 500 }
    );
  }
}
