import crypto from 'node:crypto';

// Test-only signing secret shared by PostgREST (see run.sh) and the GoTrue stand-in.
export const JWT_SECRET = 'e2e-only-jwt-secret-e2e-only-jwt-secret';

const base64Url = (value) => Buffer.from(value).toString('base64url');

export function signJwt(payload) {
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64Url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyJwt(token) {
  const [header, body, signature] = (token ?? '').split('.');
  if (!header || !body || !signature) return null;
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  if (expected !== signature) return null;
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
  if (payload.exp && payload.exp < Date.now() / 1000) return null;
  return payload;
}

const TEN_YEARS = 10 * 365 * 24 * 3600;
export const ANON_KEY = signJwt({ role: 'anon', exp: Math.floor(Date.now() / 1000) + TEN_YEARS });
export const SERVICE_ROLE_KEY = signJwt({ role: 'service_role', exp: Math.floor(Date.now() / 1000) + TEN_YEARS });
