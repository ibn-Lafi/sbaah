import type { NextRequest } from 'next/server';
import { createServiceRoleClient, consoleConfirmTotpSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { verifyConsoleTotpToken } from '@/lib/console-auth/totp-token';
import { verifyTotpCode } from '@/lib/console-auth/totp';
import { mintSessionForUser } from '@/lib/auth/mint-session';

/** Persists the secret only after the admin proves they captured it correctly — never before (setup-totp/route.ts never writes it). */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { setup_token, code } = consoleConfirmTotpSchema.parse(await request.json());

  let payload;
  try {
    payload = await verifyConsoleTotpToken(setup_token);
  } catch {
    throw new ApiError(401, 'invalid_setup_token', 'انتهت صلاحية إعداد المصادقة الثنائية، ابدأ من جديد');
  }
  if (payload.purpose !== 'setup') {
    throw new ApiError(401, 'invalid_setup_token', 'انتهت صلاحية إعداد المصادقة الثنائية، ابدأ من جديد');
  }

  if (!verifyTotpCode(code, payload.secret)) {
    throw new ApiError(401, 'totp_incorrect', 'رمز التحقق غير صحيح');
  }

  const serviceRole = createServiceRoleClient();
  const { error: updateError } = await serviceRole
    .from('platform_admins')
    .update({ totp_secret: payload.secret, totp_enabled: true })
    .eq('id', payload.platformAdminId);
  if (updateError) {
    throw new Error(`Failed to save TOTP secret: ${updateError.message}`);
  }

  const session = await mintSessionForUser(serviceRole, payload.authUserId);
  return okResponse({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
  });
});
