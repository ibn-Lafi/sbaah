-- 0083: Ejar Plus lease occupancy conflict engine.
-- Prevent overlapping occupancy for the same asset or any ancestor/descendant asset.
-- Draft/cancelled/terminated contracts do not occupy assets.

create or replace function public.assert_lease_contract_no_asset_conflicts(
  p_tenant_id uuid,
  p_contract_id uuid,
  p_asset_ids uuid[],
  p_start_date date,
  p_end_date date,
  p_status lease_contract_status
)
returns void
language plpgsql
security invoker
set search_path=public
as $$
declare
  v_asset_id uuid;
  v_conflict record;
begin
  if p_status in ('draft','cancelled','terminated') then return; end if;
  if p_asset_ids is null or cardinality(p_asset_ids)=0 then
    raise exception 'lease contract requires at least one asset';
  end if;

  foreach v_asset_id in array p_asset_ids loop
    if not exists(select 1 from assets a where a.id=v_asset_id and a.tenant_id=p_tenant_id and a.archived_at is null) then
      raise exception 'lease asset % not found in current tenant',v_asset_id;
    end if;

    with recursive requested_family(id) as (
      select v_asset_id
      union
      select a.parent_asset_id from assets a join requested_family f on a.id=f.id
      where a.tenant_id=p_tenant_id and a.parent_asset_id is not null
      union
      select a.id from assets a join requested_family f on a.parent_asset_id=f.id
      where a.tenant_id=p_tenant_id
    )
    select c.id,c.contract_number,ca.asset_id
      into v_conflict
    from lease_contracts c
    join lease_contract_assets ca on ca.contract_id=c.id and ca.tenant_id=c.tenant_id
    where c.tenant_id=p_tenant_id
      and c.id<>p_contract_id
      and c.status in ('upcoming','active','expired')
      and daterange(c.start_date,c.end_date,'[]') && daterange(p_start_date,p_end_date,'[]')
      and ca.asset_id in (select id from requested_family)
    limit 1;

    if found then
      raise exception 'lease occupancy conflict: asset % conflicts with contract % (%) through asset %',
        v_asset_id,v_conflict.contract_number,v_conflict.id,v_conflict.asset_id;
    end if;
  end loop;
end $$;

create or replace function public.validate_lease_contract_occupancy()
returns trigger
language plpgsql
security invoker
set search_path=public
as $$
declare v_assets uuid[];
begin
  select coalesce(array_agg(asset_id),array[]::uuid[]) into v_assets
  from lease_contract_assets
  where contract_id=new.id and tenant_id=new.tenant_id;

  -- During bundle creation assets are attached after the contract row.
  if cardinality(v_assets)>0 then
    perform assert_lease_contract_no_asset_conflicts(new.tenant_id,new.id,v_assets,new.start_date,new.end_date,new.status);
  end if;
  return new;
end $$;

create or replace function public.validate_lease_asset_occupancy()
returns trigger
language plpgsql
security invoker
set search_path=public
as $$
declare c lease_contracts; v_assets uuid[];
begin
  select * into c from lease_contracts where id=new.contract_id and tenant_id=new.tenant_id;
  if not found then raise exception 'lease contract not found'; end if;

  select array_agg(x.asset_id) into v_assets
  from (
    select asset_id from lease_contract_assets where contract_id=c.id and tenant_id=c.tenant_id
    union
    select new.asset_id
  ) x;

  perform assert_lease_contract_no_asset_conflicts(c.tenant_id,c.id,v_assets,c.start_date,c.end_date,c.status);
  return new;
end $$;

drop trigger if exists lease_contracts_validate_occupancy on lease_contracts;
create trigger lease_contracts_validate_occupancy
before update of start_date,end_date,status on lease_contracts
for each row execute function validate_lease_contract_occupancy();

drop trigger if exists lease_contract_assets_validate_occupancy on lease_contract_assets;
create trigger lease_contract_assets_validate_occupancy
before insert or update of asset_id,contract_id on lease_contract_assets
for each row execute function validate_lease_asset_occupancy();

revoke all on function assert_lease_contract_no_asset_conflicts(uuid,uuid,uuid[],date,date,lease_contract_status) from public;
grant execute on function assert_lease_contract_no_asset_conflicts(uuid,uuid,uuid[],date,date,lease_contract_status) to authenticated;
