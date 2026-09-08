import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '@/lib/http';

/**
 * Throws a 403 unless the calling user has a `platform_admins` row —
 * checked by letting RLS answer the question (the
 * `platform_admins_self_or_admin_select` policy in migration 0005
 * already restricts this table to a caller's own row), never by reading
 * `users.role` (PRODUCT_SPEC section 8: these are unrelated concepts —
 * "Admin" is a tenant-scoped role, platform ownership is not).
 */
export async function requirePlatformAdmin(supabase: SupabaseClient): Promise<void> {
  const { data, error } = await supabase.from('platform_admins').select('id').maybeSingle();
  if (error || !data) {
    throw new ApiError(403, 'not_platform_admin', 'هذا الإجراء متاح فقط لمالك المنصة');
  }
}
