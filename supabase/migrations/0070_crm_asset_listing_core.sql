-- =============================================================================
-- Migration 0070: CRM asset/listing relationships + reservations
-- Transitional: legacy property_id/unit_id columns remain until all APIs/UI
-- have moved, then the legacy cleanup migration removes them.
-- =============================================================================

create type reservation_status as enum ('pending','active','expired','cancelled','converted');
create type deal_type as enum ('sale','rent');

-- Lead requirements: introduce the new commercial/asset vocabulary while
-- retaining legacy purpose/property_types until application migration.
alter table lead_requirements
  add column purpose_v2 listing_type_v2,
  add column asset_types asset_type[] not null default '{}';

-- Lead interests may point to exactly one new-domain target. During transition,
-- old property_id/unit_id rows are allowed as well.
alter table lead_interests
  drop constraint if exists lead_interests_check,
  add column project_id uuid,
  add column unit_type_id uuid,
  add column asset_id uuid,
  add column listing_id uuid,
  add column priority smallint check (priority is null or priority between 1 and 5),
  add column notes text;

alter table lead_interests
  add constraint lead_interests_project_same_tenant
    foreign key(project_id,tenant_id) references projects(id,tenant_id) on delete cascade,
  add constraint lead_interests_unit_type_same_tenant
    foreign key(unit_type_id,tenant_id) references unit_types(id,tenant_id) on delete cascade,
  add constraint lead_interests_asset_same_tenant
    foreign key(asset_id,tenant_id) references assets(id,tenant_id) on delete cascade,
  add constraint lead_interests_listing_same_tenant
    foreign key(listing_id,tenant_id) references listings(id,tenant_id) on delete cascade;

alter table lead_interests
  add constraint lead_interests_single_target_v2 check (
    (property_id is not null)::int +
    (unit_id is not null)::int +
    (project_id is not null)::int +
    (unit_type_id is not null)::int +
    (asset_id is not null)::int +
    (listing_id is not null)::int = 1
  );

create index lead_interests_tenant_project_idx on lead_interests(tenant_id,project_id) where project_id is not null;
create index lead_interests_tenant_unit_type_idx on lead_interests(tenant_id,unit_type_id) where unit_type_id is not null;
create index lead_interests_tenant_asset_idx on lead_interests(tenant_id,asset_id) where asset_id is not null;
create index lead_interests_tenant_listing_idx on lead_interests(tenant_id,listing_id) where listing_id is not null;

-- Leads are no longer conceptually bound to one property. The legacy column is
-- intentionally retained until application migration, then removed.
-- Viewings target a physical asset and may preserve listing context.
alter table viewings
  drop constraint if exists viewings_check,
  add column asset_id uuid,
  add column listing_id uuid;

alter table viewings
  add constraint viewings_asset_same_tenant
    foreign key(asset_id,tenant_id) references assets(id,tenant_id) on delete restrict,
  add constraint viewings_listing_same_tenant
    foreign key(listing_id,tenant_id) references listings(id,tenant_id) on delete set null (listing_id);

alter table viewings
  add constraint viewings_single_physical_target_transition check (
    (property_id is not null)::int +
    (unit_id is not null)::int +
    (asset_id is not null)::int = 1
  );

create index viewings_tenant_asset_idx on viewings(tenant_id,asset_id) where asset_id is not null;
create index viewings_tenant_listing_idx on viewings(tenant_id,listing_id) where listing_id is not null;

-- Reservations are commercial holds and can cover multiple assets.
create table reservations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  reservation_number text not null,
  lead_id uuid,
  listing_id uuid,
  status reservation_status not null default 'pending',
  reserved_at timestamptz not null default now(),
  expires_at timestamptz,
  deposit_amount numeric(14,2) check (deposit_amount is null or deposit_amount >= 0),
  notes text,
  created_by uuid,
  converted_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id,tenant_id),
  unique(tenant_id,reservation_number),
  check(length(btrim(reservation_number)) > 0),
  check(expires_at is null or expires_at > reserved_at)
);

alter table reservations
  add constraint reservations_lead_same_tenant
    foreign key(lead_id,tenant_id) references leads(id,tenant_id) on delete set null (lead_id),
  add constraint reservations_listing_same_tenant
    foreign key(listing_id,tenant_id) references listings(id,tenant_id) on delete set null (listing_id),
  add constraint reservations_created_by_same_tenant
    foreign key(created_by,tenant_id) references users(id,tenant_id) on delete set null (created_by);

create index reservations_tenant_status_idx on reservations(tenant_id,status);
create index reservations_tenant_expiry_idx on reservations(tenant_id,expires_at) where expires_at is not null;
create index reservations_tenant_lead_idx on reservations(tenant_id,lead_id) where lead_id is not null;
create index reservations_tenant_listing_idx on reservations(tenant_id,listing_id) where listing_id is not null;

create trigger reservations_set_updated_at before update on reservations
for each row execute function set_updated_at();

create table reservation_assets (
  tenant_id uuid not null references tenants(id) on delete cascade,
  reservation_id uuid not null,
  asset_id uuid not null,
  created_at timestamptz not null default now(),
  primary key(reservation_id,asset_id),
  foreign key(reservation_id,tenant_id) references reservations(id,tenant_id) on delete cascade,
  foreign key(asset_id,tenant_id) references assets(id,tenant_id) on delete restrict
);
create index reservation_assets_tenant_asset_idx on reservation_assets(tenant_id,asset_id);

-- Deals gain commercial context and many-to-many physical assets.
alter table deals
  add column deal_type deal_type,
  add column listing_id uuid,
  add column reservation_id uuid,
  add column closed_at timestamptz;

alter table deals
  add constraint deals_listing_same_tenant
    foreign key(listing_id,tenant_id) references listings(id,tenant_id) on delete set null (listing_id),
  add constraint deals_reservation_same_tenant
    foreign key(reservation_id,tenant_id) references reservations(id,tenant_id) on delete set null (reservation_id);

create index deals_tenant_listing_idx on deals(tenant_id,listing_id) where listing_id is not null;
create index deals_tenant_reservation_idx on deals(tenant_id,reservation_id) where reservation_id is not null;

create table deal_assets (
  tenant_id uuid not null references tenants(id) on delete cascade,
  deal_id uuid not null,
  asset_id uuid not null,
  created_at timestamptz not null default now(),
  primary key(deal_id,asset_id),
  foreign key(deal_id,tenant_id) references deals(id,tenant_id) on delete cascade,
  foreign key(asset_id,tenant_id) references assets(id,tenant_id) on delete restrict
);
create index deal_assets_tenant_asset_idx on deal_assets(tenant_id,asset_id);

-- RLS / grants for new reservation and junction tables.
alter table reservations enable row level security;
alter table reservation_assets enable row level security;
alter table deal_assets enable row level security;

create policy reservations_tenant_manage on reservations for all to authenticated
  using(tenant_id=auth_tenant_id())
  with check(tenant_id=auth_tenant_id() and is_tenant_active(tenant_id));

create policy reservation_assets_tenant_manage on reservation_assets for all to authenticated
  using(tenant_id=auth_tenant_id())
  with check(tenant_id=auth_tenant_id() and is_tenant_active(tenant_id));

create policy deal_assets_tenant_manage on deal_assets for all to authenticated
  using(tenant_id=auth_tenant_id())
  with check(tenant_id=auth_tenant_id() and is_tenant_active(tenant_id));

revoke all on reservations,reservation_assets,deal_assets from anon,authenticated;
grant select,insert,update,delete on reservations,reservation_assets,deal_assets to authenticated;
