/**
 * Enum values shared across all apps. Kept in sync with the SQL enum
 * types defined in the Supabase migrations (see supabase/migrations).
 */

export const ACCOUNT_TYPES = ['individual', 'institution', 'company'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const TENANT_STATUSES = ['active', 'suspended', 'cancelled'] as const;
export type TenantStatus = (typeof TENANT_STATUSES)[number];

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

export const MEDIA_TYPES = ['image', 'video'] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export const LEAD_SOURCES = ['website_form', 'whatsapp_click', 'manual'] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'won', 'lost'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const WEBSITE_SECTION_TYPES = [
  'hero',
  'property_grid',
  'about',
  'why_us',
  'contact',
  'footer',
] as const;
export type WebsiteSectionType = (typeof WEBSITE_SECTION_TYPES)[number];

/** Not part of PRODUCT_SPEC's original data model — see docs/OTP_FLOW.md. */
export const OTP_PURPOSES = ['register', 'login', 'reset_password'] as const;
export type OtpPurpose = (typeof OTP_PURPOSES)[number];

/** Account-type badge color, per PRODUCT_SPEC section 6. */
export const ACCOUNT_TYPE_BADGE_COLOR: Record<AccountType, string> = {
  individual: '#1D9BF0',
  institution: '#68458A',
  company: '#D4AF37',
};
