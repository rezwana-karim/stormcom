// src/app/api/attributes/route.ts
// Attributes API - List and create product attributes

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { AttributeService } from '@/lib/services/attribute.service';
import { z } from 'zod';

// Validation schemas
const listAttributesSchema = z.object({
  storeId: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().min(1).optional(),
  perPage: z.coerce.number().min(1).max(100).optional(),
});

const createAttributeSchema = z.object({
  name: z.string().min(1).max(100),
  storeId: z.string().min(1),
  values: z.array(z.string().min(1).max(50)).optional(),
});

// GET /api/attributes - List attributes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const params = {
      storeId: searchParams.get('storeId') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
      page: searchParams.get('page') || undefined,
      perPage: searchParams.get('perPage') || undefined,
    };

    // Validate params
    const validatedParams = listAttributesSchema.parse(params);

    // Default storeId to demo store if not provided
    const storeId = validatedParams.storeId || 'clqm1j4k00000l8dw8z8r8z8r';

    const attributeService = AttributeService.getInstance();
    const result = await attributeService.listAttributes({
      ...validatedParams,
      storeId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/attributes error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch attributes' },
      { status: 500 }
    );
  }
}

// POST /api/attributes - Create attribute
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
    const validatedData = createAttributeSchema.parse(body);

    const attributeService = AttributeService.getInstance();
    const attribute = await attributeService.createAttribute(validatedData);

    return NextResponse.json(
      {
        data: attribute,
        message: 'Attribute created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/attributes error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create attribute' },
      { status: 500 }
    );
  }
}
