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

  return okResponse({ account: data });
});

/** status (activate/suspend/cancel) and plan_id (billing) — the two levers PRODUCT_SPEC section 8 names for console's account management. */
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
