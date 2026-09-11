import type { NextRequest } from 'next/server';
import { accountTypeUpdateSchema } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertOwner } from '@/lib/auth/assert-owner';

const TENANT_COLUMNS = 'id, name_ar, name_en, account_type, cr_number, tax_number, fal_license_number';

/**
 * حسابي (Settings) — تبديل نوع الحساب (فرد ↔ مؤسسة ↔ شركة) بعد التسجيل.
 * Owner-only (نفس تقييد الدومين/الفوترة). رخصة فال لا تُمس هنا — مطلوبة
 * دائمًا بغض النظر عن النوع، وموجودة أصلًا. قيد قاعدة البيانات
 * `tenants_org_fields_required` (migration 0001) يفرض تناسق
 * account_type/cr_number/tax_number كطبقة حماية إضافية إذا لم تُرسَل
 * القيم الصحيحة هنا.
 */
export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertOwner(caller.role);

  const input = accountTypeUpdateSchema.parse(await request.json());

  const update =
    input.account_type === 'individual'
      ? {
          account_type: 'individual' as const,
          name_ar: input.full_name,
          name_en: input.full_name,
          cr_number: null,
          tax_number: null,
        }
      : {
          account_type: input.account_type,
          name_ar: input.name_ar,
          name_en: input.name_ar,
          cr_number: input.cr_number,
          tax_number: input.tax_number,
        };

  const { data, error } = await supabase
    .from('tenants')
    .update(update)
    .eq('id', caller.tenantId)
    .select(TENANT_COLUMNS)
    .single();
  if (error || !data) {
    throw new Error(`Failed to update account type: ${error?.message}`);
  }

  return okResponse(data);
});
