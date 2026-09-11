import { z } from 'zod';
import { BILLING_CYCLES, TENANT_STATUSES } from '../types/enums';

/**
 * PATCH /v1/console/accounts/[id] — platform-owner-only. Deliberately
 * narrow to what PRODUCT_SPEC section 8 names as console's account
 * capability ("كل الحسابات، الفوترة، تفعيل/تعطيل"): activation status and
 * plan assignment (billing), not the tenant's own identity fields
 * (name/CR/tax number) — those stay the account owner's to manage.
 *
 * No `custom_domain_status` lever here — custom-domain verification is
 * fully self-service (founder's explicit decision, superseding the
 * earlier console-review design): POST /v1/tenant/domain/verify does a
 * real DNS check and flips the status itself, console never touches it.
 */
export const consoleAccountUpdateSchema = z
  .object({
    status: z.enum(TENANT_STATUSES).optional(),
    plan_id: z.string().uuid().optional(),
  })
  .refine((data) => data.status !== undefined || data.plan_id !== undefined, {
    message: 'يجب تحديد حقل واحد على الأقل للتحديث',
  });
export type ConsoleAccountUpdateInput = z.infer<typeof consoleAccountUpdateSchema>;

export const consoleAccountListQuerySchema = z.object({
  status: z.enum(TENANT_STATUSES).optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(50).default(20),
});
export type ConsoleAccountListQuery = z.infer<typeof consoleAccountListQuerySchema>;

/**
 * plans (PRODUCT_SPEC section 2/9) — price and limits are console-managed
 * data, never hardcoded. `intro_price`/`intro_months` (migration 0027)
 * are an optional discounted rate for a plan's first N billing cycles —
 * both null means no intro period (charged `price` from day one).
 */
const planFieldsSchema = z.object({
  name_ar: z.string().min(2, 'اسم الباقة (عربي) مطلوب'),
  name_en: z.string().min(2, 'اسم الباقة (إنجليزي) مطلوب'),
  billing_cycle: z.enum(BILLING_CYCLES),
  price: z.number().nonnegative('السعر يجب ألا يكون سالبًا'),
  intro_price: z.number().nonnegative('السعر التعريفي يجب ألا يكون سالبًا').nullable().optional(),
  intro_months: z
    .number()
    .int()
    .positive('عدد أشهر السعر التعريفي يجب أن يكون أكبر من صفر')
    .nullable()
    .optional(),
  /** Null = unlimited ("بلا حدود") — leave the field empty in console to mean no limit. */
  max_properties: z.number().int().positive('حد العقارات يجب أن يكون أكبر من صفر').nullable().optional(),
  max_users: z.number().int().positive('حد المستخدمين يجب أن يكون أكبر من صفر').nullable().optional(),
  custom_domain_allowed: z.boolean().default(false),
  is_active: z.boolean().default(true),
  /** From StreamPay's own dashboard (Products) — required before this plan can actually be checked out at registration. */
  streampay_product_id: z.string().trim().min(1).nullable().optional(),
  /** Short marketing line under the plan name on pricing cards — optional. */
  description_ar: z.string().trim().min(1).nullable().optional(),
});

const introPairMatches = (data: { intro_price?: number | null; intro_months?: number | null }) => {
  const hasIntroPrice = (data.intro_price ?? null) !== null;
  const hasIntroMonths = (data.intro_months ?? null) !== null;
  return hasIntroPrice === hasIntroMonths;
};

export const planInputSchema = planFieldsSchema.refine(introPairMatches, {
  message: 'السعر التعريفي وعدد أشهره يجب تحديدهما معًا أو تركهما فارغين',
  path: ['intro_months'],
});
export type PlanInput = z.infer<typeof planInputSchema>;

export const planUpdateSchema = planFieldsSchema.partial().refine(introPairMatches, {
  message: 'السعر التعريفي وعدد أشهره يجب تحديدهما معًا أو تركهما فارغين',
  path: ['intro_months'],
});
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

/**
 * themes (متجر الثيمات) — console manages only metadata for existing,
 * code-defined themes: display name, active/inactive, and gallery order.
 * No `key` here and deliberately no create/delete endpoint — a theme's
 * `key` and its component set are defined in code (public-site's theme
 * registry) and shipped via migration, never created from this form.
 */
export const themeUpdateSchema = z
  .object({
    name_ar: z.string().min(2, 'اسم الثيم (عربي) مطلوب').optional(),
    name_en: z.string().min(2, 'اسم الثيم (إنجليزي) مطلوب').optional(),
    is_active: z.boolean().optional(),
    order_index: z.number().int().nonnegative().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'يجب تحديد حقل واحد على الأقل للتحديث',
  });
export type ThemeUpdateInput = z.infer<typeof themeUpdateSchema>;

/** روابط حسابات سبعة (المنصة) الظاهرة في لوحة تسجيل الدخول/إنشاء حساب — منصّة فقط، ليست حسابات المستأجرين. */
const optionalUrl = () =>
  z
    .string()
    .trim()
    .url()
    .optional()
    .nullable()
    .or(z.literal('').transform(() => null));

export const platformSettingsUpdateSchema = z.object({
  social_tiktok: optionalUrl(),
  social_instagram: optionalUrl(),
  social_x: optionalUrl(),
  contact_email: z
    .string()
    .trim()
    .email('صيغة البريد الإلكتروني غير صحيحة')
    .optional()
    .nullable()
    .or(z.literal('').transform(() => null)),
});
export type PlatformSettingsUpdateInput = z.infer<typeof platformSettingsUpdateSchema>;
