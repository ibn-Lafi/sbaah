-- =============================================================================
-- Migration 0068: Unified real-estate core foundation
-- Additive first step of the real-estate rebuild.
--
-- IMPORTANT:
-- - This migration deliberately does NOT drop legacy properties/buildings/units/rentals.
-- - Legacy cleanup happens only after listings, CRM and Ejar Plus are moved.
-- - tenant_id always means the Sabaah SaaS tenant, never a real-estate lessee.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Core enums
-- ---------------------------------------------------------------------------
create type asset_type as enum (
  'apartment',
  'villa',
  'building',
  'land',
  'plot',
  'office',
  'shop',
  'warehouse',
  'floor',
  'compound',
  'chalet',
  'farm',
  'parking',
  'other'
);

create type asset_physical_status as enum (
  'planned',
  'under_construction',
  'ready',
  'maintenance',
  'inactive'
);

create type party_type as enum ('individual', 'organization');

-- ---------------------------------------------------------------------------
-- Parties: shared legal/operational people and organizations.
-- Leads remain CRM identities and are NOT merged into parties.
-- ---------------------------------------------------------------------------
create table parties (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  party_type party_type not null,
  name text not null,
  phone text,
  email text,
  national_id text,
  commercial_registration text,
  tax_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, tenant_id),
  check (length(btrim(name)) > 0)
);

create index parties_tenant_name_idx on parties(tenant_id, name);
create index parties_tenant_phone_idx on parties(tenant_id, phone) where phone is not null;
create index parties_tenant_cr_idx on parties(tenant_id, commercial_registration)
  where commercial_registration is not null;

create trigger parties_set_updated_at
  before update on parties
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Evolve project metadata without breaking the current project API yet.
-- developer_name / total_units remain temporarily for compatibility and are
-- removed in the final legacy-cleanup migration.
-- ---------------------------------------------------------------------------
alter table projects
  add column if not exists developer_party_id uuid,
  add column if not exists planned_units_count integer check (planned_units_count >= 0),
  add column if not exists updated_at timestamptz not null default now();

alter table projects
  add constraint projects_developer_party_same_tenant
  foreign key (developer_party_id, tenant_id)
  references parties(id, tenant_id)
  on delete set null (developer_party_id);

create index projects_tenant_developer_party_idx
  on projects(tenant_id, developer_party_id)
  where developer_party_id is not null;

create trigger projects_set_updated_at
  before update on projects
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Project phases remain optional project organization, never physical assets.
-- ---------------------------------------------------------------------------
alter table project_phases
  add column if not exists start_date date,
  add column if not exists expected_completion_date date,
  add column if not exists updated_at timestamptz not null default now();

alter table project_phases
  add constraint project_phases_dates_check
  check (
    expected_completion_date is null
    or start_date is null
    or expected_completion_date >= start_date
  );

create trigger project_phases_set_updated_at
  before update on project_phases
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Unit types become optional templates. Existing legacy columns remain during
-- transition so the currently deployed code is not broken by this migration.
-- ---------------------------------------------------------------------------
alter table unit_types
  alter column project_id drop not null,
  add column if not exists asset_type asset_type,
  add column if not exists specifications jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

create trigger unit_types_set_updated_at
  before update on unit_types
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Assets: the single source of truth for physical real-estate entities.
-- Buildings, villas, apartments, plots, offices, etc. all live here.
-- parent_asset_id is optional: type never forces parent/child hierarchy.
-- ---------------------------------------------------------------------------
create table assets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,

  slug text,
  reference_number text,
  asset_type asset_type not null,

  parent_asset_id uuid,
  project_id uuid,
  phase_id uuid,
  unit_type_id uuid,

  name_ar text not null,
  name_en text,
  description_ar text,
  description_en text,

  unit_number text,
  floor_number smallint,

  city_id uuid references cities(id) on delete restrict,
  district_id uuid references districts(id) on delete restrict,
  lat double precision,
  lng double precision,

  area_sqm numeric(12,2) check (area_sqm > 0),
  land_area numeric(12,2) check (land_area > 0),
  built_area numeric(12,2) check (built_area > 0),
  street_width numeric(8,2) check (street_width > 0),
  frontage property_frontage,

  bedrooms smallint check (bedrooms >= 0),
  bathrooms smallint check (bathrooms >= 0),
  floors_count smallint check (floors_count > 0),
  parking_count smallint check (parking_count >= 0),
  elevators_count smallint check (elevators_count >= 0),
  furnishing furnishing_status,
  property_age smallint check (property_age >= 0),

  physical_status asset_physical_status not null default 'ready',
  specifications jsonb not null default '{}'::jsonb,

  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (id, tenant_id),
  check (parent_asset_id is null or parent_asset_id <> id),
  check (length(btrim(name_ar)) > 0)
);

