const PUBLIC_PATH_PREFIX = '/v1/public/';

function getAllowedOrigins(): string[] {
  return (process.env.API_CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/**
 * PRODUCT_SPEC.md section 7: `/v1/public/*` (called by public-site across
 * arbitrary tenant domains) allows any origin by design. Everything else
 * (called only by dashboard/console) is a strict allowlist —
 * `API_CORS_ALLOWED_ORIGINS`, comma-separated.
 */
export function buildCorsHeaders(pathname: string, requestOrigin: string | null): Headers {
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });

  if (pathname.startsWith(PUBLIC_PATH_PREFIX)) {
    headers.set('Access-Control-Allow-Origin', '*');
    return headers;
  }

  if (requestOrigin && getAllowedOrigins().includes(requestOrigin)) {
    headers.set('Access-Control-Allow-Origin', requestOrigin);
    headers.set('Vary', 'Origin');
  }

  return headers;
}
