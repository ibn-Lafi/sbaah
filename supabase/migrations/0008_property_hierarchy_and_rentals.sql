-- =============================================================================
-- Migration 0008: Property hierarchy, rentals, and self-service custom domain
-- PRODUCT_SPEC.md sections 4.1-4.3 (task 13/42). Run after 0007.
--
-- Scope added by the founder after reviewing the dashboard mockup on
-- Claude Design — was explicitly out of scope in the originally approved
-- spec. All of this is purely additive: `properties` gains two nullable
-- FKs, nothing existing changes behavior. A standalone property with no
-- project/building keeps working exactly as it does today.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- projects / buildings
-- Optional grouping above `properties` (the actual sellable/rentable
-- unit). A building may belong to a project or stand alone; a property
-- may belong to a building, a project directly, or neither.
-- ---------------------------------------------------------------------------
create table projects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  name_ar text not null,
  name_en text,
  description_ar text,
  description_en text,
  city_id uuid not null references cities (id),
  district_id uuid references districts (id),
  status property_status not null default 'draft',
  created_at timestamptz not null default now()
);

create index projects_tenant_id_idx on projects (tenant_id);

create table buildings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  project_id uuid references projects (id) on delete set null,
  name_ar text not null,
  name_en text,
  city_id uuid not null references cities (id),
  district_id uuid references districts (id),
  floors_count smallint check (floors_count > 0),
  created_at timestamptz not null default now()
);

create index buildings_tenant_id_idx on buildings (tenant_id);
create index buildings_project_id_idx on buildings (project_id) where project_id is not null;

alter table properties
  add column project_id uuid references projects (id) on delete set null,
  add column building_id uuid references buildings (id) on delete set null;

create index properties_project_id_idx on properties (project_id) where project_id is not null;
create index properties_building_id_idx on properties (building_id) where building_id is not null;

-- ---------------------------------------------------------------------------
-- rentals
-- Simple lease tracking on a unit — not an accounting system (no
-- recurring invoices, no tenant payment portal). Mirrors the existing
-- properties.availability = 'rented' state with the actual contract
-- behind it.
-- ---------------------------------------------------------------------------
create type rental_status as enum ('active', 'ended');

create table rentals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  property_id uuid not null references properties (id) on delete cascade,
  tenant_name text not null,
  tenant_phone text not null,
  rent_amount numeric(12, 2) not null check (rent_amount > 0),
  contract_start_date date not null,
  contract_end_date date not null,
  status rental_status not null default 'active',
  notes text,
  created_at timestamptz not null default now(),

  constraint rentals_contract_dates_valid check (contract_end_date > contract_start_date)
);

create index rentals_tenant_id_idx on rentals (tenant_id);
create index rentals_property_id_idx on rentals (property_id);

-- ---------------------------------------------------------------------------
-- Partially self-service custom domain (PRODUCT_SPEC section 4.3)
-- The tenant enters their domain from the dashboard and is shown the
-- required DNS record; activation still requires manual founder review
-- (console, task 40/42) until the 15-customer automation threshold
-- (section 15). NULL means no domain requested; the check constraint
-- keeps the pair consistent (a domain implies a status, and vice versa).
-- ---------------------------------------------------------------------------
create type custom_domain_status as enum ('pending', 'verified');

alter table tenants
  add column custom_domain_status custom_domain_status,
  add constraint tenants_custom_domain_status_consistent check (
    (custom_domain is null) = (custom_domain_status is null)
  );
