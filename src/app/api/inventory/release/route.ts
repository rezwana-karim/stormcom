// src/app/api/inventory/release/route.ts
// Inventory Release API Endpoint
// POST /api/inventory/release - Release reservations manually

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { InventoryReservationService } from '@/lib/services/inventory-reservation.service';
import { z } from 'zod';

const releaseSchema = z.object({
  storeId: z.string().cuid(),
  // Either reservationId or cartId must be provided
  reservationId: z.string().cuid().optional(),
  cartId: z.string().optional(),
}).refine(
  (data) => data.reservationId || data.cartId,
  { message: 'Either reservationId or cartId must be provided' }
);

// POST /api/inventory/release - Release reservations
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
    const validatedData = releaseSchema.parse(body);

    const { storeId, reservationId, cartId } = validatedData;

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

    const reservationService = InventoryReservationService.getInstance();

    if (reservationId) {
      // Release single reservation
      const released = await reservationService.releaseReservation(reservationId, storeId);

      if (!released) {
        return NextResponse.json(
          { error: 'Reservation not found or already released' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Reservation released successfully',
        reservationId,
      });
    } else if (cartId) {
      // Release all reservations for cart
      const count = await reservationService.releaseCartReservations(cartId, storeId);

      return NextResponse.json({
        success: true,
        message: count > 0
          ? `${count} reservation(s) released successfully`
          : 'No active reservations found for this cart',
        releasedCount: count,
        cartId,
      });
    }

    // This should never happen due to zod validation
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('POST /api/inventory/release error:', error);

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
        error: 'Failed to release reservations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
