import type { Plan, PlanInput, PlanUpdateInput } from '@sbaah/shared';
import { apiGet, apiPatch, apiPost } from './client';

export function listPlans(accessToken: string) {
  return apiGet<{ plans: Plan[] }>('/console/plans', accessToken);
}

export function createPlan(accessToken: string, input: PlanInput) {
  return apiPost<{ plan: Plan }>('/console/plans', input, accessToken);
}

export function updatePlan(accessToken: string, id: string, input: PlanUpdateInput) {
  return apiPatch<{ plan: Plan }>(`/console/plans/${id}`, input, accessToken);
}
