import type { NextRequest } from 'next/server';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getPlatformAdminClient } from '@/lib/auth/get-platform-admin-client';

/**
 * `console`'s own guard/identity fetch — mirrors `dashboard`'s
 * `/v1/auth/me` (task 24/42). `getPlatformAdminClient` already throws
 * 401/403 for anyone without a `platform_admins` row, so a successful
 * response here is itself the authorization check the `(app)` layout
 * guard relies on. Filters by the caller's own `auth_user_id`
 * explicitly — `platform_admins_self_or_admin_select` (RLS) lets any
 * admin read *every* admin's row via `is_platform_admin()`, so a bare
 * `.single()` with no filter could return an arbitrary admin's row
 * once more than one exists, not necessarily the caller's own.
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await getPlatformAdminClient(request);

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    throw new ApiError(401, 'unauthenticated', 'الجلسة غير صالحة');
  }

  const { data: admin, error } = await supabase
    .from('platform_admins')
    .select('id, full_name, phone')
    .eq('auth_user_id', authData.user.id)
    .single();
  if (error || !admin) {
    throw new Error(`Failed to load current platform admin: ${error?.message}`);
  }

  return okResponse({ admin });
});
