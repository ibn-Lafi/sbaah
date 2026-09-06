-- =============================================================================
-- Migration 0003: Property tables (cities, districts, properties, property_media)
-- PRODUCT_SPEC.md section 9. Run after 0002.
-- =============================================================================

create type property_type as enum ('apartment', 'villa', 'land', 'office', 'shop', 'building');
create type listing_type as enum ('sale', 'rent');
create type property_status as enum ('draft', 'published', 'archived');
create type property_availability as enum ('available', 'reserved', 'sold', 'rented');
create type media_type as enum ('image', 'video');

-- ---------------------------------------------------------------------------
-- cities / districts
-- Platform-level reference data (not tenant-scoped), admin-managed from
-- `console`. Selectable lists rather than free text so the public search
-- filter (PRODUCT_SPEC section 4) actually works (no "الرياض" vs "رياض").
-- ---------------------------------------------------------------------------
create table cities (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null
);

create table districts (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities (id) on delete cascade,
  name_ar text not null,
  name_en text not null
);

create index districts_city_id_idx on districts (city_id);

-- ---------------------------------------------------------------------------
-- properties
-- Simple, single-level property model — no project/building/unit
-- hierarchy in this version (PRODUCT_SPEC section 4).
-- ---------------------------------------------------------------------------
create table properties (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  title_ar text not null,
  title_en text,
  description_ar text not null,
  description_en text,
  property_type property_type not null,
  listing_type listing_type not null,
  price numeric(12, 2) not null check (price > 0),
  area_sqm numeric(10, 2) not null check (area_sqm > 0),
  bedrooms smallint check (bedrooms >= 0),
  bathrooms smallint check (bathrooms >= 0),
  city_id uuid not null references cities (id),
  district_id uuid references districts (id),
  lat double precision,
  lng double precision,
  status property_status not null default 'draft',
  availability property_availability not null default 'available',
  agent_id uuid references users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index properties_tenant_id_idx on properties (tenant_id);
create index properties_tenant_status_idx on properties (tenant_id, status);
create index properties_city_id_idx on properties (city_id);
create index properties_agent_id_idx on properties (agent_id) where agent_id is not null;

-- Keep updated_at accurate automatically — a reusable trigger, applied
-- here and to any future table that needs the same behavior.
create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger properties_set_updated_at
  before update on properties
  for each row
  execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- property_media
-- Images and videos in one table (media_type column) rather than two
-- separate tables — direct video upload, no transcoding pipeline in this
-- version; size/count caps are enforced in application code, not here
-- (PRODUCT_SPEC section 12).
-- ---------------------------------------------------------------------------
create table property_media (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties (id) on delete cascade,
  media_type media_type not null,
  url text not null,
  order_index integer not null default 0
);

create index property_media_property_id_idx on property_media (property_id);
