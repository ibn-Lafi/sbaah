import { z } from 'zod';
import { BUSINESS_ACTIVITIES } from '../types/enums';

/**
 * Registration (migration 0047) only asks for account_type itself — the
 * فال license, CR number, tax number, and (for institution/company) the
 * entity's own name are no longer collected there at all; they're filled
 * in later from حسابي (falLicenseUpdateSchema below, and
 * organizationInfoUpdateSchema's name/cr/tax fields). Until then the
 * tenant's public site simply doesn't publish (resolve_public_tenant,
 * migration 0047) — everything else about the account works normally.
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
 * حسابي (Settings) — تبديل نوع الحساب بعد التسجيل: النوع فقط (فرد/مؤسسة/
 * شركة)، بلا أي حقل آخر معه في نفس الخطوة. اسم الجهة والسجل التجاري
 * والرقم الضريبي يُعدَّلان لاحقًا من بطاقة "بيانات الجهة" الخاصة بها
 * (organizationInfoUpdateSchema أدناه)، بجانب رخصة فال، فقط لحسابات
 * مؤسسة/شركة — لا تُطلب أبدًا لحساب فرد (tenants_individual_no_org_fields،
 * migration 0047).
 */
export const accountTypeSwitchSchema = z.object({
  account_type: z.enum(['individual', 'institution', 'company']),
});
export type AccountTypeSwitchInput = z.infer<typeof accountTypeSwitchSchema>;

/**
 * بطاقة "بيانات الجهة" — اسم الموقع (نفس اسم الحساب المعروض في بطاقة
 * "بيانات الحساب") + السجل التجاري + الرقم الضريبي، لحسابات مؤسسة/شركة
 * فقط. account_type مُعاد إرساله هنا (بلا تغييره فعليًا) لتحديد أي فرع من
 * القيدين ينطبق — الـAPI يرفض الطلب إن كان نوع الحساب الحالي "فرد".
 */
const optionalLicenseNumber = z.string().trim().max(100).optional().nullable().transform((value) => value === '' ? null : value);

export const organizationInfoUpdateSchema = z.union([
  z.object({
    account_type: z.literal('individual'),
    name_ar: z.string().min(2, 'اسم الجهة مطلوب'),
    fal_license_number: falLicenseNumberSchema,
    freelance_document_number: optionalLicenseNumber,
  }),
  z.object({
    account_type: z.enum(['institution', 'company']),
    name_ar: z.string().min(2, 'اسم الجهة مطلوب'),
    cr_number: z.string().min(1, 'رقم السجل التجاري مطلوب'),
    tax_number: z.string().min(1, 'الرقم الضريبي مطلوب'),
    fal_license_number: falLicenseNumberSchema,
    wafi_license_number: optionalLicenseNumber,
  }),
]);
export type OrganizationInfoUpdateInput = z.infer<typeof organizationInfoUpdateSchema>;

export type AccountTypeUpdateInput = AccountTypeSwitchInput | OrganizationInfoUpdateInput;

/**
 * PRODUCT_SPEC section 4.3 — partially self-service custom domain. Bare
 * hostname, no protocol/path. Normalized to lowercase here (the one place
 * this value ever enters the system) — domains are case-insensitive, but
 * without this a tenant typing `WWW.Example.COM` would have that exact
 * casing stored and later reused verbatim as a redirect target and in DNS
 * record instructions, which is sloppy even though it still resolves.
 */
export const customDomainInputSchema = z.object({
  custom_domain: z
    .string()
    .min(3)
    .max(253)
    .regex(/^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i, 'صيغة الدومين غير صحيحة (مثال: example.com)')
    .transform((value) => value.toLowerCase()),
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
  social_facebook: optionalTrimmedString(200),
  social_x: optionalTrimmedString(200),
  social_telegram: optionalTrimmedString(200),
});
export type SocialLinksUpdateInput = z.infer<typeof socialLinksUpdateSchema>;


/** حسابي — أنشطة العمل مستقلة عن نوع الكيان وعن صلاحيات الموظفين. */
export const businessActivitiesUpdateSchema = z.object({
  activities: z
    .array(z.enum(BUSINESS_ACTIVITIES))
    .min(1, 'اختر نشاطًا واحدًا على الأقل')
    .max(BUSINESS_ACTIVITIES.length)
    .refine((activities) => new Set(activities).size === activities.length, 'لا يمكن تكرار النشاط'),
});
export type BusinessActivitiesUpdateInput = z.infer<typeof businessActivitiesUpdateSchema>;
