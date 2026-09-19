import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { ApiError } from '@/lib/http';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const ANALYTICS_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function encryptionKey(): Buffer {
  const raw = requireEnv('GOOGLE_OAUTH_TOKEN_ENCRYPTION_KEY');
  let decoded: Buffer;
  try {
    decoded = Buffer.from(raw, 'base64');
  } catch {
    throw new Error('GOOGLE_OAUTH_TOKEN_ENCRYPTION_KEY must be base64');
  }
  if (decoded.length !== 32) throw new Error('GOOGLE_OAUTH_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes');
  return decoded;
}

export function hashOAuthState(state: string): string {
  return createHash('sha256').update(state).digest('hex');
}

export function createOAuthState(): string {
  return randomBytes(32).toString('base64url');
}

export function buildGoogleAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv('GOOGLE_CLIENT_ID'),
    redirect_uri: requireEnv('GOOGLE_ANALYTICS_REDIRECT_URI'),
    response_type: 'code',
    scope: ANALYTICS_SCOPE,
    access_type: 'offline',
    include_granted_scopes: 'true',
    prompt: 'consent',
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeAuthorizationCode(code: string) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: requireEnv('GOOGLE_CLIENT_ID'),
      client_secret: requireEnv('GOOGLE_CLIENT_SECRET'),
      redirect_uri: requireEnv('GOOGLE_ANALYTICS_REDIRECT_URI'),
      grant_type: 'authorization_code',
    }),
    cache: 'no-store',
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.access_token) throw new ApiError(502, 'google_oauth_failed', 'تعذر إكمال الربط مع Google');
  return {
    accessToken: body.access_token as string,
    refreshToken: (body.refresh_token as string | undefined) ?? null,
    scopes: typeof body.scope === 'string' ? body.scope.split(' ').filter(Boolean) : [ANALYTICS_SCOPE],
  };
}

export function encryptRefreshToken(token: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptRefreshToken(payload: string): string {
  const [version, ivRaw, tagRaw, encryptedRaw] = payload.split('.');
  if (version !== 'v1' || !ivRaw || !tagRaw || !encryptedRaw) throw new Error('Invalid encrypted OAuth token');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivRaw, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(encryptedRaw, 'base64url')), decipher.final()]).toString('utf8');
}

async function googleGet<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
  if (!response.ok) throw new ApiError(502, 'google_analytics_api_failed', 'تعذر قراءة إعداد Google Analytics');
  return response.json() as Promise<T>;
}

export async function resolveAnalyticsProperty(accessToken: string, measurementId: string) {
  const summaries = await googleGet<{ accountSummaries?: Array<{ propertySummaries?: Array<{ property: string }> }> }>(
    'https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200',
    accessToken,
  );
  const properties = (summaries.accountSummaries ?? []).flatMap((account) => account.propertySummaries ?? []);
  for (const summary of properties) {
    const propertyName = summary.property;
    if (!propertyName) continue;
    const streams = await googleGet<{ dataStreams?: Array<{ name: string; type: string; webStreamData?: { measurementId?: string } }> }>(
      `https://analyticsadmin.googleapis.com/v1beta/${propertyName}/dataStreams?pageSize=200`,
      accessToken,
    );
    const match = (streams.dataStreams ?? []).find(
      (stream) => stream.type === 'WEB_DATA_STREAM' && stream.webStreamData?.measurementId?.toUpperCase() === measurementId.toUpperCase(),
    );
    if (match) return { propertyId: propertyName.replace('properties/', ''), streamId: match.name };
  }
  throw new ApiError(409, 'measurement_id_not_accessible', 'لم نجد معرّف القياس داخل حساب Google الذي تم ربطه');
}
