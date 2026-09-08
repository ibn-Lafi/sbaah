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

async function handleResponse<T>(response: Response): Promise<T> {
  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiRequestError(json?.error?.code ?? 'unknown_error', json?.error?.message ?? 'حدث خطأ غير متوقع');
  }
  return json as T;
}

/** Every `/v1/auth/otp/*`, `/v1/auth/register` and `/v1/auth/reset-password` call is an unauthenticated POST — no Authorization header, per docs/OTP_FLOW.md. */
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  try {
    const response = await fetch(`${requireApiUrl()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await handleResponse<T>(response);
  } catch (err) {
    if (err instanceof ApiRequestError) throw err;
    throw new ApiRequestError('network_error', 'تعذّر الاتصال بالخادم، تحقق من اتصالك بالإنترنت');
  }
}

/** Authenticated GET — every call after login carries the caller's own Supabase access token. */
export async function apiGet<T>(path: string, accessToken: string): Promise<T> {
  try {
    const response = await fetch(`${requireApiUrl()}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return await handleResponse<T>(response);
  } catch (err) {
    if (err instanceof ApiRequestError) throw err;
    throw new ApiRequestError('network_error', 'تعذّر الاتصال بالخادم، تحقق من اتصالك بالإنترنت');
  }
}
