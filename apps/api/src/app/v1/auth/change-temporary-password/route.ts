import type { NextRequest } from 'next/server';
import { createServiceRoleClient } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase, { allowPasswordChangeRequired: true });
  const body = await request.json() as { current_password?: string; new_password?: string };
  const currentPassword = body.current_password ?? '';
  const newPassword = body.new_password ?? '';
  if (currentPassword.length < 8 || newPassword.length < 8) {
    throw new ApiError(400, 'invalid_password', 'كلمة المرور يجب أن تكون 8 خانات على الأقل');
  }
  if (currentPassword === newPassword) {
    throw new ApiError(400, 'password_unchanged', 'كلمة المرور الجديدة يجب أن تختلف عن كلمة المرور المؤقتة');
  }

  const service = createServiceRoleClient();
  const { data: row, error: rowError } = await service
    .from('users')
    .select('phone, must_change_password')
    .eq('id', caller.userId)
    .single();
  if (rowError || !row) throw new Error(`Failed to load password-change state: ${rowError?.message}`);
  if (!row.must_change_password) {
    throw new ApiError(409, 'password_change_not_required', 'لا يوجد تغيير إلزامي لكلمة المرور على هذا الحساب');
  }

  const { error: verifyError } = await service.auth.signInWithPassword({ phone: row.phone, password: currentPassword });
  if (verifyError) throw new ApiError(400, 'invalid_current_password', 'كلمة المرور المؤقتة غير صحيحة');

  const { error: passwordError } = await service.auth.admin.updateUserById(caller.authUserId, { password: newPassword });
  if (passwordError) throw new Error(`Failed to update password: ${passwordError.message}`);

  const { error: clearError } = await service
    .from('users')
    .update({ must_change_password: false })
    .eq('id', caller.userId);
  if (clearError) throw new Error(`Password changed but state could not be cleared: ${clearError.message}`);

  return okResponse({ status: 'ok' });
});
