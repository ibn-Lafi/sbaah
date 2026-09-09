import { randomInt } from 'node:crypto';

/**
 * 4-digit numeric code, matching `otpCodeSchema`
 * (packages/shared/src/validation/auth.ts). Unlike Twilio Verify,
 * Authentica does not generate the OTP itself — `/send-otp` takes the
 * code as an input field and only delivers + stores it for the matching
 * `/verify-otp` check (docs/OTP_FLOW.md).
 */
export function generateOtpCode(): string {
  return randomInt(0, 10000).toString().padStart(4, '0');
}
