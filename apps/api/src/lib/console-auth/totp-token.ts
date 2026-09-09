import { jwtVerify, SignJWT, type JWTPayload } from 'jose';

const ALG = 'HS256';
const TTL = '10m';

/**
 * `console`'s own short-lived token, completely separate from
 * `apps/api/src/lib/auth/temp-token.ts` (customer-facing register/
 * reset-password) and its own secret env var — console is a distinct
 * security domain from the customer-facing auth flows (PRODUCT_SPEC
 * section 8's "console is never authorized via users.role" principle
 * extends to keeping its signing material separate too).
 *
 * 'challenge': issued after password verifies (step 1) when the admin
 * already has 2FA set up — exchanged for a real session once a valid
 * TOTP code is presented.
 * 'setup': issued when 2FA isn't set up yet — carries the freshly
 * generated secret itself (never written to the DB until the admin
 * proves they can produce a code from it).
 */
export type ConsoleTotpTokenPayload =
  | { purpose: 'challenge'; platformAdminId: string; authUserId: string }
  | { purpose: 'setup'; platformAdminId: string; authUserId: string; secret: string };

function getSecret(): Uint8Array {
  const secret = process.env.CONSOLE_TOTP_TOKEN_SECRET;
  if (!secret) {
    throw new Error('Missing required environment variable: CONSOLE_TOTP_TOKEN_SECRET');
  }
  return new TextEncoder().encode(secret);
}

export async function signConsoleTotpToken(payload: ConsoleTotpTokenPayload): Promise<string> {
  return new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(TTL)
    .sign(getSecret());
}

function isConsoleTotpTokenPayload(value: unknown): value is ConsoleTotpTokenPayload {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  if (typeof record.platformAdminId !== 'string' || typeof record.authUserId !== 'string') return false;
  if (record.purpose === 'challenge') return true;
  if (record.purpose === 'setup') return typeof record.secret === 'string';
  return false;
}

/** Throws if the token is missing, expired, tampered with, or not a console TOTP token. */
export async function verifyConsoleTotpToken(token: string): Promise<ConsoleTotpTokenPayload> {
  const { payload } = await jwtVerify(token, getSecret(), { algorithms: [ALG] });
  if (!isConsoleTotpTokenPayload(payload)) {
    throw new Error('Malformed console TOTP token payload');
  }
  return payload;
}
