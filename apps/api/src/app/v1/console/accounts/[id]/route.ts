import { consoleAccountUpdateSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getPlatformAdminClient } from '@/lib/auth/get-platform-admin-client';
import { dnsRecordFor } from '@/lib/tenant/dns-record';

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

  // task 40/42 — console's review screen needs the exact same expected
  // CNAME record the owner was shown, to compare against the domain's
  // actual DNS before approving it.
  return okResponse({ account: data, dns_record: data.custom_domain ? dnsRecordFor(data.custom_domain) : null });
});

/**
 * status (activate/suspend/cancel), plan_id (billing), and — task 40/42 —
 * custom_domain_status/clear_custom_domain (approve/reject a pending
 * custom-domain request) — the levers PRODUCT_SPEC sections 8 and
 * 4.3/15 name for console's account management.
 */
export const PATCH = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = await getPlatformAdminClient(request);
  const { clear_custom_domain, ...input } = consoleAccountUpdateSchema.parse(await request.json());

  // Rejecting a request clears both columns together — the DB check
  // constraint requires custom_domain/custom_domain_status to be
  // both-null or both-set, so they can never be updated independently.
  const updatePayload: Record<string, unknown> = { ...input };
  if (clear_custom_domain) {
    updatePayload.custom_domain = null;
    updatePayload.custom_domain_status = null;
  }

  const { data, error } = await supabase.from('tenants').update(updatePayload).eq('id', id).select('*').maybeSingle();
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
