/**
 * Enum values shared across all apps. Kept in sync with the SQL enum
 * types defined in the Supabase migrations (see supabase/migrations).
 */

export const ACCOUNT_TYPES = ['individual', 'institution', 'company'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

/**
 * What the tenant does in Sabaah. This is deliberately independent from
 * account/entity type and from staff authorization roles: a company can be
 * both a developer and a marketer, while its employees still have their own
 * permissions.
 */
export const BUSINESS_ACTIVITIES = ['marketing', 'brokerage', 'development'] as const;
export type BusinessActivity = (typeof BUSINESS_ACTIVITIES)[number];

export const BUSINESS_CAPABILITIES = [
  'properties',
  'crm',
  'marketing',
  'projects',
  'developer_inventory',
] as const;
export type BusinessCapability = (typeof BUSINESS_CAPABILITIES)[number];

const BUSINESS_ACTIVITY_CAPABILITIES: Record<BusinessActivity, readonly BusinessCapability[]> = {
  marketing: ['properties', 'crm', 'marketing'],
  brokerage: ['properties', 'crm'],
  development: ['properties', 'crm', 'projects', 'developer_inventory'],
};

/**
 * Central capability resolver. Product surfaces should depend on capabilities
 * instead of scattering activity checks throughout UI/API code.
 */
export function resolveBusinessCapabilities(
  activities: readonly BusinessActivity[],
): ReadonlySet<BusinessCapability> {
  return new Set(activities.flatMap((activity) => BUSINESS_ACTIVITY_CAPABILITIES[activity]));
}

export function hasBusinessCapability(
  activities: readonly BusinessActivity[],
  capability: BusinessCapability,
): boolean {
  return resolveBusinessCapabilities(activities).has(capability);
}

export const DATA_PUBLICATION_STATES = ['draft', 'ready', 'published', 'blocked'] as const;
export type PublicationState = (typeof DATA_PUBLICATION_STATES)[number];

export const FURNISHING_STATUSES = ['unfurnished', 'semi_furnished', 'furnished'] as const;
export type FurnishingStatus = (typeof FURNISHING_STATUSES)[number];

export const PROPERTY_FRONTAGES = ['north','south','east','west','northeast','northwest','southeast','southwest'] as const;
export type PropertyFrontage = (typeof PROPERTY_FRONTAGES)[number];

export const VIEWING_STATUSES = ['scheduled','completed','rescheduled','cancelled','no_show'] as const;
export type ViewingStatus = (typeof VIEWING_STATUSES)[number];
export const VIEWING_OUTCOMES = ['interested','follow_up','not_interested'] as const;
export type ViewingOutcome = (typeof VIEWING_OUTCOMES)[number];

export const DEAL_STATUSES = ['open','negotiation','won','lost'] as const;
export type DealStatus = (typeof DEAL_STATUSES)[number];

export const CONVERSATION_STATUSES = ['ai_active','human_handoff','closed'] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

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

export const LISTING_TYPES = ['sale', 'rent'] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const PROJECT_STATUSES = ['draft', 'published', 'archived'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/** PRODUCT_SPEC section 4.3 — partially self-service custom domain (migration 0008). */
export const CUSTOM_DOMAIN_STATUSES = ['pending', 'verified'] as const;
export type CustomDomainStatus = (typeof CUSTOM_DOMAIN_STATUSES)[number];

export const MEDIA_TYPES = ['image', 'video'] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export const LEAD_SOURCES = ['website_form', 'whatsapp_click', 'manual'] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'in_progress', 'won', 'lost', 'expired'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const WEBSITE_SECTION_TYPES = [
  'hero',
  'property_grid',
  'featured_properties',
  'latest_properties',
  'project_grid',
  'projects_showcase',
  'properties_by_city',
  'stats',
  'services',
  'faq',
  'cta',
  'property_request',
  'promo_banner',
  'free_content',
  'gallery',
  'video',
  'property_detail',
  'about',
  'why_us',
  'contact',
  'broker_marketer_form',
  'map',
  'footer',
] as const;
export type WebsiteSectionType = (typeof WEBSITE_SECTION_TYPES)[number];

export const BROKER_MARKETER_APPLICANT_TYPES = ['broker', 'marketer'] as const;
export type BrokerMarketerApplicantType = (typeof BROKER_MARKETER_APPLICANT_TYPES)[number];

/**
 * A website's fixed, non-user-creatable page set (متجر الثيمات follow-up:
 * multi-page sites). Each tenant gets exactly these 4 pages (migration
 * 0024, narrowed from 6 in migration 0038 — the classic theme's about/
 * contact pages had no nav link pointing to them and were removed) —
 * there is deliberately no "add a page" flow, matching the same
 * "curated, not a free canvas" philosophy as the section library itself.
 */
export const WEBSITE_PAGE_KEYS = ['home', 'properties', 'property_detail', 'projects'] as const;
export type WebsitePageKey = (typeof WEBSITE_PAGE_KEYS)[number];

/** Not part of PRODUCT_SPEC's original data model — see docs/OTP_FLOW.md. */
export const OTP_PURPOSES = ['register', 'login', 'reset_password', 'change_phone', 'change_email'] as const;
export type OtpPurpose = (typeof OTP_PURPOSES)[number];

/** Account-type badge color, per PRODUCT_SPEC section 6. */
export const ACCOUNT_TYPE_BADGE_COLOR: Record<AccountType, string> = {
  individual: '#1D9BF0',
  institution: '#68458A',
  company: '#D4AF37',
};


/** Unified real-estate core (migrations 0068-0072). */
export const ASSET_TYPES = ['apartment','villa','building','land','plot','office','shop','warehouse','floor','compound','chalet','farm','parking','other'] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export const ASSET_PHYSICAL_STATUSES = ['planned','under_construction','ready','maintenance','inactive'] as const;
export type AssetPhysicalStatus = (typeof ASSET_PHYSICAL_STATUSES)[number];

export const PARTY_TYPES = ['individual','organization'] as const;
export type PartyType = (typeof PARTY_TYPES)[number];

export const LISTING_PUBLICATION_STATUSES = ['draft','published','paused','archived'] as const;
export type ListingPublicationStatus = (typeof LISTING_PUBLICATION_STATUSES)[number];
export const LISTING_COMMERCIAL_STATUSES = ['available','reserved','under_negotiation','closed'] as const;
export type ListingCommercialStatus = (typeof LISTING_COMMERCIAL_STATUSES)[number];
export const LISTING_PRICING_PERIODS = ['monthly','quarterly','semi_annual','annual'] as const;
export type ListingPricingPeriod = (typeof LISTING_PRICING_PERIODS)[number];

export const RESERVATION_STATUSES = ['pending','active','expired','cancelled','converted'] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];
export const DEAL_TYPES = ['sale','rent'] as const;
export type DealType = (typeof DEAL_TYPES)[number];

export const PROPERTY_MANAGEMENT_STATUSES = ['active','paused','ended'] as const;
export type PropertyManagementStatus = (typeof PROPERTY_MANAGEMENT_STATUSES)[number];
export const MANAGEMENT_FEE_TYPES = ['fixed','percentage'] as const;
export type ManagementFeeType = (typeof MANAGEMENT_FEE_TYPES)[number];
export const LEASE_CONTRACT_SOURCES = ['internal','ejar','external'] as const;
export type LeaseContractSource = (typeof LEASE_CONTRACT_SOURCES)[number];
export const LEASE_CONTRACT_STATUSES = ['draft','upcoming','active','expired','terminated','cancelled'] as const;
export type LeaseContractStatus = (typeof LEASE_CONTRACT_STATUSES)[number];
export const LEASE_PAYMENT_FREQUENCIES = ['one_time','monthly','quarterly','semi_annual','annual','custom'] as const;
export type LeasePaymentFrequency = (typeof LEASE_PAYMENT_FREQUENCIES)[number];
export const LEASE_PARTY_ROLES = ['lessor','lessee','guarantor','representative'] as const;
export type LeasePartyRole = (typeof LEASE_PARTY_ROLES)[number];
export const LEASE_INSTALLMENT_STATUSES = ['scheduled','partially_paid','paid','overdue','cancelled'] as const;
export type LeaseInstallmentStatus = (typeof LEASE_INSTALLMENT_STATUSES)[number];
export const LEASE_PAYMENT_METHODS = ['cash','bank_transfer','card','sadad','other'] as const;
export type LeasePaymentMethod = (typeof LEASE_PAYMENT_METHODS)[number];
export const LEASE_PAYMENT_STATUSES = ['recorded','reversed'] as const;
export type LeasePaymentStatus = (typeof LEASE_PAYMENT_STATUSES)[number];
export const MAINTENANCE_PRIORITIES = ['low','normal','high','urgent'] as const;
export type MaintenancePriority = (typeof MAINTENANCE_PRIORITIES)[number];
export const MAINTENANCE_STATUSES = ['open','in_review','scheduled','in_progress','completed','cancelled'] as const;
export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number];

export const MARKETING_MANDATE_STATUSES = ['draft','active','expired','cancelled'] as const;
export type MarketingMandateStatus = (typeof MARKETING_MANDATE_STATUSES)[number];
export const MARKETING_MANDATE_TYPES = ['sale','rent','sale_and_rent'] as const;
export type MarketingMandateType = (typeof MARKETING_MANDATE_TYPES)[number];
export const COMMISSION_TYPES = ['fixed','percentage'] as const;
export type CommissionType = (typeof COMMISSION_TYPES)[number];
export const DOCUMENT_ENTITY_TYPES = ['asset','project','listing','marketing_mandate','reservation','deal','lease_contract','maintenance_request','party'] as const;
export type DocumentEntityType = (typeof DOCUMENT_ENTITY_TYPES)[number];
