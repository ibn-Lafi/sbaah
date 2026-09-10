import type { NextRequest } from 'next/server';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getPlatformAdminClient } from '@/lib/auth/get-platform-admin-client';

/**
 * console-only read of ALL themes (active and inactive) for the متجر
 * الثيمات management screen — unlike GET /v1/public/themes (which filters
 * to `is_active` for the gallery a tenant picks from), the platform owner
 * needs to see and re-enable a disabled theme too. No POST here: themes
 * are code-defined (a component set in public-site's theme registry) and
 * shipped via migration, never created from a console form — see
 * docs/THEMES.md.
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await getPlatformAdminClient(request);
  const { data, error } = await supabase.from('themes').select('*').order('order_index', { ascending: true });
  if (error) {
    throw new Error(`Failed to list themes: ${error.message}`);
  }
  return okResponse({ themes: data });
});
