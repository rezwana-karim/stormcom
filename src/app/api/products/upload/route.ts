// src/app/api/products/upload/route.ts
// Product Image Upload API
// Supports file uploads up to 10MB
// Note: In production, integrate with Vercel Blob Storage or similar service

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { verifyStoreAccess } from '@/lib/get-current-user';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed image MIME types
// Note: SVG is intentionally excluded to prevent stored XSS attacks
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

// Validate storeId to prevent directory traversal attacks
// Primary validation: CUID format (25 chars, starts with 'c', lowercase alphanumeric)
// Fallback validation: general safe alphanumeric for backward compatibility
function isValidStoreId(storeId: string): boolean {
  // Standard CUID format: exactly 25 chars, starts with 'c', lowercase alphanumeric
  const cuidRegex = /^c[a-z0-9]{24}$/;
  
  // CUID2 format: 21-24 lowercase alphanumeric characters
  const cuid2Regex = /^[a-z0-9]{21,24}$/;
  
  // Fallback: safe alphanumeric pattern for legacy/custom IDs
  // Allows lowercase, digits, hyphens, and underscores (10-50 chars)
  // Does NOT allow uppercase, dots, slashes, or other special characters to prevent path traversal
  const safeIdRegex = /^[a-z0-9_-]{10,50}$/;
  
  return (
    cuidRegex.test(storeId) ||
    cuid2Regex.test(storeId) ||
    safeIdRegex.test(storeId)
  );
}

// Generate a unique filename
function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  // Sanitize extension to prevent path traversal
  const safeExtension = extension.replace(/[^a-z0-9]/g, '');
  return `${timestamp}-${random}.${safeExtension || 'jpg'}`;
}

// POST /api/products/upload - Upload product image
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    const storeId = formData.get('storeId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    // Validate storeId to prevent directory traversal attacks
    if (!isValidStoreId(storeId)) {
      return NextResponse.json(
        { error: 'Invalid storeId format' },
        { status: 400 }
      );
    }

    // Verify user has access to this store (multi-tenant security)
    const hasStoreAccess = await verifyStoreAccess(storeId);
    if (!hasStoreAccess) {
      return NextResponse.json(
        { error: 'Access denied. You do not have permission to upload to this store.' },
        { status: 403 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
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

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const uniqueFileName = generateUniqueFileName(file.name);
    
    // Create upload directory for store if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'products', storeId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save file
    const filePath = join(uploadDir, uniqueFileName);
    await writeFile(filePath, buffer);

    // Generate URL
    const url = `/uploads/products/${storeId}/${uniqueFileName}`;

    return NextResponse.json({
      success: true,
      url,
      filename: uniqueFileName,
      originalName: file.name,
      size: file.size,
      type: file.type,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/products/upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

// Handle multiple image uploads
export async function PUT(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    const storeId = formData.get('storeId') as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No image files provided' },
        { status: 400 }
      );
    }

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    // Validate storeId to prevent directory traversal attacks
    if (!isValidStoreId(storeId)) {
      return NextResponse.json(
        { error: 'Invalid storeId format' },
        { status: 400 }
      );
    }

    // Verify user has access to this store (multi-tenant security)
    const hasStoreAccess = await verifyStoreAccess(storeId);
    if (!hasStoreAccess) {
      return NextResponse.json(
        { error: 'Access denied. You do not have permission to upload to this store.' },
        { status: 403 }
      );
    }

    // Limit number of files per upload
    if (files.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 images can be uploaded at once' },
        { status: 400 }
      );
    }

    // Create upload directory for store if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'products', storeId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const results: Array<{
      success: boolean;
      url?: string;
      filename?: string;
      originalName: string;
      error?: string;
    }> = [];

    for (const file of files) {
      try {
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          results.push({
            success: false,
            originalName: file.name,
            error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
          });
          continue;
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
          results.push({
            success: false,
            originalName: file.name,
            error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`,
          });
          continue;
        }

        // Read file buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique filename
        const uniqueFileName = generateUniqueFileName(file.name);
        
        // Save file
        const filePath = join(uploadDir, uniqueFileName);
        await writeFile(filePath, buffer);

        // Generate URL
        const url = `/uploads/products/${storeId}/${uniqueFileName}`;

        results.push({
          success: true,
          url,
          filename: uniqueFileName,
          originalName: file.name,
        });
      } catch (error) {
        results.push({
          success: false,
          originalName: file.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const urls = results.filter(r => r.success).map(r => r.url);

    return NextResponse.json({
      success: successCount > 0,
      uploaded: successCount,
      total: files.length,
      urls,
      results,
    });
  } catch (error) {
    console.error('PUT /api/products/upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload images' },
      { status: 500 }
    );
  }
}
