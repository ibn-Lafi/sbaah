import type { NextRequest } from 'next/server';
import { createServiceRoleClient } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getPlatformAdminClient } from '@/lib/auth/get-platform-admin-client';
import { buildGoogleAuthorizationUrl, createOAuthState, hashOAuthState } from '@/lib/google-analytics/oauth';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await getPlatformAdminClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Platform admin user unavailable');
  const state = createOAuthState();
  const serviceRole = createServiceRoleClient();
  const { error } = await serviceRole.from('platform_google_analytics_oauth_states').insert({
    state_hash: hashOAuthState(state), user_id: user.id, expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });
  if (error) throw new Error(`Failed to create platform Google OAuth state: ${error.message}`);
  return okResponse({ authorization_url: buildGoogleAuthorizationUrl(state, process.env.GOOGLE_ANALYTICS_PLATFORM_REDIRECT_URI, process.env.GOOGLE_PLATFORM_CLIENT_ID) });
});
