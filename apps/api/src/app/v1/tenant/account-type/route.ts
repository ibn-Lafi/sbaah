import type { NextRequest } from 'next/server';
import { accountTypeSwitchSchema, organizationInfoUpdateSchema } from '@sbaah/shared';
import { okResponse, withErrorHandling, ApiError } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertOwner } from '@/lib/auth/assert-owner';

const TENANT_COLUMNS = 'id, name_ar, name_en, account_type, cr_number, tax_number, fal_license_number, freelance_document_number, wafi_license_number';

/**
 * حسابي (Settings) — نفس المسار يخدم طلبين مختلفين تمييزًا بوجود `name_ar`
 * بالجسم:
 * 1) تبديل نوع الحساب فقط (فرد↔مؤسسة↔شركة) — بلا لمس اسم/سجل/ضريبي؛
 *    التبديل إلى "فرد" يُصفّر السجل والضريبي (tenants_individual_no_org_fields،
 *    migration 0047)، وأي تبديل آخر يبقيهما كما هما.
 * 2) تعديل بيانات الجهة (اسم الموقع + السجل + الضريبي) لحساب مؤسسة/شركة
 *    قائم بالفعل — بطاقتها المستقلة بجانب رخصة فال، بلا تغيير النوع نفسه؛
 *    مرفوض إن كان نوع الحساب الحالي "فرد" (القيد لا يسمح بسجل/ضريبي هناك).
 * Owner-only في الحالتين (نفس تقييد الدومين/الفوترة). رخصة فال لا تُمس هنا إطلاقًا.
 */
export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertOwner(caller.role);

  const body = await request.json();
  const isOrganizationInfoUpdate = body && typeof body === 'object' && 'name_ar' in body;

  let update: Record<string, unknown>;
  if (isOrganizationInfoUpdate) {
    const input = organizationInfoUpdateSchema.parse(body);

    const { data: current, error: currentError } = await supabase
      .from('tenants')
      .select('account_type')
      .eq('id', caller.tenantId)
      .single();
    if (currentError || !current) {
      throw new Error(`Failed to read current account type: ${currentError?.message}`);
    }
    if (current.account_type !== input.account_type) {
      throw new ApiError(409, 'account_type_mismatch', 'نوع الحساب الحالي لا يطابق الطلب — أعد تحميل الصفحة وحاول مجددًا');
    }

    update =
      input.account_type === 'individual'
        ? {
            name_ar: input.name_ar,
            name_en: input.name_ar,
            fal_license_number: input.fal_license_number,
            freelance_document_number: input.freelance_document_number,
            cr_number: null,
            tax_number: null,
            wafi_license_number: null,
          }
        : {
            name_ar: input.name_ar,
            name_en: input.name_ar,
            cr_number: input.cr_number,
            tax_number: input.tax_number,
            fal_license_number: input.fal_license_number,
            wafi_license_number: input.wafi_license_number,
            freelance_document_number: null,
          };
  } else {
    const input = accountTypeSwitchSchema.parse(body);
    update =
      input.account_type === 'individual'
        ? { account_type: 'individual' as const, cr_number: null, tax_number: null, wafi_license_number: null }
        : { account_type: input.account_type, freelance_document_number: null };
  }

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
