import type { NextRequest } from 'next/server';
import { LEAD_SOURCES, type LeadSource } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

/**
 * Every query here runs on the caller's own RLS-scoped client (never
 * service role) — an Agent automatically gets counts scoped to their own
 * assigned rows for free, with zero role branching needed for
 * properties/leads (PRODUCT_SPEC section 4/8's row-level restriction).
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  const nowIso = new Date().toISOString();

  const [
    { count: propertiesTotal, error: propertiesTotalError },
    { count: propertiesPublished, error: propertiesPublishedError },
    { count: leadsTotal, error: leadsTotalError },
    { count: overdueFollowUps, error: overdueFollowUpsError },
    leadsBySourceResults,
    propertyViewsResult,
  ] = await Promise.all([
    supabase.from('properties').select('id', { count: 'exact', head: true }),
    supabase.from('properties').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('leads').select('id', { count: 'exact', head: true }),
    // "Overdue follow-up" — the same actionable condition the daily
    // digest job (task 41/42) will alert on, surfaced here live.
    supabase.from('leads').select('id', { count: 'exact', head: true }).lt('follow_up_at', nowIso).not('status', 'in', '(won,lost)'),
    Promise.all(LEAD_SOURCES.map((source) => supabase.from('leads').select('id', { count: 'exact', head: true }).eq('source', source))),
    // property_views has no select policy at all for Agent (migration
    // 0005) — represent that as "not applicable" rather than a
    // misleading 0 from an RLS-filtered-to-empty query.
    caller.role === 'agent' ? Promise.resolve(null) : supabase.from('property_views').select('id', { count: 'exact', head: true }),
  ]);

  const firstError = [propertiesTotalError, propertiesPublishedError, leadsTotalError, overdueFollowUpsError, propertyViewsResult?.error].find(
    (error) => error,
  );
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

  return okResponse({
    properties: { total: propertiesTotal ?? 0, published: propertiesPublished ?? 0 },
    leads: { total: leadsTotal ?? 0, overdue_follow_ups: overdueFollowUps ?? 0, by_source: leadsBySource },
    property_views: propertyViewsResult ? { total: propertyViewsResult.count ?? 0 } : null,
  });
});
