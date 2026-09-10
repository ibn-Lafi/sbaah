import type { Plan } from '@sbaah/shared';
import { apiGet, apiPost } from './client';

export interface BillingInfo {
  plan: Plan;
  usage: {
    properties: number;
    users: number;
  };
}

export function getBilling(accessToken: string) {
  return apiGet<BillingInfo>('/tenant/billing', accessToken);
}

/** Creates a StreamPay payment link for the tenant's current plan and returns its checkout URL — used at registration step 6 and from /billing to (re)pay. */
export function startCheckout(accessToken: string) {
  return apiPost<{ checkout_url: string }>('/billing/checkout', undefined, accessToken);
}
