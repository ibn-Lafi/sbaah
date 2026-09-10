/**
 * Shared `api` HTTP client — was duplicated near-verbatim across
 * apps/dashboard, apps/console, and apps/public-site's own lib/api/client.ts
 * (code-quality audit finding). Every app reads the same
 * NEXT_PUBLIC_API_URL env var, so one implementation covers all three;
 * each app's own client.ts now just re-exports from here.
 */

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

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  accessToken?: string;
}

/** Every call funnels through here — a plain object body is sent as JSON, a FormData body (e.g. property media upload) is sent as-is. */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(`${requireApiUrl()}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body,
    });
    return await handleResponse<T>(response);
  } catch (err) {
    if (err instanceof ApiRequestError) throw err;
    throw new ApiRequestError('network_error', 'تعذّر الاتصال بالخادم، تحقق من اتصالك بالإنترنت');
  }
}

/** Unauthenticated by default (OTP send/verify, register, reset-password, console login); pass accessToken for authenticated calls. */
export function apiPost<T>(path: string, body: unknown, accessToken?: string): Promise<T> {
  return request<T>(path, { method: 'POST', body, accessToken });
}

export function apiPatch<T>(path: string, body: unknown, accessToken: string): Promise<T> {
  return request<T>(path, { method: 'PATCH', body, accessToken });
}

export function apiDelete<T>(path: string, accessToken: string): Promise<T> {
  return request<T>(path, { method: 'DELETE', accessToken });
}

/** GET /v1/auth/me and every tenant/console-scoped list/detail call requires accessToken; GET /v1/public/* endpoints don't. */
export function apiGet<T>(path: string, accessToken?: string): Promise<T> {
  return request<T>(path, { accessToken });
}

/** multipart/form-data upload (property media) — never set Content-Type manually, the browser adds the correct boundary. */
export function apiUpload<T>(path: string, formData: FormData, accessToken: string): Promise<T> {
  return request<T>(path, { method: 'POST', body: formData, accessToken });
}
