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
