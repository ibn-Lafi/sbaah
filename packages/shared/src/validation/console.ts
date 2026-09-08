import { z } from 'zod';
import { TENANT_STATUSES } from '../types/enums';

/**
 * PATCH /v1/console/accounts/[id] — platform-owner-only. Deliberately
 * narrow to what PRODUCT_SPEC section 8 names as console's account
 * capability ("كل الحسابات، الفوترة، تفعيل/تعطيل"): activation status and
 * plan assignment (billing), not the tenant's own identity fields
 * (name/CR/tax number) — those stay the account owner's to manage.
 */
export const consoleAccountUpdateSchema = z
  .object({
    status: z.enum(TENANT_STATUSES).optional(),
    plan_id: z.string().uuid().optional(),
  })
  .refine((data) => data.status !== undefined || data.plan_id !== undefined, {
    message: 'يجب تحديد حالة الحساب أو الباقة على الأقل',
  });
export type ConsoleAccountUpdateInput = z.infer<typeof consoleAccountUpdateSchema>;

export const consoleAccountListQuerySchema = z.object({
  status: z.enum(TENANT_STATUSES).optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(50).default(20),
});
export type ConsoleAccountListQuery = z.infer<typeof consoleAccountListQuerySchema>;

/** plans (PRODUCT_SPEC section 2/9) — price and limits are console-managed data, never hardcoded. */
export const planInputSchema = z.object({
  name_ar: z.string().min(2, 'اسم الباقة (عربي) مطلوب'),
  name_en: z.string().min(2, 'اسم الباقة (إنجليزي) مطلوب'),
  price: z.number().nonnegative('السعر يجب ألا يكون سالبًا'),
  max_properties: z.number().int().positive('حد العقارات يجب أن يكون أكبر من صفر'),
  max_users: z.number().int().positive('حد المستخدمين يجب أن يكون أكبر من صفر'),
  custom_domain_allowed: z.boolean().default(false),
  is_active: z.boolean().default(true),
});
export type PlanInput = z.infer<typeof planInputSchema>;

export const planUpdateSchema = planInputSchema.partial();
export type PlanUpdateInput = z.infer<typeof planUpdateSchema>;

export const cityInputSchema = z.object({
  name_ar: z.string().min(2, 'اسم المدينة (عربي) مطلوب'),
  name_en: z.string().min(2, 'اسم المدينة (إنجليزي) مطلوب'),
});
export type CityInput = z.infer<typeof cityInputSchema>;

export const cityUpdateSchema = cityInputSchema.partial();
export type CityUpdateInput = z.infer<typeof cityUpdateSchema>;

export const districtInputSchema = z.object({
  city_id: z.string().uuid('المدينة مطلوبة'),
  name_ar: z.string().min(2, 'اسم الحي (عربي) مطلوب'),
  name_en: z.string().min(2, 'اسم الحي (إنجليزي) مطلوب'),
});
export type DistrictInput = z.infer<typeof districtInputSchema>;

export const districtUpdateSchema = districtInputSchema.partial();
export type DistrictUpdateInput = z.infer<typeof districtUpdateSchema>;

export const districtListQuerySchema = z.object({
  city_id: z.string().uuid().optional(),
});
export type DistrictListQuery = z.infer<typeof districtListQuerySchema>;
