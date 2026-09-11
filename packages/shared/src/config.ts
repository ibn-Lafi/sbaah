/**
 * Kill switch for new self-service registration. Was `false` while the
 * plan-selection + StreamPay checkout step (mandatory payment at the last
 * registration step) was being built, so the old no-payment flow
 * wouldn't keep creating unpaid accounts in the meantime — that flow is
 * now complete (6-step /register: phone, OTP, password, account type,
 * details, plan + checkout redirect) and billing's plan-switch/renewal
 * webhook bug is fixed, so this is back to `true`. Checked both by
 * `dashboard`'s /register page (UI) and `api`'s POST /v1/auth/register
 * (the real enforcement point — the UI check alone wouldn't stop a
 * direct API call).
 */
export const REGISTRATION_OPEN = true;
