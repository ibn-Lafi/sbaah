import { NextResponse } from 'next/server';

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

/** Every successful route handler returns through this — one response shape across `api`. */
export function okResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

/** Every error response goes through this too — matches `ApiErrorBody` so clients can rely on the shape. */
export function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json<ApiErrorBody>({ error: { code, message } }, { status });
}
