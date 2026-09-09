import type { NextRequest } from 'next/server';
import { createAnonClient, createServiceRoleClient, consoleLoginSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { isLoginLocked, shouldLockAfterFailedLogin, computeLoginLockedUntil } from '@/lib/console-auth/login-lockout';

/**
 * Console login (task 37/42, revised — single factor, no TOTP). Unlike
 * the old two-step flow, `signInWithPassword` itself already returns a
 * real, usable session — no need for the magic-link `mintSessionForUser`
 * dance the TOTP flow used to defer session issuance to a second step.
 *
 * Brute-force lockout added task 42/42 — see login-lockout.ts's header
 * comment for why it's keyed by email BEFORE resolving to a real admin.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { email, password } = consoleLoginSchema.parse(await request.json());
  const serviceRole = createServiceRoleClient();

  const { data: attemptRow, error: attemptRowError } = await serviceRole
    .from('console_login_attempts')
    .select('attempt_count, locked_until')
    .eq('email', email)
    .maybeSingle();
  if (attemptRowError) {
    throw new Error(`Failed to check console login lockout: ${attemptRowError.message}`);
  }
  if (isLoginLocked(attemptRow?.locked_until ?? null)) {
    throw new ApiError(429, 'too_many_attempts', 'محاولات كثيرة خاطئة، حاول لاحقًا');
  }

  async function recordFailedAttempt() {
    const previousCount = attemptRow?.attempt_count ?? 0;
    await serviceRole.from('console_login_attempts').upsert({
      email,
      attempt_count: previousCount + 1,
      locked_until: shouldLockAfterFailedLogin(previousCount) ? computeLoginLockedUntil() : null,
      updated_at: new Date().toISOString(),
    });
  }

  const anon = createAnonClient();
  const { data: signInData, error: signInError } = await anon.auth.signInWithPassword({ email, password });
  // Deliberately identical error for "wrong password" and "not a
  // platform admin" below — this endpoint must never let a caller
  // distinguish "this email/password is a valid customer account" from
  // "this email/password is a valid admin account" from "neither".
  if (signInError || !signInData?.user || !signInData.session) {
    await recordFailedAttempt();
    throw new ApiError(401, 'invalid_credentials', 'بيانات الدخول غير صحيحة');
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
    await recordFailedAttempt();
    throw new ApiError(401, 'invalid_credentials', 'بيانات الدخول غير صحيحة');
  }

  if (attemptRow) {
    await serviceRole.from('console_login_attempts').delete().eq('email', email);
  }

  const { access_token, refresh_token, expires_at } = signInData.session;
  return okResponse({ access_token, refresh_token, expires_at });
});
