import type { NextRequest, NextResponse } from 'next/server';
import { ApiError } from './api-error';
import { errorResponse } from './responses';

type RouteHandler<Context> = (request: NextRequest, context: Context) => Promise<NextResponse>;

/**
 * Wraps a Route Handler so every endpoint fails the same way: a thrown
 * `ApiError` becomes its declared status/code, anything else becomes a
 * generic 500 with no internal detail leaked to the client. Generic over
 * `Context` so dynamic routes (`[id]`, whose handlers take a second
 * `{ params }` argument per Next.js 15's async route params) can use it
 * too — a handler that only declares `request` still satisfies this.
 */
export function withErrorHandling<Context = unknown>(handler: RouteHandler<Context>): RouteHandler<Context> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof ApiError) {
        return errorResponse(error.code, error.message, error.status);
      }
      console.error(error);
      return errorResponse('internal_error', 'حدث خطأ غير متوقع', 500);
    }
  };
}
