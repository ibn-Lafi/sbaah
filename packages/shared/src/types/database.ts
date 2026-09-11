/**
 * Row types for every table in the schema (PRODUCT_SPEC section 9).
 * These mirror the Supabase/Postgres schema exactly — update both
 * together when the schema changes.
 */

import type {
  AccountType,
  BillingCycle,
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
  RentalStatus,
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
}

/** جدول من صف واحد (id ثابت = true) — روابط حسابات سبعة نفسها (المنصة)، تُدار من console فقط. تظهر في لوحة تسجيل الدخول/إنشاء حساب بدل شريط "عقار←موقع←زائر←Lead←متابعة". */
export interface PlatformSettings {
  id: true;
  social_tiktok: string | null;
  social_instagram: string | null;
  social_x: string | null;
  contact_email: string | null;
  updated_at: string;
}

export interface Tenant {
  id: string;
  name_ar: string;
  name_en: string;
  account_type: AccountType;
  fal_license_number: string;
  cr_number: string | null;
  tax_number: string | null;
  /** الحساب's social links (حسابي) — نطاقًا اختياريًا؛ يظهر في تذييل الموقع فقط ما تم تعبئته. */
  social_instagram: string | null;
  social_tiktok: string | null;
  social_whatsapp: string | null;
  social_snapchat: string | null;
  social_phone: string | null;
  subdomain: string;
  custom_domain: string | null;
  /** PRODUCT_SPEC section 4.3 — always paired with custom_domain (both null or both set), enforced by a DB check constraint. */
  custom_domain_status: CustomDomainStatus | null;
  plan_id: string;
  status: TenantStatus;
  /** Whether the first StreamPay charge for the chosen plan (registration step 6) cleared — see migration 0027. */
  payment_status: PaymentStatus;
  created_at: string;
}

/** One StreamPay checkout attempt (migration 0027) — service-role written only; the tenant Owner can read their own billing history. */
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
  /** Stable code-reference slug (e.g. 'classic', 'modern') — public-site's theme registry looks components up by this, never by `id`. */
  key: string;
  name_ar: string;
  name_en: string;
  is_active: boolean;
  order_index: number;
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
  /** أعلى الصفحة — نص شريط ترويجي اختياري فوق الهيدر، يظهر في كل صفحات الموقع. */
  announcement_bar_text: string | null;
  /** أسفل الصفحة — نص تعريفي في الفوتر (منفصل عن الشعار/الألوان). */
  footer_description: string | null;
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

/** One of a website's 6 fixed pages (migration 0024) — see WEBSITE_PAGE_KEYS. */
export interface WebsitePage {
  id: string;
  website_id: string;
  key: WebsitePageKey;
}

export interface WebsiteSection {
  id: string;
  website_id: string;
  /** Which of the website's 6 pages this section belongs to (migration 0024). */
  page_id: string;
  type: WebsiteSectionType;
  order_index: number;
  is_visible: boolean;
  config: Record<string, unknown>;
}

export interface City {
  id: string;
  name_ar: string;
  name_en: string;
}

export interface District {
  id: string;
  city_id: string;
  name_ar: string;
  name_en: string;
}

/** PRODUCT_SPEC section 4.1 — optional hierarchy grouping, added with migration 0008. */
export interface Project {
  id: string;
  tenant_id: string;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  city_id: string;
  district_id: string | null;
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
  floors_count: number | null;
  created_at: string;
}

export interface Property {
  id: string;
  tenant_id: string;
  project_id: string | null;
  building_id: string | null;
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

/** PRODUCT_SPEC section 4.2 — simple lease tracking, added with migration 0008. */
export interface Rental {
  id: string;
  tenant_id: string;
  property_id: string;
  tenant_name: string;
  tenant_phone: string;
  rent_amount: number;
  contract_start_date: string;
  contract_end_date: string;
  status: RentalStatus;
  notes: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  tenant_id: string;
  property_id: string | null;
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
