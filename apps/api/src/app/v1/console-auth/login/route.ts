import type { NextRequest } from 'next/server';
import { createAnonClient, createServiceRoleClient, consoleLoginSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { signConsoleTotpToken } from '@/lib/console-auth/totp-token';

/**
 * Step 1 of console login (task 37/42) — first factor only. A success
 * here NEVER returns a usable Supabase session: `signInWithPassword`
 * below does mint one internally, but it's discarded — only a
 * short-lived challenge/setup token goes back to the client. The real
 * session is only minted after the second factor (TOTP) also passes,
 * in verify-totp/confirm-totp.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { phone, password } = consoleLoginSchema.parse(await request.json());

  const anon = createAnonClient();
  const { data: signInData, error: signInError } = await anon.auth.signInWithPassword({ phone, password });
  // Deliberately identical error for "wrong password" and "not a
  // platform admin" below — this endpoint must never let a caller
  // distinguish "this phone/password is a valid customer account" from
  // "this phone/password is a valid admin account" from "neither".
  if (signInError || !signInData?.user) {
    throw new ApiError(401, 'invalid_credentials', 'بيانات الدخول غير صحيحة');
  }
  const authUserId = signInData.user.id;

  const serviceRole = createServiceRoleClient();
  const { data: admin, error: adminError } = await serviceRole
    .from('platform_admins')
    .select('id, totp_enabled')
    .eq('auth_user_id', authUserId)
    .maybeSingle();
  if (adminError) {
    throw new Error(`Failed to check platform admin membership: ${adminError.message}`);
  }
  if (!admin) {
    throw new ApiError(401, 'invalid_credentials', 'بيانات الدخول غير صحيحة');
  }

  const challenge_token = await signConsoleTotpToken({
    purpose: 'challenge',
    platformAdminId: admin.id,
    authUserId,
  });

  return okResponse({ challenge_token, totp_enabled: admin.totp_enabled });
});
