import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceRoleClient, type UserRole } from '@sbaah/shared';
import { ApiError } from '@/lib/http';

export interface CallerContext {
  authUserId: string;
  userId: string;
  tenantId: string;
  role: UserRole;
}

export function accountDisabledError(): ApiError {
  return new ApiError(403, 'account_disabled', 'تم إيقاف حسابك في هذا الفريق، تواصل مع مالك الحساب');
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
    .select('id, tenant_id, role, status')
    .eq('auth_user_id', authData.user.id)
    .maybeSingle();
  if (userError) {
    throw new Error(`Failed to resolve caller membership: ${userError.message}`);
  }
  if (userRow?.status === 'disabled') {
    throw accountDisabledError();
  }
  if (!userRow) {
    // Migration 0105 hides a disabled member's own row from RLS, so tell
    // "removed from the team" apart from "never had a membership" here.
    const { data: membership } = await createServiceRoleClient()
      .from('users')
      .select('status')
      .eq('auth_user_id', authData.user.id)
      .maybeSingle();
    if (membership?.status === 'disabled') {
      throw accountDisabledError();
    }
    throw new ApiError(403, 'no_tenant_membership', 'الحساب غير مرتبط بأي حساب على المنصة');
  }

  return { authUserId: authData.user.id, userId: userRow.id, tenantId: userRow.tenant_id, role: userRow.role };
}
