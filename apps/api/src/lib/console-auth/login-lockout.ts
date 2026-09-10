/**
 * Brute-force protection for POST /v1/console-auth/login (task 42/42's
 * final security review). Removing mandatory TOTP (task 37/42's later
 * revision, explicit founder decision) left password guessing against
 * `console` — the system's highest-value target — with no
 * application-level defense at all. Same numbers and same
 * attempt_count/locked_until shape as the OTP verify lockout
 * (otp-policy.ts) for consistency, kept as a separate, small config
 * rather than importing OTP_CONFIG directly — these are two unrelated
 * features that happen to agree on the same numbers today, not one
 * coupled to the other.
 */
const LOGIN_LOCKOUT_CONFIG = {
  maxAttempts: 5,
  lockoutDurationMs: 15 * 60 * 1000,
} as const;

export function isLoginLocked(lockedUntil: string | null, now: Date = new Date()): boolean {
  if (!lockedUntil) return false;
  return new Date(lockedUntil) > now;
}

/** Called with the attempt count *before* incrementing, mirroring otp-policy.ts's shouldLockAfterFailedAttempt. */
export function shouldLockAfterFailedLogin(previousAttemptCount: number): boolean {
  return previousAttemptCount + 1 >= LOGIN_LOCKOUT_CONFIG.maxAttempts;
}

export function computeLoginLockedUntil(now: Date = new Date()): string {
  return new Date(now.getTime() + LOGIN_LOCKOUT_CONFIG.lockoutDurationMs).toISOString();
}
