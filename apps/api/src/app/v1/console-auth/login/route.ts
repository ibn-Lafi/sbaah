import type { NextRequest } from 'next/server';
import { createAnonClient, createServiceRoleClient, consoleLoginSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';

/**
 * Console login (task 37/42, revised — single factor, no TOTP). Unlike
 * the old two-step flow, `signInWithPassword` itself already returns a
 * real, usable session — no need for the magic-link `mintSessionForUser`
 * dance the TOTP flow used to defer session issuance to a second step.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { email, password } = consoleLoginSchema.parse(await request.json());

  const anon = createAnonClient();
  const { data: signInData, error: signInError } = await anon.auth.signInWithPassword({ email, password });
  // Deliberately identical error for "wrong password" and "not a
  // platform admin" below — this endpoint must never let a caller
  // distinguish "this email/password is a valid customer account" from
  // "this email/password is a valid admin account" from "neither".
  if (signInError || !signInData?.user || !signInData.session) {
    throw new ApiError(401, 'invalid_credentials', 'بيانات الدخول غير صحيحة');
  }

  const serviceRole = createServiceRoleClient();
  const { data: admin, error: adminError } = await serviceRole
    .from('platform_admins')
    .select('id')
    .eq('auth_user_id', signInData.user.id)
    .maybeSingle();
  if (adminError) {
    throw new Error(`Failed to check platform admin membership: ${adminError.message}`);
  }
  if (!admin) {
    throw new ApiError(401, 'invalid_credentials', 'بيانات الدخول غير صحيحة');
  }

  const { access_token, refresh_token, expires_at } = signInData.session;
  return okResponse({ access_token, refresh_token, expires_at });
});
