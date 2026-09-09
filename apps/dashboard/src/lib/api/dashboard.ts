import type { LeadSource } from '@sbaah/shared';
import { apiGet } from './client';

export interface DashboardSummary {
  properties: { total: number; published: number };
  leads: { total: number; overdue_follow_ups: number; by_source: Record<LeadSource, number> };
  property_views: { total: number } | null;
}

export function getDashboardSummary(accessToken: string) {
  return apiGet<DashboardSummary>('/dashboard/summary', accessToken);
}
