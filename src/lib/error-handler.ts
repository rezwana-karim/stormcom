/**
 * API Error Handler
 * 
 * Standardized error handling for API routes and server actions.
 * Provides consistent error responses and logging.
 */

import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * Handle errors in API routes
 * Returns appropriate NextResponse based on error type
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  console.error('API Error:', error);

  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation Error',
        message: 'Invalid input data',
        code: 'VALIDATION_ERROR',
        details: error.issues,
      },
      { status: 400 }
    );
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error);
  }

  // Custom service errors
  if (error instanceof Error && 'statusCode' in error) {
    const serviceError = error as any;
    return NextResponse.json(
      {
        error: serviceError.name,
        message: serviceError.message,
        code: serviceError.code,
      },
      { status: serviceError.statusCode || 500 }
    );
  }

  // Generic errors
  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error.message,
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }

  // Unknown errors
  return NextResponse.json(
    {
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    },
    { status: 500 }
  );
}

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError
): NextResponse<ApiErrorResponse> {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const target = (error.meta?.target as string[]) || [];
      return NextResponse.json(
        {
          error: 'Conflict',
          message: `A record with this ${target.join(', ')} already exists`,
          code: 'DUPLICATE_RECORD',
        },
        { status: 409 }
      );

    case 'P2003':
      // Foreign key constraint violation
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Referenced record does not exist',
          code: 'INVALID_REFERENCE',
        },
        { status: 400 }
      );

    case 'P2025':
      // Record not found
      return NextResponse.json(
        {
          error: 'Not Found',
          message: 'Record not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );

    default:
      return NextResponse.json(
        {
          error: 'Database Error',
          message: 'A database error occurred',
          code: error.code,
        },
        { status: 500 }
      );
  }
}

/**
 * Handle errors in Server Actions
 * Returns error object that can be used in useActionState
 */
export function handleActionError(error: unknown): {
  success: false;
  error: string;
  code?: string;
} {
  console.error('Action Error:', error);

  // Zod validation errors
  if (error instanceof ZodError) {
    return {
      success: false,
      error: error.issues.map((e) => e.message).join(', '),
      code: 'VALIDATION_ERROR',
    };
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        const target = (error.meta?.target as string[]) || [];
        return {
          success: false,
          error: `A record with this ${target.join(', ')} already exists`,
          code: 'DUPLICATE_RECORD',
        };
      case 'P2025':
        return {
          success: false,
          error: 'Record not found',
          code: 'NOT_FOUND',
        };
      default:
        return {
          success: false,
          error: 'A database error occurred',
          code: error.code,
        };
    }
  }

  // Custom service errors
  if (error instanceof Error && 'code' in error) {
    return {
      success: false,
      error: error.message,
      code: (error as any).code,
    };
  }

  // Generic errors
  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
      code: 'ERROR',
    };
  }

  // Unknown errors
  return {
    success: false,
    error: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Wrap API handler with error handling
 */
export function withErrorHandling<T>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | ApiErrorResponse>> {
  return handler().catch(handleApiError);
}

/**
 * Wrap Server Action with error handling
 */
export async function withActionErrorHandling<T>(
  action: () => Promise<T>
): Promise<T | { success: false; error: string; code?: string }> {
  try {
    return await action();
  } catch (error) {
    return handleActionError(error);
  }
}
