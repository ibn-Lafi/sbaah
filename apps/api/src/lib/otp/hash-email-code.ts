import { createHmac, timingSafeEqual } from 'node:crypto';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Email-channel OTP has no Authentica-style remote verifier (docs/OTP_FLOW.md
 * section 2 / migration 0042) — the code is checked entirely by us, so
 * only a keyed hash of it is ever persisted in `otp_verifications.code_hash`,
 * never the plaintext code.
 */
export function hashEmailOtpCode(code: string): string {
  return createHmac('sha256', requireEnv('OTP_EMAIL_CODE_SECRET')).update(code).digest('hex');
}

export function verifyEmailOtpCode(code: string, hash: string): boolean {
  const expected = Buffer.from(hashEmailOtpCode(code), 'hex');
  const actual = Buffer.from(hash, 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
