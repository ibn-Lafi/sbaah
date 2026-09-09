/** Thrown for any non-2xx response from `api` — carries the same {code, message} shape apps/api/src/lib/http/responses.ts sends. */
export class ApiRequestError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

function requireApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_API_URL');
  }
  return url;
}

/** public-site is entirely unauthenticated (PRODUCT_SPEC section 10) — every call here hits `api`'s /public/* routes, no bearer token ever. */
export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${requireApiUrl()}${path}`);
  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiRequestError(json?.error?.code ?? 'unknown_error', json?.error?.message ?? 'حدث خطأ غير متوقع');
  }
  return json as T;
}
