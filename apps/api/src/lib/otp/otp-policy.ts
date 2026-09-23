import { OTP_CONFIG } from './otp-config';

/**
 * Pure decision functions with no I/O — the actual send/verify limits
 * from docs/OTP_FLOW.md section 6, kept separate from the Supabase/Authentica
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

/** Unconsumed attempts across every recent code for one identifier+purpose, so a resend never resets the budget. */
export function sumFailedAttempts(rows: readonly { attempt_count: number }[]): number {
  return rows.reduce((total, row) => total + row.attempt_count, 0);
}

export function hasExhaustedVerifyAttempts(failedAttempts: number): boolean {
  return failedAttempts >= OTP_CONFIG.maxVerifyAttempts;
}

export function computeExpiresAt(now: Date = new Date()): string {
  return new Date(now.getTime() + OTP_CONFIG.ttlMs).toISOString();
}

export function computeLockedUntil(now: Date = new Date()): string {
  return new Date(now.getTime() + OTP_CONFIG.lockoutDurationMs).toISOString();
}
