import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@sbaah/shared';
import { ApiError, withErrorHandling } from '@/lib/http';
import { encryptRefreshToken, exchangeAuthorizationCode, hashOAuthState, resolveAnalyticsProperty } from '@/lib/google-analytics/oauth';

function dashboardAppsUrl(params: Record<string, string>) {
  const base = process.env.DASHBOARD_APP_URL;
  if (!base) throw new Error('Missing required environment variable: DASHBOARD_APP_URL');
  const url = new URL('/apps', base);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url;
}

export const GET = withErrorHandling(async (request: NextRequest) => {
  const state = request.nextUrl.searchParams.get('state');
  const code = request.nextUrl.searchParams.get('code');
  const oauthError = request.nextUrl.searchParams.get('error');
  if (oauthError) return NextResponse.redirect(dashboardAppsUrl({ google_analytics: 'cancelled' }));
  if (!state || !code) throw new ApiError(400, 'invalid_oauth_callback', 'طلب الربط غير صالح');

  const serviceRole = createServiceRoleClient();
  const stateHash = hashOAuthState(state);
  const { data: stateRow, error: stateError } = await serviceRole
    .from('google_analytics_oauth_states')
    .select('id, tenant_id, user_id, expires_at, consumed_at')
    .eq('state_hash', stateHash)
    .maybeSingle();
  if (stateError || !stateRow || stateRow.consumed_at || new Date(stateRow.expires_at).getTime() <= Date.now()) {
    throw new ApiError(400, 'invalid_oauth_state', 'انتهت صلاحية طلب الربط أو تم استخدامه مسبقًا');
  }

  // Consume before any outbound call so the callback can never be replayed.
  const { data: consumed, error: consumeError } = await serviceRole
    .from('google_analytics_oauth_states')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', stateRow.id)
    .is('consumed_at', null)
    .select('id')
    .maybeSingle();
  if (consumeError || !consumed) throw new ApiError(400, 'invalid_oauth_state', 'تم استخدام طلب الربط مسبقًا');

  const { data: integration, error: integrationError } = await serviceRole
    .from('tenant_integrations')
    .select('measurement_id, oauth_refresh_token_ciphertext')
    .eq('tenant_id', stateRow.tenant_id)
    .eq('provider', 'google_analytics')
    .maybeSingle();
  if (integrationError || !integration?.measurement_id) throw new ApiError(409, 'integration_not_installed', 'تطبيق Google Analytics غير مثبت');

  const tokens = await exchangeAuthorizationCode(code);
  const resolved = await resolveAnalyticsProperty(tokens.accessToken, integration.measurement_id);
  const refreshCiphertext = tokens.refreshToken
    ? encryptRefreshToken(tokens.refreshToken)
    : integration.oauth_refresh_token_ciphertext;
  if (!refreshCiphertext) throw new ApiError(409, 'google_refresh_token_missing', 'لم يمنح Google رمز وصول دائم، أعد محاولة الربط');

  const { error: updateError } = await serviceRole
    .from('tenant_integrations')
    .update({
      status: 'connected',
      external_property_id: resolved.propertyId,
      external_stream_id: resolved.streamId,
      oauth_refresh_token_ciphertext: refreshCiphertext,
      oauth_scopes: tokens.scopes,
      connected_at: new Date().toISOString(),
    })
    .eq('tenant_id', stateRow.tenant_id)
    .eq('provider', 'google_analytics');
  if (updateError) throw new Error(`Failed to complete Google Analytics connection: ${updateError.message}`);

  return NextResponse.redirect(dashboardAppsUrl({ google_analytics: 'connected' }));
});
