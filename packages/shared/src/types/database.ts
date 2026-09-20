/**
 * Row types for every table in the schema (PRODUCT_SPEC section 9).
 * These mirror the Supabase/Postgres schema exactly — update both
 * together when the schema changes.
 */

import type {
  AccountType,
  AssetPhysicalStatus,
  AssetType,
  CommissionType,
  DealType,
  DocumentEntityType,
  LeaseContractSource,
  LeaseContractStatus,
  LeaseInstallmentStatus,
  LeasePartyRole,
  LeasePaymentFrequency,
  LeasePaymentMethod,
  LeasePaymentStatus,
  ListingCommercialStatus,
  ListingPricingPeriod,
  ListingPublicationStatus,
  MaintenancePriority,
  MaintenanceStatus,
  ManagementFeeType,
  MarketingMandateStatus,
  MarketingMandateType,
  PartyType,
  PropertyManagementStatus,
  ReservationStatus,
  BillingCycle,
  BusinessActivity,
  BrokerMarketerApplicantType,
  CustomDomainStatus,
  LeadSource,
  LeadStatus,
  ListingType,
  MediaType,
  OtpPurpose,
  PaymentStatus,
  PropertyAvailability,
  PropertyStatus,
  PropertyType,
  TenantStatus,
  UserRole,
  UserStatus,
  WebsiteSectionType,
  WebsitePageKey,
} from './enums';

export interface PlatformAdmin {
  id: string;
  auth_user_id: string;
  phone: string;
  full_name: string;
  created_at: string;
}

export interface Plan {
  id: string;
  name_ar: string;
  name_en: string;
  /** Monthly vs. annual — a tier (Basic/Advanced) has one `plans` row per cycle, not a single row with both prices. */
  billing_cycle: BillingCycle;
  /** Regular price (SAR, VAT-inclusive) for this cycle — what's charged after `intro_months`, or from day one if there's no intro period. */
  price: number;
  /** Discounted price for the plan's first `intro_months` billing cycles (monthly cycle only in practice — annual plans have no intro period) — null means no intro period (charged `price` from day one). */
  intro_price: number | null;
  intro_months: number | null;
  /** Short marketing line shown under the plan name on pricing cards (register step 6, /billing/plans) — null renders no description. */
  description_ar: string | null;
  /** Null means unlimited ("بلا حدود") — not enforced anywhere yet, display-only like the rest of these limits. */
  max_properties: number | null;
  max_users: number | null;
  custom_domain_allowed: boolean;
  is_active: boolean;
  /** The matching recurring Product's id in StreamPay's own dashboard (set up manually there first) — null until console fills it in. */
  streampay_product_id: string | null;
  /** The one free-trial plan (migration 0047) — chosen only at registration step 5, never shown on /billing or any later plan switch. */
  is_trial: boolean;
}

/** جدول من صف واحد (id ثابت = true) — روابط حسابات سبعة نفسها (المنصة)، تُدار من console فقط. تظهر في لوحة تسجيل الدخول/إنشاء حساب بدل شريط "عقار←موقع←زائر←Lead←متابعة". */
export interface PlatformSettings {
  id: true;
  social_tiktok: string | null;
  social_instagram: string | null;
  social_x: string | null;
  contact_email: string | null;
  privacy_title_ar: string;
  privacy_title_en: string;
  privacy_content_ar: string;
  privacy_content_en: string;
  terms_title_ar: string;
  terms_title_en: string;
  terms_content_ar: string;
  terms_content_en: string;
  hero_eyebrow_ar: string | null;
  hero_eyebrow_en: string | null;
  hero_title_ar: string | null;
  hero_title_en: string | null;
  hero_subtitle_ar: string | null;
  hero_subtitle_en: string | null;
  footer_tagline_ar: string | null;
  footer_tagline_en: string | null;
  faq_title_ar: string | null;
  faq_title_en: string | null;
  final_cta_title_ar: string | null;
  final_cta_title_en: string | null;
  final_cta_subtitle_ar: string | null;
  final_cta_subtitle_en: string | null;
  updated_at: string;
}

