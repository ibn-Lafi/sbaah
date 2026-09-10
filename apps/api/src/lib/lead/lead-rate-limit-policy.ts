/**
 * Pure decision function for POST /v1/public/leads rate limiting — same
 * "no I/O, easy to unit-test" split as otp-policy.ts. Turnstile alone
 * doesn't stop a resourced attacker from mass-inserting leads, so this is
 * a defense-in-depth IP-based cap on top of it (migration 0029).
 */
export const LEAD_RATE_LIMIT_CONFIG = {
  windowMs: 10 * 60 * 1000,
  maxAttemptsPerIp: 5,
};

export function hasExceededLeadRateLimit(recentAttemptCount: number): boolean {
  return recentAttemptCount >= LEAD_RATE_LIMIT_CONFIG.maxAttemptsPerIp;
}
