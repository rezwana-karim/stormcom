// src/app/api/attributes/[id]/route.ts
// Individual Attribute API - Get, update, delete

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { AttributeService } from '@/lib/services/attribute.service';
import { z } from 'zod';

const updateAttributeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  values: z.array(z.string().min(1).max(50)).optional(),
});

// GET /api/attributes/[id] - Get attribute by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const attributeService = AttributeService.getInstance();
    const attribute = await attributeService.getAttributeById(params.id);

    if (!attribute) {
      return NextResponse.json(
        { error: 'Attribute not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: attribute });
  } catch (error) {
    console.error(`GET /api/attributes/${params.id} error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch attribute' },
      { status: 500 }
    );
  }
}

// PATCH /api/attributes/[id] - Update attribute
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateAttributeSchema.parse(body);

    const attributeService = AttributeService.getInstance();
    const attribute = await attributeService.updateAttribute(
      params.id,
      validatedData
    );

    return NextResponse.json({
      data: attribute,
      message: 'Attribute updated successfully',
    });
  } catch (error) {
    console.error(`PATCH /api/attributes/${params.id} error:`, error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update attribute' },
      { status: 500 }
    );
  }
}

// DELETE /api/attributes/[id] - Delete attribute
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const attributeService = AttributeService.getInstance();
    await attributeService.deleteAttribute(params.id);

    return NextResponse.json({
      message: 'Attribute deleted successfully',
    });
  } catch (error) {
    console.error(`DELETE /api/attributes/${params.id} error:`, error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
      if (error.message.includes('used in')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete attribute' },
      { status: 500 }
    );
  }
}