export interface Tenant {
  id: string;
  name_ar: string;
  name_en: string;
  account_type: AccountType;
  /** No longer collected at registration (migration 0047) — filled in later from حسابي. Required for the tenant's public site to publish. */
  fal_license_number: string | null;
  cr_number: string | null;
  tax_number: string | null;
  /** الحساب's social links (حسابي) — نطاقًا اختياريًا؛ يظهر في تذييل الموقع فقط ما تم تعبئته. */
  social_instagram: string | null;
  social_tiktok: string | null;
  social_whatsapp: string | null;
  social_snapchat: string | null;
  social_phone: string | null;
  social_facebook: string | null;
  social_x: string | null;
  social_telegram: string | null;
  subdomain: string;
  custom_domain: string | null;
  /** PRODUCT_SPEC section 4.3 — always paired with custom_domain (both null or both set), enforced by a DB check constraint. */
  custom_domain_status: CustomDomainStatus | null;
  plan_id: string;
  status: TenantStatus;
  /** Whether the first StreamPay charge for the chosen plan (registration step 6) cleared — see migration 0027. */
  payment_status: PaymentStatus;
  /** Set only when the chosen plan at registration was the free-trial plan (migration 0047) — null for every normal paid signup. Past this timestamp the tenant is treated exactly like a suspended one (is_tenant_active) until they subscribe to a real plan. */
  trial_ends_at: string | null;
  created_at: string;
}

/** One StreamPay checkout attempt (migration 0027) — service-role written only; the tenant Owner can read their own billing history. */
/** One enabled product activity for a tenant (migration 0050). */
export interface TenantBusinessActivity {
  tenant_id: string;
  activity: BusinessActivity;
  created_at: string;
  created_by: string | null;
}

