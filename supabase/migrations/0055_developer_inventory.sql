create type unit_availability as enum ('available','reserved','sold','rented','blocked');

alter table projects
  add column developer_name text,
  add column completion_percentage numeric(5,2) check (completion_percentage between 0 and 100),
  add column expected_completion_date date,
  add column total_units integer check (total_units >= 0),
  add column reference_number text;

create table project_phases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  name_ar text not null,
  name_en text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  unique(id, tenant_id)
);
create index project_phases_tenant_project_idx on project_phases(tenant_id, project_id);

alter table buildings add column phase_id uuid references project_phases(id) on delete set null;

create table unit_types (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  name_ar text not null,
  name_en text,
  property_type property_type not null,
  area_sqm numeric(12,2) not null check(area_sqm>0),
  bedrooms smallint check(bedrooms>=0),
  bathrooms smallint check(bathrooms>=0),
  base_price numeric(14,2) check(base_price>0),
  created_at timestamptz not null default now(),
  unique(id, tenant_id)
);
create index unit_types_tenant_project_idx on unit_types(tenant_id, project_id);

create table units (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  phase_id uuid references project_phases(id) on delete set null,
  building_id uuid references buildings(id) on delete set null,
  unit_type_id uuid not null references unit_types(id) on delete restrict,
  unit_number text not null,
  floor_number smallint,
  area_sqm numeric(12,2) check(area_sqm>0),
  price numeric(14,2) check(price>0),
  orientation text,
  availability unit_availability not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id, project_id, unit_number)
);
create index units_tenant_project_idx on units(tenant_id, project_id);
create index units_tenant_availability_idx on units(tenant_id, availability);

alter table project_phases enable row level security;
alter table unit_types enable row level security;
alter table units enable row level security;
create policy project_phases_tenant_manage on project_phases for all to authenticated using(tenant_id=auth_tenant_id()) with check(tenant_id=auth_tenant_id());
create policy unit_types_tenant_manage on unit_types for all to authenticated using(tenant_id=auth_tenant_id()) with check(tenant_id=auth_tenant_id());
create policy units_tenant_manage on units for all to authenticated using(tenant_id=auth_tenant_id()) with check(tenant_id=auth_tenant_id());