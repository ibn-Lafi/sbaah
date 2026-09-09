/** docs/OTP_FLOW.md section 6 — every number here is our own control, independent of Authentica's internal limits. */
export const OTP_CONFIG = {
  /**
   * Code validity window we enforce ourselves — Authentica documents no
   * expiry of its own to compare against. Was 90s; real-world reports
   * (SMS delivery lag + the send request's own round-trip to Authentica,
   * which has no client-side timeout to bound it — see authentica/client.ts)
   * routinely ate into that before the customer could even read the code,
   * showing "no active code" on a code that was never actually theirs to
   * use in time. 5 minutes matches common SMS-OTP UX elsewhere.
   */
  ttlMs: 5 * 60 * 1000,
  /** Max OTP sends for the same phone+purpose within `sendWindowMs`. */
  maxSendsPerWindow: 3,
  sendWindowMs: 10 * 60 * 1000,
  /** Failed verify attempts allowed before locking the phone+purpose out. */
  maxVerifyAttempts: 5,
  lockoutDurationMs: 15 * 60 * 1000,
  /** Registration/reset-password temporary token lifetime (docs/OTP_FLOW.md section 5). */
  tempTokenTtl: '10m',
} as const;
