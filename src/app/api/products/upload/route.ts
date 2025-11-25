// src/app/api/products/upload/route.ts
// Product Image Upload API (Vercel Blob Storage)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { put, del } from '@vercel/blob';
import { z } from 'zod';

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Response schema for validation
const uploadResponseSchema = z.object({
  url: z.string().url(),
  pathname: z.string(),
  contentType: z.string(),
  contentDisposition: z.string(),
});

// POST /api/products/upload - Upload product image
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check for Blob token
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: 'Image upload is not configured. BLOB_READ_WRITE_TOKEN is missing.' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    const storeId = formData.get('storeId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Image file is required' },
        { status: 400 }
      );
    }

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Sanitize filename
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const pathname = `products/${storeId}/${originalName}`;

    // Upload to Vercel Blob
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    // Validate response
    const validatedResponse = uploadResponseSchema.parse(blob);

    return NextResponse.json({
      url: validatedResponse.url,
      pathname: validatedResponse.pathname,
      contentType: validatedResponse.contentType,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/products/upload error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid response from storage service', details: error.issues },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/upload - Delete product image
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check for Blob token
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: 'Image upload is not configured. BLOB_READ_WRITE_TOKEN is missing.' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Delete from Vercel Blob
    await del(url);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/products/upload error:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
