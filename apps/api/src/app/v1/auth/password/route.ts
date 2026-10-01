import type { NextRequest } from 'next/server';
import { createAnonClient, createServiceRoleClient } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  const body = await request.json() as { current_password?: string; new_password?: string };
  const currentPassword = body.current_password ?? '';
  const newPassword = body.new_password ?? '';
  if (currentPassword.length < 8 || newPassword.length < 8) throw new ApiError(400, 'invalid_password', 'كلمة المرور يجب أن تكون 8 خانات على الأقل');
  if (currentPassword === newPassword) throw new ApiError(400, 'password_unchanged', 'كلمة المرور الجديدة يجب أن تختلف عن الحالية');
  const service = createServiceRoleClient();
  const { data: row, error } = await service.from('users').select('phone').eq('id', caller.userId).single();
  if (error || !row) throw new Error('Failed to load account for password change');
  const verifier = createAnonClient();
  const { error: verifyError } = await verifier.auth.signInWithPassword({ phone: row.phone, password: currentPassword });
  if (verifyError) throw new ApiError(400, 'invalid_current_password', 'كلمة المرور الحالية غير صحيحة');
  const { error: updateError } = await service.auth.admin.updateUserById(caller.authUserId, { password: newPassword });
  if (updateError) throw new Error('Failed to update password: ' + updateError.message);
  return okResponse({ status: 'ok' });
});
