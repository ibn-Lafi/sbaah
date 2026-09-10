import { createAnonClient } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';

/**
 * Unauthenticated read of سبعة's own social links — RLS already makes
 * `platform_settings` openly readable (platform_settings_public_select,
 * migration 0026); used by dashboard's login/register/forgot-password
 * auth panel (AuthPanel) to render TikTok/Instagram/X/email icons.
 * Writes are console-only (/v1/console/platform-settings).
 */
export const GET = withErrorHandling(async () => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('platform_settings')
    .select('social_tiktok, social_instagram, social_x, contact_email')
    .eq('id', true)
    .single();
  if (error || !data) {
    throw new Error(`Failed to load platform settings: ${error?.message}`);
  }
  return okResponse(data);
});
