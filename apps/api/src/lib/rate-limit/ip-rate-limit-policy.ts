/**
 * Pure decision factory for the "N attempts per IP per window" shape
 * repeated across every public, unauthenticated write endpoint — Turnstile
 * alone doesn't stop a resourced attacker from mass-inserting rows, so
 * this is defense-in-depth on top of it (originally written twice,
 * near-identically, for leads and broker-marketer applications).
 */
export interface IpRateLimitPolicy {
  windowMs: number;
  maxAttemptsPerIp: number;
  hasExceeded: (recentAttemptCount: number) => boolean;
}

export function createIpRateLimitPolicy(windowMs: number, maxAttemptsPerIp: number): IpRateLimitPolicy {
  return {
    windowMs,
    maxAttemptsPerIp,
    hasExceeded: (recentAttemptCount: number) => recentAttemptCount >= maxAttemptsPerIp,
  };
}
