import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@sbaah/shared';
import { ApiError, withErrorHandling } from '@/lib/http';
import { encryptRefreshToken, exchangeAuthorizationCode, hashOAuthState, resolveAnalyticsProperty } from '@/lib/google-analytics/oauth';

const MEASUREMENT_ID = 'G-FTKMLGPP6R';
function consoleUrl(status: string) {
  const base = process.env.CONSOLE_APP_URL;
  if (!base) throw new Error('Missing required environment variable: CONSOLE_APP_URL');
  const url = new URL('/', base); url.searchParams.set('google_analytics', status); return url;
}
export const GET = withErrorHandling(async (request: NextRequest) => {
  if (request.nextUrl.searchParams.get('error')) return NextResponse.redirect(consoleUrl('cancelled'));
  const state=request.nextUrl.searchParams.get('state'), code=request.nextUrl.searchParams.get('code');
  if (!state || !code) throw new ApiError(400,'invalid_oauth_callback','طلب الربط غير صالح');
  const serviceRole=createServiceRoleClient();
  const {data:row}=await serviceRole.from('platform_google_analytics_oauth_states').select('id,expires_at,consumed_at').eq('state_hash',hashOAuthState(state)).maybeSingle();
  if(!row||row.consumed_at||new Date(row.expires_at).getTime()<=Date.now()) throw new ApiError(400,'invalid_oauth_state','انتهت صلاحية طلب الربط أو تم استخدامه');
  const {data:consumed}=await serviceRole.from('platform_google_analytics_oauth_states').update({consumed_at:new Date().toISOString()}).eq('id',row.id).is('consumed_at',null).select('id').maybeSingle();
  if(!consumed) throw new ApiError(400,'invalid_oauth_state','تم استخدام طلب الربط مسبقًا');
  const tokens=await exchangeAuthorizationCode(code, process.env.GOOGLE_ANALYTICS_PLATFORM_REDIRECT_URI, process.env.GOOGLE_PLATFORM_CLIENT_ID, process.env.GOOGLE_PLATFORM_CLIENT_SECRET);
  const resolved=await resolveAnalyticsProperty(tokens.accessToken,MEASUREMENT_ID);
  const {data:existing}=await serviceRole.from('platform_google_analytics').select('oauth_refresh_token_ciphertext').eq('id',true).maybeSingle();
  const encrypted=tokens.refreshToken?encryptRefreshToken(tokens.refreshToken):existing?.oauth_refresh_token_ciphertext;
  if(!encrypted) throw new ApiError(409,'google_refresh_token_missing','أعد الربط لمنح وصول دائم');
  const {error}=await serviceRole.from('platform_google_analytics').upsert({id:true,measurement_id:MEASUREMENT_ID,external_property_id:resolved.propertyId,external_stream_id:resolved.streamId,oauth_refresh_token_ciphertext:encrypted,oauth_scopes:tokens.scopes,connected_at:new Date().toISOString(),updated_at:new Date().toISOString()});
  if(error) throw new Error(`Failed to save platform Google Analytics: ${error.message}`);
  return NextResponse.redirect(consoleUrl('connected'));
});
