import type { NextRequest } from 'next/server';
import { getAuthenticatedClient } from './get-authenticated-client';
import { requirePlatformAdmin } from './require-platform-admin';

/** Every `console`-only endpoint (task 23/42) starts with this: 401 if unauthenticated, 403 if authenticated but not a platform admin. */
export async function getPlatformAdminClient(request: NextRequest) {
  const { supabase, accessToken } = getAuthenticatedClient(request);
  await requirePlatformAdmin(supabase);
  return { supabase, accessToken };
}
