import type { NextRequest } from 'next/server';
import { LEAD_SOURCES, type LeadSource } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { bucketViewsByDay } from '@/lib/dashboard/bucket-views-by-day';

const VIEWS_CHART_DAYS = 30;

/**
 * Every query here runs on the caller's own RLS-scoped client (never
 * service role) — an Agent automatically gets counts scoped to their own
 * assigned rows for free, with zero role branching needed for
 * properties/leads (PRODUCT_SPEC section 4/8's row-level restriction).
 *
 * Extended (متجر التصميم follow-up — dashboard home page rebuild) with
 * what the founder's mockup's KPI deltas / views chart / latest-leads
 * preview need. No `published_at`/status-history column exists, so
 * "published this month" is approximated as "published AND created this
 * month" — an honest approximation, not exact history, documented here
 * rather than silently presented as more precise than it is.
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  const now = new Date();
  const nowIso = now.toISOString();
  const startOfMonthIso = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const chartStartIso = new Date(now.getTime() - VIEWS_CHART_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: propertiesTotal, error: propertiesTotalError },
    { count: propertiesPublished, error: propertiesPublishedError },
    { count: propertiesPublishedThisMonth, error: propertiesPublishedThisMonthError },
    { count: leadsTotal, error: leadsTotalError },
    { count: leadsThisMonth, error: leadsThisMonthError },
    { count: leadsWon, error: leadsWonError },
    { count: overdueFollowUps, error: overdueFollowUpsError },
    leadsBySourceResults,
    propertyViewsResult,
    viewsChartResult,
    latestLeadsResult,
  ] = await Promise.all([
    supabase.from('properties').select('id', { count: 'exact', head: true }),
    supabase.from('properties').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('created_at', startOfMonthIso),
    supabase.from('leads').select('id', { count: 'exact', head: true }),
    supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', startOfMonthIso),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'won'),
    // "Overdue follow-up" — the same actionable condition the daily
    // digest job (task 41/42) will alert on, surfaced here live.
    supabase.from('leads').select('id', { count: 'exact', head: true }).lt('follow_up_at', nowIso).not('status', 'in', '(won,lost)'),
    Promise.all(LEAD_SOURCES.map((source) => supabase.from('leads').select('id', { count: 'exact', head: true }).eq('source', source))),
    // property_views has no select policy at all for Agent (migration
    // 0005) — represent that as "not applicable" rather than a
    // misleading 0 from an RLS-filtered-to-empty query.
    caller.role === 'agent' ? Promise.resolve(null) : supabase.from('property_views').select('id', { count: 'exact', head: true }),
    caller.role === 'agent'
      ? Promise.resolve(null)
      : supabase.from('property_views').select('created_at').gte('created_at', chartStartIso),
    supabase.from('leads').select('id, full_name, source, status, created_at').order('created_at', { ascending: false }).limit(5),
  ]);

  const firstError = [
    propertiesTotalError,
    propertiesPublishedError,
    propertiesPublishedThisMonthError,
    leadsTotalError,
    leadsThisMonthError,
    leadsWonError,
    overdueFollowUpsError,
    propertyViewsResult?.error,
    viewsChartResult?.error,
    latestLeadsResult.error,
  ].find((error) => error);
  if (firstError) {
    throw new Error(`Failed to load dashboard summary: ${firstError.message}`);
  }
  const sourceError = leadsBySourceResults.find((result) => result.error);
  if (sourceError?.error) {
    throw new Error(`Failed to load dashboard summary: ${sourceError.error.message}`);
  }

  const leadsBySource = Object.fromEntries(
    LEAD_SOURCES.map((source, index) => [source, leadsBySourceResults[index]?.count ?? 0]),
  ) as Record<LeadSource, number>;

  const daily = viewsChartResult ? bucketViewsByDay(viewsChartResult.data ?? [], VIEWS_CHART_DAYS, now) : null;
  const last7Total = daily ? daily.slice(-7).reduce((sum, d) => sum + d.count, 0) : null;
  const prev7Total = daily ? daily.slice(-14, -7).reduce((sum, d) => sum + d.count, 0) : null;
  const viewsDeltaPct = last7Total !== null && prev7Total !== null && prev7Total > 0 ? Math.round(((last7Total - prev7Total) / prev7Total) * 100) : null;

  const conversionRate = leadsTotal && leadsTotal > 0 ? Math.round(((leadsWon ?? 0) / leadsTotal) * 1000) / 10 : 0;

  return okResponse({
    properties: {
      total: propertiesTotal ?? 0,
      published: propertiesPublished ?? 0,
      published_this_month: propertiesPublishedThisMonth ?? 0,
    },
    leads: {
      total: leadsTotal ?? 0,
      this_month: leadsThisMonth ?? 0,
      won: leadsWon ?? 0,
      overdue_follow_ups: overdueFollowUps ?? 0,
      by_source: leadsBySource,
      conversion_rate: conversionRate,
    },
    property_views: propertyViewsResult
      ? { total: propertyViewsResult.count ?? 0, daily, delta_pct: viewsDeltaPct }
      : null,
    latest_leads: latestLeadsResult.data,
  });
});
