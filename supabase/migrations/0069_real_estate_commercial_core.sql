-- =============================================================================
-- Migration 0069: Real-estate commercial core
-- Listings are commercial offers and are deliberately separated from assets.
-- An asset may have multiple listings over time (and sale/rent simultaneously).
-- A listing may cover one or many assets.
-- =============================================================================

create type listing_type_v2 as enum ('sale', 'rent');
create type listing_publication_status as enum ('draft', 'published', 'paused', 'archived');
create type listing_commercial_status as enum ('available', 'reserved', 'under_negotiation', 'closed');
create type listing_pricing_period as enum ('monthly', 'quarterly', 'semi_annual', 'annual');

create table listings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,

  listing_number text not null,
  listing_type listing_type_v2 not null,

  title_ar text not null,
  title_en text,
  description_ar text,
  description_en text,

  asking_price numeric(14,2) not null,
  pricing_period listing_pricing_period,

  publication_status listing_publication_status not null default 'draft',
  commercial_status listing_commercial_status not null default 'available',

  advertisement_license_number text,
  advertisement_license_expires_at date,
  advertiser_name text,
  marketing_mandate_id uuid,

  assigned_user_id uuid,
  created_by uuid,

  published_at timestamptz,
  closed_at timestamptz,
  archived_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (id, tenant_id),
  unique (tenant_id, listing_number),

  check (length(btrim(listing_number)) > 0),
  check (length(btrim(title_ar)) > 0),
  check (asking_price >= 0),

  check (
    (listing_type = 'rent' and pricing_period is not null)
    or
    (listing_type = 'sale' and pricing_period is null)
  ),

  check (
    advertisement_license_expires_at is null
    or advertisement_license_expires_at >= created_at::date
  )
);

-- Same-tenant user relationships.
alter table listings
  add constraint listings_assigned_user_same_tenant
  foreign key (assigned_user_id, tenant_id)
  references users(id, tenant_id)
  on delete set null (assigned_user_id);

alter table listings
  add constraint listings_created_by_same_tenant
  foreign key (created_by, tenant_id)
  references users(id, tenant_id)
  on delete set null (created_by);

-- Keep the existing mandate model during transition, but connect it with
-- same-tenant protection. Its deeper refactor comes before legacy cleanup.
alter table listings
  add constraint listings_marketing_mandate_same_tenant
  foreign key (marketing_mandate_id, tenant_id)
  references marketing_mandates(id, tenant_id)
  on delete set null (marketing_mandate_id);

create index listings_tenant_type_idx
  on listings(tenant_id, listing_type);

create index listings_tenant_publication_idx
  on listings(tenant_id, publication_status);

create index listings_tenant_commercial_idx
  on listings(tenant_id, commercial_status);

create index listings_tenant_assigned_user_idx
  on listings(tenant_id, assigned_user_id)
  where assigned_user_id is not null;

create index listings_tenant_mandate_idx
  on listings(tenant_id, marketing_mandate_id)
  where marketing_mandate_id is not null;

create index listings_public_feed_idx
  on listings(tenant_id, published_at desc)
  where publication_status = 'published' and commercial_status <> 'closed';

create trigger listings_set_updated_at
  before update on listings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Listing ↔ assets (many-to-many)
-- ---------------------------------------------------------------------------
create table listing_assets (
  tenant_id uuid not null references tenants(id) on delete cascade,
  listing_id uuid not null,
  asset_id uuid not null,
  created_at timestamptz not null default now(),

  primary key (listing_id, asset_id),
  unique (listing_id, asset_id, tenant_id),

  foreign key (listing_id, tenant_id)
    references listings(id, tenant_id)
    on delete cascade,

  foreign key (asset_id, tenant_id)
    references assets(id, tenant_id)
    on delete restrict
);

create index listing_assets_tenant_asset_idx
  on listing_assets(tenant_id, asset_id);

create index listing_assets_tenant_listing_idx
  on listing_assets(tenant_id, listing_id);

-- ---------------------------------------------------------------------------
-- Domain validation
-- ---------------------------------------------------------------------------
create or replace function validate_listing_dates_and_state()
returns trigger
language plpgsql
as $$
begin
  if new.publication_status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;

  if new.commercial_status = 'closed' and new.closed_at is null then
    new.closed_at := now();
  end if;

  if new.publication_status = 'archived' and new.archived_at is null then
    new.archived_at := now();
  end if;

  return new;
end;
$$;

create trigger listings_validate_state
  before insert or update of publication_status, commercial_status
  on listings
  for each row execute function validate_listing_dates_and_state();

-- ---------------------------------------------------------------------------
-- RLS
-- Public access is intentionally NOT granted here. The public-site API should
-- expose only validated published listings through the server. This prevents
-- internally managed / Ejar Plus assets from becoming public accidentally.
-- ---------------------------------------------------------------------------
alter table listings enable row level security;
alter table listing_assets enable row level security;

create policy listings_owner_admin_manage
on listings
for all
to authenticated
using (
  tenant_id = auth_tenant_id()
  and auth_user_role() in ('owner', 'admin')
)
with check (
  tenant_id = auth_tenant_id()
  and auth_user_role() in ('owner', 'admin')
  and is_tenant_active(tenant_id)
);

create policy listings_agent_select
on listings
for select
to authenticated
using (
  tenant_id = auth_tenant_id()
  and auth_user_role() = 'agent'
);

create policy listing_assets_owner_admin_manage
on listing_assets
for all
to authenticated
using (
  tenant_id = auth_tenant_id()
  and auth_user_role() in ('owner', 'admin')
)
with check (
  tenant_id = auth_tenant_id()
  and auth_user_role() in ('owner', 'admin')
  and is_tenant_active(tenant_id)
);

create policy listing_assets_agent_select
on listing_assets
for select
to authenticated
using (
  tenant_id = auth_tenant_id()
  and auth_user_role() = 'agent'
);
