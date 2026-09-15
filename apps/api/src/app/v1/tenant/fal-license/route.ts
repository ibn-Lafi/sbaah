import type { NextRequest } from 'next/server';
import { falLicenseUpdateSchema } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertOwner } from '@/lib/auth/assert-owner';

/**
 * حسابي — رخصة فال، منفصلة عن بطاقة "نوع الحساب" لأنها لا تتغيّر
 * بتبديل النوع (migration 0047: لم تعد تُطلب أثناء التسجيل، تُدخل هنا
 * أول مرة أو تُعدَّل لاحقًا). الحساب يعمل بكامل ميزاته بدونها — غيابها
 * يمنع فقط نشر الموقع العام (resolve_public_tenant، نفس الهجرة).
 */
export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertOwner(caller.role);

  const { fal_license_number } = falLicenseUpdateSchema.parse(await request.json());

  const { data, error } = await supabase
    .from('tenants')
    .update({ fal_license_number })
    .eq('id', caller.tenantId)
    .select('id, fal_license_number')
    .single();
  if (error || !data) {
    throw new Error(`Failed to update fal license number: ${error?.message}`);
  }

  return okResponse(data);
});