create unique index assets_tenant_slug_uidx
  on assets(tenant_id, slug) where slug is not null;
create unique index assets_tenant_reference_uidx
  on assets(tenant_id, reference_number) where reference_number is not null;
create index assets_tenant_type_idx on assets(tenant_id, asset_type);
create index assets_tenant_project_idx on assets(tenant_id, project_id)
  where project_id is not null;
create index assets_tenant_phase_idx on assets(tenant_id, phase_id)
  where phase_id is not null;
create index assets_tenant_parent_idx on assets(tenant_id, parent_asset_id)
  where parent_asset_id is not null;
create index assets_tenant_physical_status_idx on assets(tenant_id, physical_status);

alter table assets
  add constraint assets_parent_same_tenant
  foreign key (parent_asset_id, tenant_id)
  references assets(id, tenant_id)
  on delete restrict;

alter table assets
  add constraint assets_project_same_tenant
  foreign key (project_id, tenant_id)
  references projects(id, tenant_id)
  on delete set null (project_id);

alter table assets
  add constraint assets_phase_same_tenant
  foreign key (phase_id, tenant_id)
  references project_phases(id, tenant_id)
  on delete set null (phase_id);

alter table assets
  add constraint assets_unit_type_same_tenant
  foreign key (unit_type_id, tenant_id)
  references unit_types(id, tenant_id)
  on delete set null (unit_type_id);

create trigger assets_set_updated_at
  before update on assets
  for each row execute function set_updated_at();

-- Prevent cross-project phase/template attachment. Composite tenant FKs alone
-- prevent cross-tenant links; these triggers protect project consistency.
create or replace function validate_asset_project_scope()
returns trigger
language plpgsql
as $$
declare
  phase_project_id uuid;
  template_project_id uuid;
begin
  if new.phase_id is not null then
    select project_id into phase_project_id
    from project_phases
    where id = new.phase_id and tenant_id = new.tenant_id;

    if new.project_id is null or phase_project_id is distinct from new.project_id then
      raise exception 'asset phase must belong to the same project as the asset';
    end if;
  end if;

  if new.unit_type_id is not null then
    select project_id into template_project_id
    from unit_types
    where id = new.unit_type_id and tenant_id = new.tenant_id;

    if template_project_id is not null
       and (new.project_id is null or template_project_id is distinct from new.project_id) then
      raise exception 'project-scoped unit type must belong to the same project as the asset';
    end if;
  end if;

  return new;
end;
$$;

create trigger assets_validate_project_scope
  before insert or update of project_id, phase_id, unit_type_id, tenant_id
  on assets
  for each row execute function validate_asset_project_scope();

-- ---------------------------------------------------------------------------
-- Asset media belongs to the physical asset, not to a listing.
-- ---------------------------------------------------------------------------
create table asset_media (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  asset_id uuid not null,
  media_type media_type not null,
  url text not null,
  alt_ar text,
  alt_en text,
  order_index integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (id, tenant_id),
  foreign key (asset_id, tenant_id)
    references assets(id, tenant_id)
    on delete cascade
);

create index asset_media_tenant_asset_idx
  on asset_media(tenant_id, asset_id, order_index);

-- At most one primary medium per asset.
create unique index asset_media_one_primary_uidx
  on asset_media(tenant_id, asset_id)
  where is_primary;

