-- =============================================================================
-- Migration 0002: Website tables (themes, websites, website_sections)
-- PRODUCT_SPEC.md section 6 and 9. Run after 0001.
-- =============================================================================

create type website_section_type as enum (
  'hero',
  'property_grid',
  'about',
  'why_us',
  'contact',
  'footer'
);

-- ---------------------------------------------------------------------------
-- themes
-- Platform-level catalog, not tenant-scoped. This version ships exactly
-- one theme (seeded in migration 0004) — the table exists so more themes
-- can be added later without restructuring (PRODUCT_SPEC section 6).
-- ---------------------------------------------------------------------------
create table themes (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  is_active boolean not null default true
);

-- ---------------------------------------------------------------------------
-- websites
-- 1:1 with tenants — ACCOUNT = ONE WEBSITE (PRODUCT_SPEC section 3).
-- ---------------------------------------------------------------------------
create table websites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references tenants (id) on delete cascade,
  theme_id uuid not null references themes (id),
  primary_color text not null default '#68458A',
  secondary_color text not null default '#000000',
  font_family text not null default 'Tajawal',
  logo_url text,
  banner_image_url text
);

-- ---------------------------------------------------------------------------
-- website_sections
-- The drag-and-drop builder's section library (PRODUCT_SPEC section 6).
-- Note: the mandatory سبعة footer badge is NOT a row here — it's a fixed
-- part of the public-site template that brokers cannot hide, independent
-- of this table (see PRODUCT_SPEC section 6, "شارة سبعة").
-- ---------------------------------------------------------------------------
create table website_sections (
  id uuid primary key default gen_random_uuid(),
  website_id uuid not null references websites (id) on delete cascade,
  type website_section_type not null,
  order_index integer not null default 0,
  is_visible boolean not null default true,
  config jsonb not null default '{}'::jsonb
);

create index website_sections_website_id_idx on website_sections (website_id);
