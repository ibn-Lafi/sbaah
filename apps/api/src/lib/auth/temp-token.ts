import { jwtVerify, SignJWT, type JWTPayload } from 'jose';
import type { OtpPurpose } from '@sbaah/shared';
import { OTP_CONFIG } from '../otp/otp-config';

const ALG = 'HS256';

/**
 * Short-lived token bridging a successful OTP verify to the follow-up
 * step (registration in task 13/35, or POST /v1/auth/reset-password) —
 * docs/OTP_FLOW.md sections 4-5. Only ever issued for 'register' and
 * 'reset_password' — 'login' mints a real Supabase session directly.
 */
export interface TempTokenPayload extends JWTPayload {
  phone: string;
  purpose: Extract<OtpPurpose, 'register' | 'reset_password'>;
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_TEMP_TOKEN_SECRET;
  if (!secret) {
    throw new Error('Missing required environment variable: AUTH_TEMP_TOKEN_SECRET');
  }
  return new TextEncoder().encode(secret);
}

export async function signTempToken(payload: TempTokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(OTP_CONFIG.tempTokenTtl)
    .sign(getSecret());
}

function isTempTokenPayload(value: unknown): value is TempTokenPayload {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.phone === 'string' &&
    (record.purpose === 'register' || record.purpose === 'reset_password')
  );
}

/** Throws if the token is missing, expired, tampered with, or not a temp token. */
export async function verifyTempToken(token: string): Promise<TempTokenPayload> {
  const { payload } = await jwtVerify(token, getSecret(), { algorithms: [ALG] });
  if (!isTempTokenPayload(payload)) {
    throw new Error('Malformed temp token payload');
  }
  return payload;
}
