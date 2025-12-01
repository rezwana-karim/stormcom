// src/app/api/inventory/extend/route.ts
// Inventory Reservation Extension API Endpoint
// POST /api/inventory/extend - Extend reservation (once per reservation)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { InventoryReservationService, MAX_EXTENSION_MINUTES } from '@/lib/services/inventory-reservation.service';
import { z } from 'zod';

const extendSchema = z.object({
  storeId: z.string().cuid(),
  reservationId: z.string().cuid(),
  extensionMinutes: z.number().int().positive().max(MAX_EXTENSION_MINUTES).default(MAX_EXTENSION_MINUTES),
});

// POST /api/inventory/extend - Extend a reservation
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
    const validatedData = extendSchema.parse(body);

    const { storeId, reservationId, extensionMinutes } = validatedData;

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

    try {
      const result = await reservationService.extendReservation(
        reservationId,
        storeId,
        extensionMinutes
      );

      if (!result) {
        return NextResponse.json(
          { error: 'Reservation not found or already expired' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Reservation extended successfully',
        reservation: result,
      });
    } catch (extendError) {
      // Handle "already extended" error
      if (extendError instanceof Error && extendError.message.includes('only be extended once')) {
        return NextResponse.json(
          {
            error: 'Extension failed',
            details: extendError.message,
          },
          { status: 409 } // Conflict
        );
      }
      throw extendError;
    }
  } catch (error) {
    console.error('POST /api/inventory/extend error:', error);

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
        error: 'Failed to extend reservation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
