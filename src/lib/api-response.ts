/**
 * API Response Utilities
 * 
 * Standardized API response builders for consistent responses.
 * Reduces duplication in API route handlers.
 */

import { NextResponse } from 'next/server';

/**
 * Success response with data
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
) {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  );
}

/**
 * Created response (201)
 */
export function createdResponse<T>(data: T, message: string = 'Resource created successfully') {
  return successResponse(data, message, 201);
}

/**
 * No content response (204)
 */
export function noContentResponse() {
  return new NextResponse(null, { status: 204 });
}

/**
 * Error response
 */
export function errorResponse(
  message: string,
  status: number = 500,
  code?: string
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(code && { code }),
    },
    { status }
  );
}

/**
 * Bad request response (400)
 */
export function badRequestResponse(message: string = 'Bad request') {
  return errorResponse(message, 400, 'BAD_REQUEST');
}

/**
 * Unauthorized response (401)
 */
export function unauthorizedResponse(message: string = 'Unauthorized') {
  return errorResponse(message, 401, 'UNAUTHORIZED');
}

/**
 * Forbidden response (403)
 */
export function forbiddenResponse(message: string = 'Forbidden') {
  return errorResponse(message, 403, 'FORBIDDEN');
}

/**
 * Not found response (404)
 */
export function notFoundResponse(message: string = 'Resource not found') {
  return errorResponse(message, 404, 'NOT_FOUND');
}

/**
 * Conflict response (409)
 */
export function conflictResponse(message: string = 'Resource already exists') {
  return errorResponse(message, 409, 'CONFLICT');
}

/**
 * Paginated response
 */
export function paginatedResponse<T>(
  items: T[],
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  }
) {
  return successResponse({
    items,
    pagination,
  });
}

/**
 * Check if request method is allowed
 * Returns error response if method not allowed
 */
export function checkMethod(request: Request, allowedMethods: string[]) {
  if (!allowedMethods.includes(request.method)) {
    return NextResponse.json(
      {
        success: false,
        error: `Method ${request.method} not allowed`,
        code: 'METHOD_NOT_ALLOWED',
      },
      {
        status: 405,
        headers: {
          Allow: allowedMethods.join(', '),
        },
      }
    );
  }
  return null;
}

/**
 * Parse JSON body safely
 */
export async function parseBody<T = unknown>(request: Request): Promise<T> {
  try {
    return await request.json();
  } catch (error) {
    throw new Error('Invalid JSON body');
  }
}
