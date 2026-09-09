import type { NextRequest } from 'next/server';
import { createServiceRoleClient, consoleVerifyTotpSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { verifyConsoleTotpToken } from '@/lib/console-auth/totp-token';
import { verifyTotpCode } from '@/lib/console-auth/totp';
import { mintSessionForUser } from '@/lib/auth/mint-session';

/** Step 2 of console login for an admin who already has 2FA set up — the only place a real console session gets minted for a returning admin. */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { challenge_token, code } = consoleVerifyTotpSchema.parse(await request.json());

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
    .select('totp_secret, totp_enabled')
    .eq('id', payload.platformAdminId)
    .single();
  if (adminError || !admin) {
    throw new Error(`Failed to load platform admin for TOTP verify: ${adminError?.message}`);
  }
  if (!admin.totp_enabled || !admin.totp_secret) {
    throw new ApiError(409, 'totp_not_enabled', 'المصادقة الثنائية غير مفعّلة على هذا الحساب');
  }

  if (!verifyTotpCode(code, admin.totp_secret)) {
    throw new ApiError(401, 'totp_incorrect', 'رمز التحقق غير صحيح');
  }

  const session = await mintSessionForUser(serviceRole, payload.authUserId);
  return okResponse({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
  });
});
