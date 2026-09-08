import type { Plan } from '@sbaah/shared';
import { apiGet } from './client';

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
