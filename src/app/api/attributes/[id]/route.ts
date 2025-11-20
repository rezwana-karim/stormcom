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
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: 'Invalid request: missing id' },
        { status: 400 }
      );
    }

    console.log('GET /api/attributes/[id] resolved id:', id);
    const attributeService = AttributeService.getInstance();
    const attribute = await attributeService.getAttributeById(id);

    if (!attribute) {
      return NextResponse.json(
        { error: 'Attribute not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: attribute });
  } catch (error: unknown) {
    console.error('GET /api/attributes/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attribute', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PATCH /api/attributes/[id] - Update attribute
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: 'Invalid request: missing id' },
        { status: 400 }
      );
    }

    const attributeService = AttributeService.getInstance();
    const attribute = await attributeService.updateAttribute(
      id,
      validatedData
    );

    return NextResponse.json({
      data: attribute,
      message: 'Attribute updated successfully',
    });
  } catch (error: unknown) {
    console.error('PATCH /api/attributes/[id] error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
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
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: 'Invalid request: missing id' },
        { status: 400 }
      );
    }

    const attributeService = AttributeService.getInstance();
    await attributeService.deleteAttribute(id);

    return NextResponse.json({
      message: 'Attribute deleted successfully',
    });
  } catch (error: unknown) {
    console.error('DELETE /api/attributes/[id] error:', error);

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
