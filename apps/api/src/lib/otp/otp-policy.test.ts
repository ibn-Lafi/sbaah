import { describe, expect, it } from 'vitest';
import { OTP_CONFIG } from './otp-config';
import {
  computeExpiresAt,
  computeLockedUntil,
  hasExceededSendLimit,
  hasExhaustedVerifyAttempts,
  isExpired,
  isLocked,
  sumFailedAttempts,
} from './otp-policy';

describe('OTP policy', () => {
  const now = new Date('2026-09-23T10:00:00Z');

  it('caps sends per identifier and purpose', () => {
    expect(hasExceededSendLimit(OTP_CONFIG.maxSendsPerWindow - 1)).toBe(false);
    expect(hasExceededSendLimit(OTP_CONFIG.maxSendsPerWindow)).toBe(true);
  });

  it('counts attempts across every recent code, so a resend never resets the budget', () => {
    expect(sumFailedAttempts([{ attempt_count: 3 }, { attempt_count: 2 }])).toBe(5);
    expect(hasExhaustedVerifyAttempts(sumFailedAttempts([{ attempt_count: 3 }, { attempt_count: 2 }]))).toBe(true);
    expect(hasExhaustedVerifyAttempts(OTP_CONFIG.maxVerifyAttempts - 1)).toBe(false);
  });

  it('treats a code as expired at its expiry instant and locked until the lock ends', () => {
    expect(isExpired(now.toISOString(), now)).toBe(true);
    expect(isExpired(computeExpiresAt(now), now)).toBe(false);
    expect(isLocked(null, now)).toBe(false);
    expect(isLocked(computeLockedUntil(now), now)).toBe(true);
    expect(isLocked(new Date(now.getTime() - 1).toISOString(), now)).toBe(false);
  });
});
