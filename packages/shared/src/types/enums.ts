/**
 * Enum values shared across all apps. Kept in sync with the SQL enum
 * types defined in the Supabase migrations (see supabase/migrations).
 */

export const ACCOUNT_TYPES = ['individual', 'institution', 'company'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const TENANT_STATUSES = ['active', 'suspended', 'cancelled'] as const;
export type TenantStatus = (typeof TENANT_STATUSES)[number];

/** Whether a tenant's first StreamPay charge (chosen plan, registration step 6) cleared — see migration 0027. */
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Each plan tier (Basic/Advanced) has one `plans` row per cycle — see migration 0028. */
export const BILLING_CYCLES = ['monthly', 'annual'] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

export const USER_ROLES = ['owner', 'admin', 'agent'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['active', 'invited', 'disabled'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const PROPERTY_TYPES = [
  'apartment',
  'villa',
  'land',
  'office',
  'shop',
  'building',
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const LISTING_TYPES = ['sale', 'rent'] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const PROPERTY_STATUSES = ['draft', 'published', 'archived'] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export const PROPERTY_AVAILABILITY = ['available', 'reserved', 'sold', 'rented'] as const;
export type PropertyAvailability = (typeof PROPERTY_AVAILABILITY)[number];

/** PRODUCT_SPEC section 4.2 — added with the property hierarchy/rentals scope expansion (migration 0008). */
export const RENTAL_STATUSES = ['active', 'ended'] as const;
export type RentalStatus = (typeof RENTAL_STATUSES)[number];

/** PRODUCT_SPEC section 4.3 — partially self-service custom domain (migration 0008). */
export const CUSTOM_DOMAIN_STATUSES = ['pending', 'verified'] as const;
export type CustomDomainStatus = (typeof CUSTOM_DOMAIN_STATUSES)[number];

export const MEDIA_TYPES = ['image', 'video'] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export const LEAD_SOURCES = ['website_form', 'whatsapp_click', 'manual'] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'won', 'lost'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const WEBSITE_SECTION_TYPES = [
  'hero',
  'property_grid',
  'project_grid',
  'property_detail',
  'about',
  'why_us',
  'contact',
  'broker_marketer_form',
  'footer',
] as const;
export type WebsiteSectionType = (typeof WEBSITE_SECTION_TYPES)[number];

export const BROKER_MARKETER_APPLICANT_TYPES = ['broker', 'marketer'] as const;
export type BrokerMarketerApplicantType = (typeof BROKER_MARKETER_APPLICANT_TYPES)[number];

/**
 * A website's fixed, non-user-creatable page set (متجر الثيمات follow-up:
 * multi-page sites). Each tenant gets exactly these 6 pages (migration
 * 0024) — there is deliberately no "add a page" flow, matching the same
 * "curated, not a free canvas" philosophy as the section library itself.
 */
export const WEBSITE_PAGE_KEYS = ['home', 'properties', 'property_detail', 'projects', 'about', 'contact'] as const;
export type WebsitePageKey = (typeof WEBSITE_PAGE_KEYS)[number];

/** Not part of PRODUCT_SPEC's original data model — see docs/OTP_FLOW.md. */
export const OTP_PURPOSES = ['register', 'login', 'reset_password'] as const;
export type OtpPurpose = (typeof OTP_PURPOSES)[number];

/** Account-type badge color, per PRODUCT_SPEC section 6. */
export const ACCOUNT_TYPE_BADGE_COLOR: Record<AccountType, string> = {
  individual: '#1D9BF0',
  institution: '#68458A',
  company: '#D4AF37',
};
