import { z } from 'zod';

/**
 * Registration (migration 0047) only asks for account_type itself — the
 * فال license, CR number, tax number, and (for institution/company) the
 * entity's own name are no longer collected there at all; they're filled
 * in later from حسابي (falLicenseUpdateSchema below, and
 * accountTypeUpdateSchema's name/cr/tax fields). Until then the tenant's
 * public site simply doesn't publish (resolve_public_tenant, migration
 * 0047) — everything else about the account works normally.
 */
export const falLicenseNumberSchema = z
  .string()
  .min(1, 'رقم رخصة "فال" مطلوب');

/** حسابي — رخصة فال، مستقلة عن نوع الحساب (تنطبق على الأنواع الثلاثة كلها) ولا تُطلب إلا هنا، بعد التسجيل. */
export const falLicenseUpdateSchema = z.object({
  fal_license_number: falLicenseNumberSchema,
});
export type FalLicenseUpdateInput = z.infer<typeof falLicenseUpdateSchema>;

/**
 * حسابي (Settings) — تبديل نوع الحساب بعد التسجيل. لا يعيد طلب رخصة فال
 * (بطاقتها الخاصة أعلاه) ولا اسم مسؤول الحساب (ذلك اسم المستخدم نفسه،
 * لا يتغيّر بتبديل نوع الحساب) — فقط الحقول التي يحدّدها النوع فعليًا:
 * الاسم المعروض للحساب (فرد) أو اسم الجهة+السجل+الضريبي (مؤسسة/شركة).
 */
const organizationAccountTypeFields = {
  name_ar: z.string().min(2, 'اسم الجهة مطلوب'),
  cr_number: z.string().min(1, 'رقم السجل التجاري مطلوب'),
  tax_number: z.string().min(1, 'الرقم الضريبي مطلوب'),
};

export const individualAccountTypeUpdateSchema = z.object({
  account_type: z.literal('individual'),
  full_name: z.string().min(3, 'الاسم الثلاثي مطلوب'),
});

export const institutionAccountTypeUpdateSchema = z.object({
  account_type: z.literal('institution'),
  ...organizationAccountTypeFields,
});

export const companyAccountTypeUpdateSchema = z.object({
  account_type: z.literal('company'),
  ...organizationAccountTypeFields,
});

export const accountTypeUpdateSchema = z.discriminatedUnion('account_type', [
  individualAccountTypeUpdateSchema,
  institutionAccountTypeUpdateSchema,
  companyAccountTypeUpdateSchema,
]);

export type AccountTypeUpdateInput = z.infer<typeof accountTypeUpdateSchema>;

/** PRODUCT_SPEC section 4.3 — partially self-service custom domain. Bare hostname, no protocol/path. */
export const customDomainInputSchema = z.object({
  custom_domain: z
    .string()
    .min(3)
    .max(253)
    .regex(/^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i, 'صيغة الدومين غير صحيحة (مثال: example.com)'),
});
export type CustomDomainInput = z.infer<typeof customDomainInputSchema>;

/**
 * Owner-chosen subdomain (`{subdomain}.sbaah.com`) — same DNS-label
 * shape as `generateUniqueSubdomain()`'s auto-generated default
 * (apps/api/src/lib/tenant/subdomain.ts), which this schema deliberately
 * mirrors so a user-entered value is never stricter or looser than what
 * registration itself would have produced. Reserved words block real
 * platform routes (the marketing homepage, other services' own
 * subdomains if they were ever exposed under this root domain) from
 * being claimed by a tenant.
 */
const RESERVED_SUBDOMAINS = new Set([
  'www', 'api', 'console', 'dashboard', 'admin', 'app', 'mail', 'ftp',
  'ns1', 'ns2', 'sbaah', 'support', 'help', 'docs', 'status', 'cdn', 'static', 'assets',
]);

export const subdomainInputSchema = z.object({
  subdomain: z
    .string()
    .min(3, 'النطاق الفرعي يجب أن يكون 3 أحرف على الأقل')
    .max(63, 'النطاق الفرعي طويل جدًا')
    .regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/, 'أحرف إنجليزية صغيرة وأرقام وشرطات فقط، بلا شرطة في البداية أو النهاية')
    .refine((value) => !RESERVED_SUBDOMAINS.has(value), 'هذا النطاق الفرعي محجوز، اختر غيره'),
});
export type SubdomainInput = z.infer<typeof subdomainInputSchema>;

/**
 * حسابي (Settings) — حسابات التواصل الاجتماعي. كل حقل رابط/رقم اختياري
 * ومستقل؛ الموقع العام يعرض فقط ما تمت تعبئته (لا قيمة افتراضية لأي حقل).
 */
const optionalTrimmedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => (value === '' ? null : value));

export const socialLinksUpdateSchema = z.object({
  social_instagram: optionalTrimmedString(200),
  social_tiktok: optionalTrimmedString(200),
  social_whatsapp: optionalTrimmedString(30),
  social_snapchat: optionalTrimmedString(200),
  social_phone: optionalTrimmedString(30),
});
export type SocialLinksUpdateInput = z.infer<typeof socialLinksUpdateSchema>;
