import type { NextRequest } from 'next/server';
import { platformSettingsUpdateSchema } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getPlatformAdminClient } from '@/lib/auth/get-platform-admin-client';

/**
 * console-only write side of platform_settings (سبعة's own social links —
 * TikTok/Instagram/X/email — shown on dashboard's auth panel). A public
 * read endpoint exists separately at GET /v1/public/platform-settings —
 * RLS already makes the row openly readable (platform_settings_public_select),
 * so gating reads here too would fight the table's own security design.
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await getPlatformAdminClient(request);
  const { data, error } = await supabase.from('platform_settings').select('*').eq('id', true).single();
  if (error || !data) {
    throw new Error(`Failed to load platform settings: ${error?.message}`);
  }
  return okResponse(data);
});

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await getPlatformAdminClient(request);
  const input = platformSettingsUpdateSchema.parse(await request.json());

  const { data, error } = await supabase.from('platform_settings').update(input).eq('id', true).select().single();
  if (error || !data) {
    throw new Error(`Failed to update platform settings: ${error?.message}`);
  }
  return okResponse(data);
});
