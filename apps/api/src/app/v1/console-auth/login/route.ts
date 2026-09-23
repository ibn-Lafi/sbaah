import type { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAnonClient, createServiceRoleClient, consoleLoginSchema } from '@sbaah/shared';
import { ApiError, extractClientIp, okResponse, withErrorHandling } from '@/lib/http';
import { isLoginLocked, shouldLockAfterFailedLogin, computeLoginLockedUntil } from '@/lib/console-auth/login-lockout';
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit/enforce-rate-limit';

const INVALID_CREDENTIALS = 'بيانات الدخول غير صحيحة';

function tooManyAttempts(): ApiError {
  return new ApiError(429, 'too_many_attempts', 'محاولات كثيرة خاطئة، حاول لاحقًا');
}

/**
 * Spends one attempt for `email` before the password is checked. The
 * compare-and-set on attempt_count (or the insert of a first row) means
 * parallel guesses cannot all read the same count and slip past the lockout.
 */
async function reserveLoginAttempt(serviceRole: SupabaseClient, email: string): Promise<void> {
  const { data: attemptRow, error } = await serviceRole
    .from('console_login_attempts')
    .select('attempt_count, locked_until')
    .eq('email', email)
    .maybeSingle();
  if (error) throw new Error(`Failed to check console login lockout: ${error.message}`);
  if (isLoginLocked(attemptRow?.locked_until ?? null)) throw tooManyAttempts();

  const previousCount = attemptRow?.attempt_count ?? 0;
  const next = {
    attempt_count: previousCount + 1,
    locked_until: shouldLockAfterFailedLogin(previousCount) ? computeLoginLockedUntil() : null,
    updated_at: new Date().toISOString(),
  };
  const { data: reserved, error: reserveError } = attemptRow
    ? await serviceRole
        .from('console_login_attempts')
        .update(next)
        .eq('email', email)
        .eq('attempt_count', previousCount)
        .select('email')
        .maybeSingle()
    : await serviceRole
        .from('console_login_attempts')
        .upsert({ email, ...next }, { onConflict: 'email', ignoreDuplicates: true })
        .select('email')
        .maybeSingle();
  if (reserveError) throw new Error(`Failed to record console login attempt: ${reserveError.message}`);
  if (!reserved) throw tooManyAttempts();
}

/**
 * Console login (task 37/42, revised — single factor, no TOTP). Unlike
 * the old two-step flow, `signInWithPassword` itself already returns a
 * real, usable session — no need for the magic-link `mintSessionForUser`
 * dance the TOTP flow used to defer session issuance to a second step.
 *
 * Brute-force lockout (task 42/42) is keyed by the email typed at login,
 * BEFORE resolving it to a real admin — see login-lockout.ts. Every
 * attempt counts until a successful login clears the counter.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { email, password } = consoleLoginSchema.parse(await request.json());
  const serviceRole = createServiceRoleClient();
  await enforceRateLimit(serviceRole, RATE_LIMITS.consoleLoginPerIp, extractClientIp(request.headers));
  await reserveLoginAttempt(serviceRole, email);

  const anon = createAnonClient();
  const { data: signInData, error: signInError } = await anon.auth.signInWithPassword({ email, password });
  // Deliberately identical error for "wrong password" and "not a
  // platform admin" below — this endpoint must never let a caller
  // distinguish "this email/password is a valid customer account" from
  // "this email/password is a valid admin account" from "neither".
  if (signInError || !signInData?.user || !signInData.session) {
    throw new ApiError(401, 'invalid_credentials', INVALID_CREDENTIALS);
  }

  const { data: admin, error: adminError } = await serviceRole
    .from('platform_admins')
    .select('id')
    .eq('auth_user_id', signInData.user.id)
    .maybeSingle();
  if (adminError) {
    throw new Error(`Failed to check platform admin membership: ${adminError.message}`);
  }
  if (!admin) {
    await serviceRole.auth.admin.signOut(signInData.session.access_token);
    throw new ApiError(401, 'invalid_credentials', INVALID_CREDENTIALS);
  }

  const { error: resetError } = await serviceRole.from('console_login_attempts').delete().eq('email', email);
  if (resetError) throw new Error(`Failed to reset console login attempts: ${resetError.message}`);

  const { access_token, refresh_token, expires_at } = signInData.session;
  return okResponse({ access_token, refresh_token, expires_at });
});
