import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '@/lib/http';

/**
 * Throws a 403 unless the calling user has a `platform_admins` row, asked
 * of the database's own `is_platform_admin()` under the caller's JWT —
 * never by reading `users.role` (PRODUCT_SPEC section 8: "Admin" is a
 * tenant-scoped role, platform ownership is not). Reading the table would
 * not work: a platform admin can see every admin row, so a single-row read
 * fails as soon as there are two admins.
 */
export async function requirePlatformAdmin(supabase: SupabaseClient): Promise<void> {
  const { data, error } = await supabase.rpc('is_platform_admin');
  if (error) throw new Error(`Failed to check platform admin: ${error.message}`);
  if (data !== true) {
    throw new ApiError(403, 'not_platform_admin', 'هذا الإجراء متاح فقط لمالك المنصة');
  }
}
