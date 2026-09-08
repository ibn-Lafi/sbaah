import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserRole } from '@sbaah/shared';
import { ApiError } from '@/lib/http';

export interface CallerContext {
  authUserId: string;
  userId: string;
  tenantId: string;
  role: UserRole;
}

/**
 * Resolves the calling user's own tenant/role. RLS already restricts
 * which rows a query can *read*, but an INSERT payload has to supply the
 * right `tenant_id` itself — every tenant-scoped write endpoint needs
 * this first. `auth.getUser()` (not a manual JWT decode) is the
 * authoritative way to resolve the caller's own auth_user_id from their
 * bearer token.
 */
export async function getCallerContext(supabase: SupabaseClient): Promise<CallerContext> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    throw new ApiError(401, 'unauthenticated', 'الجلسة غير صالحة');
  }

  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('id, tenant_id, role')
    .eq('auth_user_id', authData.user.id)
    .single();
  if (userError || !userRow) {
    throw new ApiError(403, 'no_tenant_membership', 'الحساب غير مرتبط بأي حساب على المنصة');
  }

  return { authUserId: authData.user.id, userId: userRow.id, tenantId: userRow.tenant_id, role: userRow.role };
}
