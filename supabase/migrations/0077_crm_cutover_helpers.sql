-- =============================================================================
-- Migration 0077: CRM cutover helpers
-- Leads gain listing/asset context and deals get an atomic bundle writer.
-- Legacy property_id is retained until the final destructive cleanup.
-- =============================================================================

alter table leads
  add column if not exists asset_id uuid,
  add column if not exists listing_id uuid;

alter table leads
  add constraint leads_asset_same_tenant
    foreign key(asset_id,tenant_id) references assets(id,tenant_id) on delete set null (asset_id),
  add constraint leads_listing_same_tenant
    foreign key(listing_id,tenant_id) references listings(id,tenant_id) on delete set null (listing_id);

create index if not exists leads_tenant_asset_idx on leads(tenant_id,asset_id) where asset_id is not null;
create index if not exists leads_tenant_listing_idx on leads(tenant_id,listing_id) where listing_id is not null;

create or replace function create_deal_with_assets(p_deal jsonb,p_asset_ids uuid[])
returns deals
language plpgsql
security invoker
set search_path=public
as $$
declare
  v_tenant uuid := auth_tenant_id();
  v_deal deals;
  v_asset uuid;
begin
  if v_tenant is null then raise exception 'tenant context required'; end if;
  if coalesce(array_length(p_asset_ids,1),0)=0 then raise exception 'at least one asset is required'; end if;

  if (p_deal->>'lead_id') is not null and not exists(
    select 1 from leads where id=(p_deal->>'lead_id')::uuid and tenant_id=v_tenant
  ) then raise exception 'lead does not belong to tenant'; end if;

  if (p_deal->>'listing_id') is not null and not exists(
    select 1 from listings where id=(p_deal->>'listing_id')::uuid and tenant_id=v_tenant
  ) then raise exception 'listing does not belong to tenant'; end if;

  if (p_deal->>'reservation_id') is not null and not exists(
    select 1 from reservations where id=(p_deal->>'reservation_id')::uuid and tenant_id=v_tenant
  ) then raise exception 'reservation does not belong to tenant'; end if;

  if (p_deal->>'responsible_user_id') is not null and not exists(
    select 1 from users where id=(p_deal->>'responsible_user_id')::uuid and tenant_id=v_tenant
  ) then raise exception 'user does not belong to tenant'; end if;

  foreach v_asset in array p_asset_ids loop
    if not exists(select 1 from assets where id=v_asset and tenant_id=v_tenant and archived_at is null)
      then raise exception 'asset % does not belong to tenant or is archived',v_asset;
    end if;
  end loop;

  insert into deals(tenant_id,lead_id,responsible_user_id,status,value,expected_close_date,lost_reason,commission_type,commission_value,deal_type,listing_id,reservation_id)
  values(
    v_tenant,(p_deal->>'lead_id')::uuid,(p_deal->>'responsible_user_id')::uuid,
    coalesce((p_deal->>'status')::deal_status,'open'),(p_deal->>'value')::numeric,(p_deal->>'expected_close_date')::date,
    p_deal->>'lost_reason',p_deal->>'commission_type',(p_deal->>'commission_value')::numeric,
    (p_deal->>'deal_type')::deal_type,(p_deal->>'listing_id')::uuid,(p_deal->>'reservation_id')::uuid
  ) returning * into v_deal;

  insert into deal_assets(tenant_id,deal_id,asset_id)
  select v_tenant,v_deal.id,x from unnest(p_asset_ids) x;

  return v_deal;
end $$;

revoke all on function create_deal_with_assets(jsonb,uuid[]) from public;
grant execute on function create_deal_with_assets(jsonb,uuid[]) to authenticated;
