import type { NextRequest } from 'next/server';
import { createServiceRoleClient } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { buildGoogleAuthorizationUrl, createOAuthState, hashOAuthState } from '@/lib/google-analytics/oauth';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  if (caller.role !== 'owner' && caller.role !== 'admin') throw new ApiError(403, 'forbidden', 'ليس لديك صلاحية لإدارة التطبيقات');

  const { data: integration, error } = await supabase
    .from('tenant_integrations')
    .select('measurement_id')
    .eq('tenant_id', caller.tenantId)
    .eq('provider', 'google_analytics')
    .maybeSingle();
  if (error) throw new Error(`Failed to load Google Analytics integration: ${error.message}`);
  if (!integration?.measurement_id) throw new ApiError(409, 'measurement_id_required', 'احفظ معرّف القياس أولًا');

  const state = createOAuthState();
  const serviceRole = createServiceRoleClient();
  const { error: stateError } = await serviceRole.from('google_analytics_oauth_states').insert({
    state_hash: hashOAuthState(state),
    tenant_id: caller.tenantId,
    user_id: caller.userId,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });
  if (stateError) throw new Error(`Failed to create Google OAuth state: ${stateError.message}`);

  return okResponse({ authorization_url: buildGoogleAuthorizationUrl(state) });
});
