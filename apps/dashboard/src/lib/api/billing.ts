import type { PaymentStatus, Plan } from '@sbaah/shared';
import { apiGet, apiPost } from './client';

export interface BillingInfo {
  plan: Plan;
  payment_status: PaymentStatus;
  /** ISO timestamp, one billing-cycle interval after the last successful payment — null if the tenant has never had one (e.g. checkout still pending). A computed display value, not a real recurring-billing schedule. */
  next_renewal_at: string | null;
  usage: {
    properties: number;
    users: number;
  };
}

export function getBilling(accessToken: string) {
  return apiGet<BillingInfo>('/tenant/billing', accessToken);
}

/** Creates a StreamPay payment link and returns its checkout URL. Omit `planId` to re-pay the current plan (renewal); pass a different active plan's id to switch to it — used at registration step 6, and from /billing for both renewal and plan changes. */
export function startCheckout(accessToken: string, planId?: string) {
  return apiPost<{ checkout_url: string }>('/billing/checkout', planId ? { plan_id: planId } : {}, accessToken);
}
