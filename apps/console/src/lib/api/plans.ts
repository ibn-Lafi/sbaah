import type { Plan, PlanInput, PlanUpdateInput } from '@sbaah/shared';
import { apiDelete, apiGet, apiPatch, apiPost } from './client';

export function listPlans(accessToken: string) {
  return apiGet<{ plans: Plan[] }>('/console/plans', accessToken);
}

export function createPlan(accessToken: string, input: PlanInput) {
  return apiPost<{ plan: Plan }>('/console/plans', input, accessToken);
}

export function updatePlan(accessToken: string, id: string, input: PlanUpdateInput) {
  return apiPatch<{ plan: Plan }>(`/console/plans/${id}`, input, accessToken);
}

export function deletePlan(accessToken: string, id: string) {
  return apiDelete<{ status: string }>(`/console/plans/${id}`, accessToken);
}
