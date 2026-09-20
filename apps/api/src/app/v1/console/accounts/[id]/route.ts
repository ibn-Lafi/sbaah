import { consoleAccountUpdateSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getPlatformAdminClient } from '@/lib/auth/get-platform-admin-client';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = await getPlatformAdminClient(request);

  const { data, error } = await supabase.from('tenants').select('*').eq('id', id).maybeSingle();
  if (error) {
    throw new Error(`Failed to load account: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'account_not_found', 'الحساب غير موجود');
  }

  const [properties, projects, leads, websites, users, tickets] = await Promise.all([
    supabase.from('assets').select('id', { count: 'exact', head: true }).eq('tenant_id', id).is('archived_at', null),
    supabase.from('projects').select('id', { count: 'exact', head: true }).eq('tenant_id', id),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('tenant_id', id),
    supabase.from('websites').select('id', { count: 'exact', head: true }).eq('tenant_id', id),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('tenant_id', id),
    supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('tenant_id', id),
  ]);
  const metrics = { properties: properties.count ?? 0, projects: projects.count ?? 0, leads: leads.count ?? 0, websites: websites.count ?? 0, users: users.count ?? 0, tickets: tickets.count ?? 0 };
  return okResponse({ account: data, metrics });
});

/**
 * status (activate/suspend/cancel) and plan_id (billing) — the levers
 * PRODUCT_SPEC section 8 names for console's account management.
 * Custom-domain verification is no longer one of them: it's fully
 * self-service now (POST /v1/tenant/domain/verify does a real DNS
 * check), so console has no lever over `custom_domain_status` at all.
 */
export const PATCH = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = await getPlatformAdminClient(request);
  const input = consoleAccountUpdateSchema.parse(await request.json());

  const { data, error } = await supabase.from('tenants').update(input).eq('id', id).select('*').maybeSingle();
  if (error) {
    // plan_id references plans(id) — a plan id that doesn't exist fails the FK, not a raw 500.
    if (error.code === '23503') {
      throw new ApiError(400, 'invalid_plan', 'الباقة المحددة غير موجودة');
    }
    throw new Error(`Failed to update account: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'account_not_found', 'الحساب غير موجود');
  }

  return okResponse({ account: data });
});
