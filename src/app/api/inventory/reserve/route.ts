// src/app/api/inventory/reserve/route.ts
// Inventory Reservation API Endpoint
// POST /api/inventory/reserve - Create batch reservations

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { InventoryReservationService, DEFAULT_RESERVATION_TTL_MINUTES } from '@/lib/services/inventory-reservation.service';
import { z } from 'zod';

const reserveSchema = z.object({
  storeId: z.string().cuid(),
  items: z.array(
    z.object({
      productId: z.string().cuid(),
      variantId: z.string().cuid().optional(),
      quantity: z.number().int().positive(),
    })
  ).min(1).max(50), // Max 50 items per batch
  cartId: z.string().optional(),
  ttlMinutes: z.number().int().positive().max(60).default(DEFAULT_RESERVATION_TTL_MINUTES),
});

// POST /api/inventory/reserve - Create batch reservations
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = reserveSchema.parse(body);

    const { storeId, items, cartId, ttlMinutes } = validatedData;

    // Verify store membership to prevent cross-tenant access
    const { prisma } = await import('@/lib/prisma');
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        organization: {
          store: {
            id: storeId
          }
        }
      }
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this store' },
        { status: 403 }
      );
    }

    // Create reservations
    const reservationService = InventoryReservationService.getInstance();
    const result = await reservationService.createReservations({
      storeId,
      items,
      cartId,
      ttlMinutes,
    });

    if (!result.success && result.reservations.length === 0) {
      // All reservations failed
      return NextResponse.json(
        {
          error: 'Reservation failed',
          errors: result.errors,
        },
        { status: 409 } // Conflict - insufficient stock
      );
    }

    return NextResponse.json({
      success: result.success,
      reservations: result.reservations,
      errors: result.errors.length > 0 ? result.errors : undefined,
      message: result.success
        ? 'Reservations created successfully'
        : 'Some reservations failed',
    });
  } catch (error) {
    console.error('POST /api/inventory/reserve error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to create reservations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