-- ---------------------------------------------------------------------------
-- Historical ownership. An asset may have multiple co-owners.
-- ---------------------------------------------------------------------------
create table asset_ownerships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  asset_id uuid not null,
  party_id uuid not null,
  ownership_percentage numeric(5,2) not null,
  started_at date,
  ended_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, tenant_id),
  check (ownership_percentage > 0 and ownership_percentage <= 100),
  check (ended_at is null or started_at is null or ended_at >= started_at),
  foreign key (asset_id, tenant_id)
    references assets(id, tenant_id)
    on delete restrict,
  foreign key (party_id, tenant_id)
    references parties(id, tenant_id)
    on delete restrict
);

create index asset_ownerships_tenant_asset_idx
  on asset_ownerships(tenant_id, asset_id);
create index asset_ownerships_tenant_party_idx
  on asset_ownerships(tenant_id, party_id);
create index asset_ownerships_current_idx
  on asset_ownerships(tenant_id, asset_id)
  where ended_at is null;

create trigger asset_ownerships_set_updated_at
  before update on asset_ownerships
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- Owner/Admin manage the core. Agents may read assets/project inventory for
-- CRM work, but party PII and ownership remain Owner/Admin-only in this step.
-- Public website access will be introduced through published listings later.
-- ---------------------------------------------------------------------------
alter table parties enable row level security;
alter table assets enable row level security;
alter table asset_media enable row level security;
alter table asset_ownerships enable row level security;

create policy parties_owner_admin_manage on parties
  for all to authenticated
  using (tenant_id = auth_tenant_id() and auth_user_role() in ('owner', 'admin'))
  with check (
    tenant_id = auth_tenant_id()
    and auth_user_role() in ('owner', 'admin')
    and is_tenant_active(tenant_id)
  );

create policy assets_owner_admin_manage on assets
  for all to authenticated
  using (tenant_id = auth_tenant_id() and auth_user_role() in ('owner', 'admin'))
  with check (
    tenant_id = auth_tenant_id()
    and auth_user_role() in ('owner', 'admin')
    and is_tenant_active(tenant_id)
  );

create policy assets_agent_select on assets
  for select to authenticated
  using (tenant_id = auth_tenant_id() and auth_user_role() = 'agent');

create policy asset_media_owner_admin_manage on asset_media
  for all to authenticated
  using (tenant_id = auth_tenant_id() and auth_user_role() in ('owner', 'admin'))
  with check (
    tenant_id = auth_tenant_id()
    and auth_user_role() in ('owner', 'admin')
    and is_tenant_active(tenant_id)
  );

create policy asset_media_agent_select on asset_media
  for select to authenticated
  using (tenant_id = auth_tenant_id() and auth_user_role() = 'agent');

create policy asset_ownerships_owner_admin_manage on asset_ownerships
  for all to authenticated
  using (tenant_id = auth_tenant_id() and auth_user_role() in ('owner', 'admin'))
  with check (
    tenant_id = auth_tenant_id()
    and auth_user_role() in ('owner', 'admin')
    and is_tenant_active(tenant_id)
  );

-- Existing project_phases / unit_types policies from migration 0055 grant all
-- authenticated users in a tenant full CRUD. Tighten them to match the project
-- policy model from migration 0009.
drop policy if exists project_phases_tenant_manage on project_phases;
drop policy if exists unit_types_tenant_manage on unit_types;

create policy project_phases_owner_admin_manage on project_phases
  for all to authenticated
  using (tenant_id = auth_tenant_id() and auth_user_role() in ('owner', 'admin'))
  with check (
    tenant_id = auth_tenant_id()
    and auth_user_role() in ('owner', 'admin')
    and is_tenant_active(tenant_id)
  );

create policy project_phases_agent_select on project_phases
  for select to authenticated
  using (tenant_id = auth_tenant_id() and auth_user_role() = 'agent');

create policy unit_types_owner_admin_manage on unit_types
  for all to authenticated
  using (tenant_id = auth_tenant_id() and auth_user_role() in ('owner', 'admin'))
  with check (
    tenant_id = auth_tenant_id()
    and auth_user_role() in ('owner', 'admin')
    and is_tenant_active(tenant_id)
  );

create policy unit_types_agent_select on unit_types
  for select to authenticated
  using (tenant_id = auth_tenant_id() and auth_user_role() = 'agent');
