import { OTP_CONFIG } from './otp-config';

/**
 * Pure decision functions with no I/O — the actual send/verify limits
 * from docs/OTP_FLOW.md section 6, kept separate from the Supabase/Twilio
 * calls around them so they can be unit-tested without a live project.
 */

export function hasExceededSendLimit(recentSendCount: number): boolean {
  return recentSendCount >= OTP_CONFIG.maxSendsPerWindow;
}

export function isLocked(lockedUntil: string | null, now: Date = new Date()): boolean {
  if (!lockedUntil) return false;
  return new Date(lockedUntil) > now;
}

export function isExpired(expiresAt: string, now: Date = new Date()): boolean {
  return new Date(expiresAt) <= now;
}

/** Called after a failed verify attempt with the attempt count *before* incrementing. */
export function shouldLockAfterFailedAttempt(previousAttemptCount: number): boolean {
  return previousAttemptCount + 1 >= OTP_CONFIG.maxVerifyAttempts;
}

export function computeExpiresAt(now: Date = new Date()): string {
  return new Date(now.getTime() + OTP_CONFIG.ttlMs).toISOString();
}

export function computeLockedUntil(now: Date = new Date()): string {
  return new Date(now.getTime() + OTP_CONFIG.lockoutDurationMs).toISOString();
}
