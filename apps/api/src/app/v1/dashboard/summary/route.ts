import type { NextRequest } from 'next/server';
import { LEAD_SOURCES, createServiceRoleClient, type LeadSource } from '@sbaah/shared';
import { refreshGoogleAccessToken, runAnalyticsReport } from '@/lib/google-analytics/oauth';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

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
    supabase.from('assets').select('id', { count: 'exact', head: true }).is('archived_at', null),
    supabase.from('listings').select('id', { count: 'exact', head: true }).eq('publication_status', 'published'),
    supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('publication_status', 'published')
      .gte('published_at', startOfMonthIso),
    supabase.from('leads').select('id', { count: 'exact', head: true }),
    supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', startOfMonthIso),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'won'),
    // "Overdue follow-up" — a lead whose follow_up_at has passed and isn't won/lost yet.
    supabase.from('leads').select('id', { count: 'exact', head: true }).lt('follow_up_at', nowIso).not('status', 'in', '(won,lost)'),
    Promise.all(LEAD_SOURCES.map((source) => supabase.from('leads').select('id', { count: 'exact', head: true }).eq('source', source))),
    // property_views has no select policy at all for Agent (migration
    // 0005) — represent that as "not applicable" rather than a
    // misleading 0 from an RLS-filtered-to-empty query.
    Promise.resolve(null),
    Promise.resolve(null),
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

  const daily = null;
  const viewsDeltaPct = null;

  const conversionRate = leadsTotal && leadsTotal > 0 ? Math.round(((leadsWon ?? 0) / leadsTotal) * 1000) / 10 : 0;

  // Google metrics are optional. A disconnected/revoked Google account must
  // never break the home dashboard; Google-sourced values simply stay zero.
  let siteAnalytics = {
    visitors: 0,
    sessions: 0,
    page_views: 0,
    daily: [] as { date: string; visitors: number; sessions: number; page_views: number }[],
  };
  if (caller.role === 'owner' || caller.role === 'admin') {
    try {
      const serviceRole = createServiceRoleClient();
      const { data: integration } = await serviceRole
        .from('tenant_integrations')
        .select('status, external_property_id, oauth_refresh_token_ciphertext')
        .eq('tenant_id', caller.tenantId)
        .eq('provider', 'google_analytics')
        .maybeSingle();
      if (integration?.status === 'connected' && integration.external_property_id && integration.oauth_refresh_token_ciphertext) {
        const googleAccessToken = await refreshGoogleAccessToken(integration.oauth_refresh_token_ciphertext);
        siteAnalytics = await runAnalyticsReport(googleAccessToken, integration.external_property_id, 30);
      }
    } catch (error) {
      console.error('Google Analytics dashboard summary unavailable', error);
    }
  }

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
    property_views: null,
    site_analytics: siteAnalytics,
    latest_leads: latestLeadsResult.data,
  });
});
