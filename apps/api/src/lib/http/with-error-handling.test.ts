import { describe, expect, it, vi } from 'vitest';
import type { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ApiError } from './api-error';
import { databaseWriteError } from './database-error';
import { withErrorHandling } from './with-error-handling';

async function run(error: unknown) {
  const handler = withErrorHandling(async (): Promise<NextResponse> => {
    throw error;
  });
  const response = await handler({} as NextRequest, undefined);
  return { status: response.status, body: await response.json() };
}

describe('withErrorHandling', () => {
  it('keeps an ApiError status and code', async () => {
    expect(await run(new ApiError(403, 'forbidden', 'x'))).toEqual({ status: 403, body: { error: { code: 'forbidden', message: 'x' } } });
  });

  it('turns invalid input into a 400 carrying the schema message', async () => {
    const parsed = z.object({ phone: z.string().regex(/^\+966/, 'رقم جوال غير صحيح') }).safeParse({ phone: '123' });
    const result = await run(parsed.error);
    expect(result.status).toBe(400);
    expect(result.body.error).toEqual({ code: 'validation_error', message: 'رقم جوال غير صحيح' });
  });

  it('hides Zod default (English, internal) messages behind a generic one', async () => {
    const parsed = z.object({ id: z.string().uuid() }).safeParse({ id: 'nope' });
    const result = await run(parsed.error);
    expect(result.body.error.message).toBe('البيانات المرسلة غير صالحة');
  });

  it('maps a malformed JSON body to 400 and anything else to an opaque 500', async () => {
    expect((await run(new SyntaxError('Unexpected token'))).status).toBe(400);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const result = await run(new Error('connection refused to 10.0.0.5'));
    expect(result).toEqual({ status: 500, body: { error: { code: 'internal_error', message: 'حدث خطأ غير متوقع' } } });
    consoleError.mockRestore();
  });
});

describe('databaseWriteError', () => {
  it('maps RLS, duplicate and business-rule rejections to 4xx', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(databaseWriteError({ code: '42501', message: 'rls' }, 'x')).toMatchObject({ status: 403 });
    expect(databaseWriteError({ code: '23505', message: 'dup' }, 'x')).toMatchObject({ status: 409, code: 'duplicate_record' });
    expect(
      databaseWriteError({ code: 'P0001', message: 'asset 1 conflicts with active reservation RSV (2) through asset 1' }, 'x'),
    ).toMatchObject({ status: 409, code: 'asset_unavailable' });
    expect(databaseWriteError({ code: 'P0001', message: 'lease contract requires at least one lessor' }, 'x')).toMatchObject({
      status: 409,
    });
    consoleWarn.mockRestore();
  });

  it('keeps unknown failures internal', () => {
    const error = databaseWriteError({ code: '08006', message: 'connection failure' }, 'Failed to create deal');
    expect(error).not.toBeInstanceOf(ApiError);
    expect(error.message).toBe('Failed to create deal: connection failure');
  });
});
