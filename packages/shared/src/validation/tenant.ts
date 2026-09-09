import { z } from 'zod';

/**
 * Registration payload shape depends on account_type, per PRODUCT_SPEC
 * section 2: فال license is mandatory for every type; institution/company
 * additionally require CR number, tax number, and an entity name.
 */

const falLicenseNumberSchema = z
  .string()
  .min(1, 'رقم رخصة "فال" مطلوب');

export const individualRegistrationSchema = z.object({
  account_type: z.literal('individual'),
  full_name: z.string().min(3, 'الاسم الثلاثي مطلوب'),
  fal_license_number: falLicenseNumberSchema,
});

const organizationFields = {
  name_ar: z.string().min(2, 'اسم الجهة مطلوب'),
  /** The registering person, distinct from the entity's own name_ar above — becomes the Owner user's full_name. */
  owner_full_name: z.string().min(3, 'الاسم الثلاثي لمسؤول الحساب مطلوب'),
  cr_number: z.string().min(1, 'رقم السجل التجاري مطلوب'),
  tax_number: z.string().min(1, 'الرقم الضريبي مطلوب'),
  fal_license_number: falLicenseNumberSchema,
};

export const institutionRegistrationSchema = z.object({
  account_type: z.literal('institution'),
  ...organizationFields,
});

export const companyRegistrationSchema = z.object({
  account_type: z.literal('company'),
  ...organizationFields,
});

export const tenantRegistrationSchema = z.discriminatedUnion('account_type', [
  individualRegistrationSchema,
  institutionRegistrationSchema,
  companyRegistrationSchema,
]);

export type TenantRegistrationInput = z.infer<typeof tenantRegistrationSchema>;

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
