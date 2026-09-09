/** docs/OTP_FLOW.md section 6 — every number here is our own control, independent of Authentica's internal limits. */
export const OTP_CONFIG = {
  /** Code validity window we enforce ourselves — Authentica documents no expiry of its own to compare against. */
  ttlMs: 90 * 1000,
  /** Max OTP sends for the same phone+purpose within `sendWindowMs`. */
  maxSendsPerWindow: 3,
  sendWindowMs: 10 * 60 * 1000,
  /** Failed verify attempts allowed before locking the phone+purpose out. */
  maxVerifyAttempts: 5,
  lockoutDurationMs: 15 * 60 * 1000,
  /** Registration/reset-password temporary token lifetime (docs/OTP_FLOW.md section 5). */
  tempTokenTtl: '10m',
} as const;
