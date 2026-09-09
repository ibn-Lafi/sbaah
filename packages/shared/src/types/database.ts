/**
 * Row types for every table in the schema (PRODUCT_SPEC section 9).
 * These mirror the Supabase/Postgres schema exactly — update both
 * together when the schema changes.
 */

import type {
  AccountType,
  CustomDomainStatus,
  LeadSource,
  LeadStatus,
  ListingType,
  MediaType,
  OtpPurpose,
  PropertyAvailability,
  PropertyStatus,
  PropertyType,
  RentalStatus,
  TenantStatus,
  UserRole,
  UserStatus,
  WebsiteSectionType,
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
  price: number;
  max_properties: number;
  max_users: number;
  custom_domain_allowed: boolean;
  is_active: boolean;
}

export interface Tenant {
  id: string;
  name_ar: string;
  name_en: string;
  account_type: AccountType;
  fal_license_number: string;
  cr_number: string | null;
  tax_number: string | null;
  subdomain: string;
  custom_domain: string | null;
  /** PRODUCT_SPEC section 4.3 — always paired with custom_domain (both null or both set), enforced by a DB check constraint. */
  custom_domain_status: CustomDomainStatus | null;
  plan_id: string;
  status: TenantStatus;
  created_at: string;
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
  name_ar: string;
  name_en: string;
  is_active: boolean;
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
}

export interface WebsiteSection {
  id: string;
  website_id: string;
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
