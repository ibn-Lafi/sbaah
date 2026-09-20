import type { NextRequest } from 'next/server';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertPermission } from '@/lib/auth/permissions';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertPermission(caller.role, 'reports.read');

  const [
    assetsResult,
    projectsResult,
    leadsResult,
    viewingsResult,
    dealsResult,
    listingsResult,
  ] = await Promise.all([
    supabase.from('assets').select('id', { count: 'exact', head: true }).eq('tenant_id', caller.tenantId).is('archived_at', null),
    supabase.from('projects').select('id', { count: 'exact', head: true }).eq('tenant_id', caller.tenantId).neq('status', 'archived'),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('tenant_id', caller.tenantId),
    supabase.from('viewings').select('id', { count: 'exact', head: true }).eq('tenant_id', caller.tenantId),
    supabase.from('deals').select('id', { count: 'exact', head: true }).eq('tenant_id', caller.tenantId),
    supabase.from('listings').select('id', { count: 'exact', head: true }).eq('tenant_id', caller.tenantId).neq('publication_status', 'archived'),
  ]);

  const firstError = [assetsResult, projectsResult, leadsResult, viewingsResult, dealsResult, listingsResult]
    .map((result) => result.error)
    .find(Boolean);
  if (firstError) throw new Error(`Failed to load report summary: ${firstError.message}`);

  return okResponse({
    properties: assetsResult.count ?? 0,
    assets: assetsResult.count ?? 0,
    projects: projectsResult.count ?? 0,
    listings: listingsResult.count ?? 0,
    leads: leadsResult.count ?? 0,
    viewings: viewingsResult.count ?? 0,
    deals: dealsResult.count ?? 0,
  });
});
