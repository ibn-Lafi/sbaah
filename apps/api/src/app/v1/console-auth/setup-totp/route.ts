import type { NextRequest } from 'next/server';
import { createServiceRoleClient, consoleSetupTotpSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { verifyConsoleTotpToken, signConsoleTotpToken } from '@/lib/console-auth/totp-token';
import { generateTotpSecret, buildTotpUri } from '@/lib/console-auth/totp';

/**
 * First-ever login only (task 37/42) — the secret is generated here but
 * never written to the database yet; it only becomes real once
 * confirm-totp verifies the admin actually captured it in an
 * authenticator app. Re-checks `totp_enabled` (not just the challenge
 * token's validity): if it's already true, someone who only has the
 * password must not be able to re-enroll a device and silently replace
 * the legitimate owner's 2FA.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { challenge_token } = consoleSetupTotpSchema.parse(await request.json());

  let payload;
  try {
    payload = await verifyConsoleTotpToken(challenge_token);
  } catch {
    throw new ApiError(401, 'invalid_challenge_token', 'انتهت صلاحية الجلسة، ابدأ تسجيل الدخول من جديد');
  }
  if (payload.purpose !== 'challenge') {
    throw new ApiError(401, 'invalid_challenge_token', 'انتهت صلاحية الجلسة، ابدأ تسجيل الدخول من جديد');
  }

  const serviceRole = createServiceRoleClient();
  const { data: admin, error: adminError } = await serviceRole
    .from('platform_admins')
    .select('id, phone, totp_enabled')
    .eq('id', payload.platformAdminId)
    .single();
  if (adminError || !admin) {
    throw new Error(`Failed to load platform admin for TOTP setup: ${adminError?.message}`);
  }
  if (admin.totp_enabled) {
    throw new ApiError(409, 'totp_already_enabled', 'المصادقة الثنائية مفعّلة بالفعل على هذا الحساب');
  }

  const secret = generateTotpSecret();
  const setup_token = await signConsoleTotpToken({
    purpose: 'setup',
    platformAdminId: payload.platformAdminId,
    authUserId: payload.authUserId,
    secret,
  });

  return okResponse({ setup_token, secret, otpauth_uri: buildTotpUri(secret, admin.phone) });
});
