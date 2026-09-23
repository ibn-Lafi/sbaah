import type { SupabaseClient } from '@supabase/supabase-js';

// GoTrue has no "forever"; a century is its conventional stand-in.
const BANNED_DURATION = '876000h';

/**
 * Supabase Auth itself must refuse a removed member: dashboard's
 * phone+password login and refresh-token renewal talk to Supabase directly,
 * never through this API. `supabase` must be a service-role client.
 */
export async function setAuthUserBanned(supabase: SupabaseClient, authUserId: string, banned: boolean): Promise<void> {
  const { error } = await supabase.auth.admin.updateUserById(authUserId, {
    ban_duration: banned ? BANNED_DURATION : 'none',
  });
  if (error) {
    throw new Error(`Failed to ${banned ? 'ban' : 'unban'} auth user: ${error.message}`);
  }
}
