import type { NextRequest } from 'next/server';
import { createServiceRoleClient, resetPasswordSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { verifyTempToken } from '@/lib/auth/temp-token';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { reset_token, new_password } = resetPasswordSchema.parse(await request.json());

  let payload;
  try {
    payload = await verifyTempToken(reset_token);
  } catch {
    throw new ApiError(401, 'invalid_reset_token', 'رابط إعادة التعيين غير صالح أو منتهي، اطلب رمزًا جديدًا');
  }
  if (payload.purpose !== 'reset_password') {
    throw new ApiError(401, 'invalid_reset_token', 'رابط إعادة التعيين غير صالح أو منتهي، اطلب رمزًا جديدًا');
  }

  const supabase = createServiceRoleClient();
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('auth_user_id')
    .eq('phone', payload.phone)
    .single();
  if (userError || !user) {
    throw new Error(`Failed to load user for password reset: ${userError?.message}`);
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(user.auth_user_id, {
    password: new_password,
  });
  if (updateError) {
    throw new Error(`Failed to update password: ${updateError.message}`);
  }

  return okResponse({ status: 'ok' });
});
