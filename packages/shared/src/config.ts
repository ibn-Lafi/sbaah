/**
 * Temporary kill switch for new self-service registration — the founder
 * asked to pause new signups while the plan-selection + StreamPay
 * checkout step (mandatory payment at the last registration step) is
 * being built, so the old no-payment registration flow doesn't keep
 * creating unpaid accounts in the meantime. Checked both by `dashboard`'s
 * /register page (UI) and `api`'s POST /v1/auth/register (the real
 * enforcement point — the UI check alone wouldn't stop a direct API
 * call). Flip back to `true` once the paid flow ships.
 */
export const REGISTRATION_OPEN = false;
