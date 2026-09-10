import type { LeadSource, LeadStatus } from '@sbaah/shared';
import { apiGet } from './client';

export interface LatestLead {
  id: string;
  full_name: string;
  source: LeadSource;
  status: LeadStatus;
  created_at: string;
}

export interface DashboardSummary {
  properties: { total: number; published: number; published_this_month: number };
  leads: {
    total: number;
    this_month: number;
    won: number;
    overdue_follow_ups: number;
    by_source: Record<LeadSource, number>;
    conversion_rate: number;
  };
  property_views: { total: number; daily: { date: string; count: number }[]; delta_pct: number | null } | null;
  latest_leads: LatestLead[];
}

export function getDashboardSummary(accessToken: string) {
  return apiGet<DashboardSummary>('/dashboard/summary', accessToken);
}
