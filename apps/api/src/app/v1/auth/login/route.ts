import type { NextRequest } from 'next/server';
import { createAnonClient, createServiceRoleClient, loginWithPasswordSchema } from '@sbaah/shared';
import { ApiError, extractClientIp, okResponse, withErrorHandling } from '@/lib/http';
import { accountDisabledError } from '@/lib/auth/get-caller-context';
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit/enforce-rate-limit';

const GENERIC_INVALID_CREDENTIALS = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';

/**
 * Password login by email. Phone+password never reaches this route — it
 * logs in directly from the browser against Supabase (docs/OTP_FLOW.md
 * section 5b), since `phone` really is what Supabase Auth uses as the
 * identifier there. Email can't work the same way: `auth.users.email` is
 * a synthetic, never-emailed address (OTP_FLOW.md section 4), not the
 * real optional `users.email` a person set from "حسابي" — so this route
 * resolves email → phone server-side (service role, since no user JWT
 * exists pre-login) and then performs the real `signInWithPassword` call
 * itself, returning the resulting session exactly like OTP login does.
 *
 * Deliberately generic on every failure (no email not found vs wrong
 * password) — unlike the OTP send routes, this is a fresh endpoint with
 * no existing behavior to preserve, so it's built to not reveal whether
 * a given email is registered at all.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = loginWithPasswordSchema.parse(await request.json());
  if (input.channel !== 'email') {
    throw new ApiError(400, 'unsupported_channel', 'الدخول برقم الجوال يتم مباشرة، لا عبر هذا المسار');
  }

  const serviceRole = createServiceRoleClient();
  await enforceRateLimit(serviceRole, RATE_LIMITS.passwordLoginPerIp, extractClientIp(request.headers));
  const { data: user, error: userError } = await serviceRole
    .from('users')
    .select('phone, status')
    .eq('email', input.email as string)
    .maybeSingle();
  if (userError) {
    throw new Error(`Failed to resolve email login: ${userError.message}`);
  }
  if (!user) {
    throw new ApiError(401, 'invalid_credentials', GENERIC_INVALID_CREDENTIALS);
  }

  const anon = createAnonClient();
  const { data, error } = await anon.auth.signInWithPassword({ phone: user.phone, password: input.password });
  if (error || !data.session) {
    throw new ApiError(401, 'invalid_credentials', GENERIC_INVALID_CREDENTIALS);
  }
  // Checked only after the password matched, so a disabled status is never
  // revealed to someone who does not know the account's password.
  if (user.status === 'disabled') {
    await serviceRole.auth.admin.signOut(data.session.access_token);
    throw accountDisabledError();
  }

  return okResponse({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
  });
});
