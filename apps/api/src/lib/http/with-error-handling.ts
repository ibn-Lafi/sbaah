import type { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiError } from './api-error';
import { errorResponse } from './responses';

type RouteHandler<Context> = (request: NextRequest, context: Context) => Promise<NextResponse>;

const ARABIC_TEXT = /[؀-ۿ]/;
const GENERIC_VALIDATION_MESSAGE = 'البيانات المرسلة غير صالحة';

/** Schemas carry Arabic messages for user-facing rules; Zod's own defaults are English and internal. */
function validationMessage(error: ZodError): string {
  const message = error.issues[0]?.message;
  return message && ARABIC_TEXT.test(message) ? message : GENERIC_VALIDATION_MESSAGE;
}

/**
 * Wraps a Route Handler so every endpoint fails the same way: a thrown
 * `ApiError` becomes its declared status/code, invalid input (a Zod
 * validation failure or a malformed JSON body) becomes a 400, and anything
 * else becomes a generic 500 with no internal detail leaked to the client.
 * Generic over `Context` so dynamic routes (`[id]`, whose handlers take a
 * second `{ params }` argument per Next.js 15's async route params) can use
 * it too — a handler that only declares `request` still satisfies this.
 */
export function withErrorHandling<Context = unknown>(handler: RouteHandler<Context>): RouteHandler<Context> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof ApiError) {
        return errorResponse(error.code, error.message, error.status);
      }
      if (error instanceof ZodError) {
        return errorResponse('validation_error', validationMessage(error), 400);
      }
      if (error instanceof SyntaxError) {
        return errorResponse('invalid_json', 'صيغة الطلب غير صالحة', 400);
      }
      console.error(error);
      return errorResponse('internal_error', 'حدث خطأ غير متوقع', 500);
    }
  };
}
