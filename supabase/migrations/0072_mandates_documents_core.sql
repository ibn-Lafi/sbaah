-- =============================================================================
-- Migration 0072: Mandates + shared document links
-- Connects auxiliary domains to the unified real-estate core.
-- Legacy documents.owner_type/owner_id remain until application migration.
-- =============================================================================

create type marketing_mandate_status as enum ('draft','active','expired','cancelled');
create type marketing_mandate_type as enum ('sale','rent','sale_and_rent');
create type commission_type as enum ('fixed','percentage');

alter table marketing_mandates
  add column owner_party_id uuid,
  add column mandate_type marketing_mandate_type,
  add column commission_type commission_type,
  add column commission_value numeric(14,4) check(commission_value is null or commission_value>=0),
  add column status marketing_mandate_status not null default 'draft',
  add column updated_at timestamptz not null default now();

alter table marketing_mandates
  add constraint marketing_mandates_owner_party_same_tenant
  foreign key(owner_party_id,tenant_id) references parties(id,tenant_id) on delete set null (owner_party_id),
  add constraint marketing_mandates_dates_check
  check(expires_at is null or starts_at is null or expires_at>=starts_at),
  add constraint marketing_mandates_percentage_check
  check(commission_type is distinct from 'percentage' or commission_value is null or commission_value<=100),
  add constraint marketing_mandates_commission_pair_check
  check((commission_type is null and commission_value is null) or (commission_type is not null and commission_value is not null));

create index marketing_mandates_tenant_owner_idx on marketing_mandates(tenant_id,owner_party_id) where owner_party_id is not null;
create index marketing_mandates_tenant_status_idx on marketing_mandates(tenant_id,status);
create trigger marketing_mandates_set_updated_at before update on marketing_mandates for each row execute function set_updated_at();

create table marketing_mandate_assets (
  tenant_id uuid not null references tenants(id) on delete cascade,
  marketing_mandate_id uuid not null,
  asset_id uuid not null,
  created_at timestamptz not null default now(),
  primary key(marketing_mandate_id,asset_id),
  foreign key(marketing_mandate_id,tenant_id) references marketing_mandates(id,tenant_id) on delete cascade,
  foreign key(asset_id,tenant_id) references assets(id,tenant_id) on delete restrict
);
create index marketing_mandate_assets_tenant_asset_idx on marketing_mandate_assets(tenant_id,asset_id);

-- Documents become reusable records. owner_type/owner_id stay temporarily so
-- current code keeps working until it is moved to document_links.
alter table documents
  add constraint documents_id_tenant_unique unique(id,tenant_id);

alter table documents
  drop constraint if exists documents_created_by_fkey;

alter table documents
  add constraint documents_created_by_same_tenant
  foreign key(created_by,tenant_id) references users(id,tenant_id) on delete set null (created_by);

create type document_entity_type as enum (
  'asset','project','listing','marketing_mandate','reservation','deal',
  'lease_contract','maintenance_request','party'
);

create table document_links (
  tenant_id uuid not null references tenants(id) on delete cascade,
  document_id uuid not null,
  entity_type document_entity_type not null,
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  primary key(document_id,entity_type,entity_id),
  foreign key(document_id,tenant_id) references documents(id,tenant_id) on delete cascade
);
create index document_links_tenant_entity_idx on document_links(tenant_id,entity_type,entity_id);

-- Validate polymorphic auxiliary links against the real parent table and tenant.
create or replace function validate_document_link_entity()
returns trigger language plpgsql as $$
declare ok boolean;
begin
  case new.entity_type
    when 'asset' then select exists(select 1 from assets where id=new.entity_id and tenant_id=new.tenant_id) into ok;
    when 'project' then select exists(select 1 from projects where id=new.entity_id and tenant_id=new.tenant_id) into ok;
    when 'listing' then select exists(select 1 from listings where id=new.entity_id and tenant_id=new.tenant_id) into ok;
    when 'marketing_mandate' then select exists(select 1 from marketing_mandates where id=new.entity_id and tenant_id=new.tenant_id) into ok;
    when 'reservation' then select exists(select 1 from reservations where id=new.entity_id and tenant_id=new.tenant_id) into ok;
    when 'deal' then select exists(select 1 from deals where id=new.entity_id and tenant_id=new.tenant_id) into ok;
    when 'lease_contract' then select exists(select 1 from lease_contracts where id=new.entity_id and tenant_id=new.tenant_id) into ok;
    when 'maintenance_request' then select exists(select 1 from maintenance_requests where id=new.entity_id and tenant_id=new.tenant_id) into ok;
    when 'party' then select exists(select 1 from parties where id=new.entity_id and tenant_id=new.tenant_id) into ok;
  end case;
  if not coalesce(ok,false) then raise exception 'document link entity does not exist in the same tenant'; end if;
  return new;
end $$;
create trigger document_links_validate_entity before insert or update on document_links for each row execute function validate_document_link_entity();

alter table marketing_mandate_assets enable row level security;
alter table document_links enable row level security;

drop policy if exists marketing_mandates_tenant_manage on marketing_mandates;
create policy marketing_mandates_owner_admin_manage on marketing_mandates for all to authenticated
  using(tenant_id=auth_tenant_id() and auth_user_role() in ('owner','admin'))
  with check(tenant_id=auth_tenant_id() and auth_user_role() in ('owner','admin') and is_tenant_active(tenant_id));
create policy marketing_mandates_agent_select on marketing_mandates for select to authenticated
  using(tenant_id=auth_tenant_id() and auth_user_role()='agent');

create policy marketing_mandate_assets_owner_admin_manage on marketing_mandate_assets for all to authenticated
  using(tenant_id=auth_tenant_id() and auth_user_role() in ('owner','admin'))
  with check(tenant_id=auth_tenant_id() and auth_user_role() in ('owner','admin') and is_tenant_active(tenant_id));
create policy marketing_mandate_assets_agent_select on marketing_mandate_assets for select to authenticated
  using(tenant_id=auth_tenant_id() and auth_user_role()='agent');

create policy document_links_tenant_manage on document_links for all to authenticated
  using(tenant_id=auth_tenant_id())
  with check(tenant_id=auth_tenant_id() and is_tenant_active(tenant_id));

revoke all on marketing_mandate_assets,document_links from anon,authenticated;
grant select,insert,update,delete on marketing_mandate_assets,document_links to authenticated;
