import type { NextRequest, NextResponse } from 'next/server';
import { ApiError } from './api-error';
import { errorResponse } from './responses';

type RouteHandler = (request: NextRequest) => Promise<NextResponse>;

/**
 * Wraps a Route Handler so every endpoint fails the same way: a thrown
 * `ApiError` becomes its declared status/code, anything else becomes a
 * generic 500 with no internal detail leaked to the client.
 */
export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (request) => {
    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof ApiError) {
        return errorResponse(error.code, error.message, error.status);
      }
      console.error(error);
      return errorResponse('internal_error', 'حدث خطأ غير متوقع', 500);
    }
  };
}