export interface Payment {
  id: string;
  tenant_id: string;
  plan_id: string;
  amount: number;
  currency: string;
  provider: string;
  provider_reference: string | null;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export interface AppUser {
  id: string;
  tenant_id: string;
  auth_user_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}

export interface Theme {
  id: string;
  /** Stable code-reference slug (e.g. 'classic') — public-site's theme registry looks components up by this, never by `id`. */
  key: string;
  name_ar: string;
  name_en: string;
  is_active: boolean;
  order_index: number;
  /** Uploaded screenshot for متجر الثيمات cards (console-managed, migration 0035) — null falls back to the CSS mockup (ThemePreview). */
  preview_image_url: string | null;
}

export interface Website {
  id: string;
  tenant_id: string;
  theme_id: string;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  logo_url: string | null;
  banner_image_url: string | null;
  /** خلفية فيديو لقسم الهيرو (بدائل video/video_search) — بديل عن banner_image_url لا يظهران معًا (migration 0049). */
  banner_video_url: string | null;
  /** أعلى الصفحة — نص شريط ترويجي اختياري فوق الهيدر، يظهر في كل صفحات الموقع. */
  announcement_bar_text: string | null;
  /** أسفل الصفحة — نص تعريفي في الفوتر (منفصل عن الشعار/الألوان). */
  footer_description: string | null;
  /** العنوان — سطر عنوان يظهر في تذييل الموقع العام (migration 0048)، منفصل عن footer_description. */
  address: string | null;
}

/** الصفحات — صفحة يكتبها المالك/المسؤول (عنوان + محتوى)، تُعرض عبر رابط في تذييل الموقع (مثل سياسة الخصوصية). */
export interface WebsiteCustomPage {
  id: string;
  website_id: string;
  title: string;
  slug: string;
  content: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

/** One of a website's 4 fixed pages (migration 0024, narrowed in 0038) — see WEBSITE_PAGE_KEYS. */
export interface WebsitePage {
  id: string;
  website_id: string;
  key: WebsitePageKey;
}

export interface WebsiteSection {
  id: string;
  website_id: string;
  /** Which of the website's 4 pages this section belongs to (migration 0024, narrowed in 0038). */
  page_id: string;
  type: WebsiteSectionType;
  order_index: number;
  is_visible: boolean;
  config: Record<string, unknown>;
}

/** Fixed platform reference data (migration 0046) — the 13 official Saudi administrative regions, no console CRUD. */
export interface Region {
  id: string;
  name_ar: string;
  name_en: string;
}

export interface City {
  id: string;
  region_id: string;
  name_ar: string;
  name_en: string;
  lat: number | null;
  lng: number | null;
}

export interface District {
  id: string;
  city_id: string;
  name_ar: string;
  name_en: string;
  lat: number | null;
  lng: number | null;
}

/** PRODUCT_SPEC section 4.1 — optional hierarchy grouping, added with migration 0008. */
export interface Project {
  id: string;
  slug: string;
  tenant_id: string;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  city_id: string;
  district_id: string | null;
  lat: number | null;
  lng: number | null;
  status: PropertyStatus;
  created_at: string;
}

export interface Building {
  id: string;
  tenant_id: string;
  project_id: string | null;
  name_ar: string;
  name_en: string | null;
  city_id: string;
  district_id: string | null;
  lat: number | null;
  lng: number | null;
  floors_count: number | null;
  created_at: string;
}

export interface Property {
  id: string;
  slug: string;
  tenant_id: string;
  project_id: string | null;
  building_id: string | null;
  land_area: number | null;
  built_area: number | null;
  street_width: number | null;
  frontage: string | null;
  property_age: number | null;
  floor_number: number | null;
  floors_count: number | null;
  parking_count: number | null;
  elevators_count: number | null;
  furnishing: string | null;
  reference_number: string | null;
  advertisement_license_number: string | null;
  advertisement_license_expires_at: string | null;
  advertiser_name: string | null;
  marketing_mandate_id: string | null;
  title_ar: string;
  title_en: string | null;
  description_ar: string;
  description_en: string | null;
  property_type: PropertyType;
  listing_type: ListingType;
  price: number;
  area_sqm: number;
  bedrooms: number | null;
  bathrooms: number | null;
  city_id: string;
  district_id: string | null;
  lat: number | null;
  lng: number | null;
  status: PropertyStatus;
  availability: PropertyAvailability;
  agent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyMedia {
  id: string;
  property_id: string;
  media_type: MediaType;
  url: string;
  order_index: number;
}

export interface Lead {
  id: string;
  tenant_id: string;
  asset_id: string | null;
  listing_id: string | null;
  full_name: string;
  /** Nullable only for source='whatsapp_click' — migration 0015. */
  phone: string | null;
  email: string | null;
  source: LeadSource;
  status: LeadStatus;
  assigned_agent_id: string | null;
  follow_up_at: string | null;
  created_at: string;
}

/** Submitted from the public site's "broker_marketer_form" section (migration 0032) — null `property_id` means it was submitted from the home page (site-wide), not a specific property. */
export interface BrokerMarketerApplication {
  id: string;
  tenant_id: string;
  property_id: string | null;
  full_name: string;
  city_id: string;
  fal_license_number: string;
  applicant_type: BrokerMarketerApplicantType;
  created_at: string;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  user_id: string;
  note_text: string;
  created_at: string;
}

export interface PropertyView {
  id: string;
  tenant_id: string;
  property_id: string;
  source: string | null;
  created_at: string;
}

/** Not part of PRODUCT_SPEC's original data model — see docs/OTP_FLOW.md. Never holds the OTP code itself. */
export interface OtpVerification {
  id: string;
  phone: string;
  purpose: OtpPurpose;
  attempt_count: number;
  locked_until: string | null;
  expires_at: string;
  consumed_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  tenant_id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}


/** Unified physical real-estate source of truth (migration 0068). */
export interface Asset {
  id: string; tenant_id: string; slug: string | null; reference_number: string | null;
  asset_type: AssetType; parent_asset_id: string | null; project_id: string | null;
  phase_id: string | null; unit_type_id: string | null; name_ar: string; name_en: string | null;
  description_ar: string | null; description_en: string | null; unit_number: string | null;
  floor_number: number | null; city_id: string | null; district_id: string | null;
  lat: number | null; lng: number | null; area_sqm: number | null; land_area: number | null;
  built_area: number | null; street_width: number | null; frontage: string | null;
  bedrooms: number | null; bathrooms: number | null; floors_count: number | null;
  parking_count: number | null; elevators_count: number | null; furnishing: string | null;
  property_age: number | null; physical_status: AssetPhysicalStatus;
  specifications: Record<string, unknown>; archived_at: string | null; created_at: string; updated_at: string;
}
export interface Party {
  id: string; tenant_id: string; party_type: PartyType; name: string; phone: string | null;
  email: string | null; national_id: string | null; commercial_registration: string | null;
  tax_number: string | null; notes: string | null; created_at: string; updated_at: string;
}
export interface Listing {
  id: string; tenant_id: string; listing_number: string; listing_type: ListingType;
  title_ar: string; title_en: string | null; description_ar: string | null; description_en: string | null;
  asking_price: number; pricing_period: ListingPricingPeriod | null;
  publication_status: ListingPublicationStatus; commercial_status: ListingCommercialStatus;
  advertisement_license_number: string | null; advertisement_license_expires_at: string | null;
  advertiser_name: string | null; marketing_mandate_id: string | null;
  assigned_user_id: string | null; created_by: string | null; published_at: string | null;
  closed_at: string | null; archived_at: string | null; created_at: string; updated_at: string;
}
export interface Reservation {
  id: string; tenant_id: string; reservation_number: string; lead_id: string | null;
  listing_id: string | null; status: ReservationStatus; reserved_at: string; expires_at: string | null;
  deposit_amount: number | null; notes: string | null; created_by: string | null;
  converted_at: string | null; cancelled_at: string | null; created_at: string; updated_at: string;
}
export interface PropertyManagementAssignment {
  id: string; tenant_id: string; asset_id: string; starts_at: string; ends_at: string | null;
  status: PropertyManagementStatus; management_fee_type: ManagementFeeType | null;
  management_fee_value: number | null; notes: string | null; created_at: string; updated_at: string;
}
export interface LeaseContract {
  id: string; tenant_id: string; contract_number: string; source: LeaseContractSource;
  external_contract_number: string | null; start_date: string; end_date: string; total_value: number;
  security_deposit: number; payment_frequency: LeasePaymentFrequency; status: LeaseContractStatus;
  signed_at: string | null; terminated_at: string | null; termination_reason: string | null;
  renewed_from_contract_id: string | null; notes: string | null; created_by: string | null;
  created_at: string; updated_at: string;
}
export interface LeaseContractParty {
  tenant_id: string; contract_id: string; party_id: string; role: LeasePartyRole; created_at: string;
}
export interface LeaseInstallment {
  id: string; tenant_id: string; contract_id: string; installment_number: number; due_date: string;
  amount: number; status: LeaseInstallmentStatus; created_at: string; updated_at: string;
}
export interface LeasePayment {
  id: string; tenant_id: string; payment_number: string; contract_id: string; payer_party_id: string | null;
  amount: number; paid_at: string; payment_method: LeasePaymentMethod; status: LeasePaymentStatus;
  reference_number: string | null; notes: string | null; reversal_reason: string | null;
  reversed_at: string | null; created_by: string | null; created_at: string;
}
export interface MaintenanceRequest {
  id: string; tenant_id: string; request_number: string; asset_id: string; contract_id: string | null;
  reported_by_party_id: string | null; category: string | null; title: string; description: string | null;
  priority: MaintenancePriority; status: MaintenanceStatus; assigned_user_id: string | null;
  vendor_party_id: string | null; estimated_cost: number | null; actual_cost: number | null;
  opened_at: string; scheduled_at: string | null; completed_at: string | null; notes: string | null;
  created_at: string; updated_at: string;
}
export interface MarketingMandateV2 {
  id: string; tenant_id: string; reference_number: string; owner_party_id: string | null;
  mandate_type: MarketingMandateType | null; commission_type: CommissionType | null;
  commission_value: number | null; status: MarketingMandateStatus; starts_at: string | null;
  expires_at: string | null; notes: string | null; created_at: string; updated_at: string;
}
export interface DocumentLink {
  tenant_id: string; document_id: string; entity_type: DocumentEntityType; entity_id: string; created_at: string;
}
export interface DealV2 {
  id: string; tenant_id: string; lead_id: string; deal_type: DealType | null;
  listing_id: string | null; reservation_id: string | null; responsible_user_id: string | null;
  status: string; value: number | null; expected_close_date: string | null; closed_at: string | null;
  lost_reason: string | null; commission_type: string | null; commission_value: number | null;
  created_at: string; updated_at: string;
}
