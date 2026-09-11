/**
 * Pure decision function for POST /v1/public/broker-applications rate
 * limiting — same shape as lead-rate-limit-policy.ts (own table,
 * migration 0032): Turnstile alone doesn't stop a resourced attacker
 * from mass-inserting applications, so this is a defense-in-depth
 * IP-based cap on top of it.
 */
export const BROKER_MARKETER_RATE_LIMIT_CONFIG = {
  windowMs: 10 * 60 * 1000,
  maxAttemptsPerIp: 5,
};

export function hasExceededBrokerMarketerRateLimit(recentAttemptCount: number): boolean {
  return recentAttemptCount >= BROKER_MARKETER_RATE_LIMIT_CONFIG.maxAttemptsPerIp;
}
