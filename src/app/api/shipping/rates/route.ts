/**
 * Shipping Rates API
 * 
 * Calculate shipping rates for orders.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const calculateShippingSchema = z.object({
  destination: z.object({
    country: z.string().length(2),
    state: z.string().optional(),
    city: z.string(),
    zipCode: z.string(),
  }),
  weight: z.number().positive(), // in kg
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
  }).optional(),
});

/**
 * POST /api/shipping/rates
 * Calculate shipping rates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = calculateShippingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { destination, weight } = validation.data;

    // Mock shipping rates calculation
    const baseRate = 5.00;
    const perKgRate = 2.50;
    const internationalMultiplier = destination.country !== 'US' ? 2.5 : 1;

    const rates = [
      {
        id: 'standard',
        name: 'Standard Shipping',
        carrier: 'USPS',
        deliveryDays: destination.country === 'US' ? '5-7' : '10-15',
        price: Number(((baseRate + weight * perKgRate) * internationalMultiplier).toFixed(2)),
        currency: 'USD',
      },
      {
        id: 'express',
        name: 'Express Shipping',
        carrier: 'FedEx',
        deliveryDays: destination.country === 'US' ? '2-3' : '5-7',
        price: Number(((baseRate + weight * perKgRate) * internationalMultiplier * 2).toFixed(2)),
        currency: 'USD',
      },
      {
        id: 'overnight',
        name: 'Overnight Shipping',
        carrier: 'UPS',
        deliveryDays: '1',
        price: Number(((baseRate + weight * perKgRate) * internationalMultiplier * 4).toFixed(2)),
        currency: 'USD',
        available: destination.country === 'US',
      },
    ].filter(rate => rate.available !== false);

    return NextResponse.json({ 
      rates,
      destination,
      calculatedAt: new Date().toISOString(),
    }, { status: 200 });
  } catch (error) {
    console.error('Calculate shipping error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate shipping rates' },
      { status: 500 }
    );
  }
}
