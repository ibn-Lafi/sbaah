-- 0095: Canonical commercial availability and concurrency protection.
-- Applied manually to Supabase before this repository migration was committed.

create or replace function public.asset_family_ids(p_tenant_id uuid,p_asset_id uuid)
returns table(asset_id uuid) language sql stable security invoker set search_path=public as $$
with recursive ancestors(id,parent_asset_id) as (
 select a.id,a.parent_asset_id from assets a where a.id=p_asset_id and a.tenant_id=p_tenant_id and a.archived_at is null
 union all
 select p.id,p.parent_asset_id from assets p join ancestors c on p.id=c.parent_asset_id where p.tenant_id=p_tenant_id and p.archived_at is null
), root as (
 (select id from ancestors where parent_asset_id is null limit 1)
 union all
 (select p_asset_id where not exists(select 1 from ancestors where parent_asset_id is null) limit 1)
), descendants(id) as (
 select id from root
 union all
 select c.id from assets c join descendants p on c.parent_asset_id=p.id where c.tenant_id=p_tenant_id and c.archived_at is null
)
select distinct id from descendants;
$$;

create or replace function public.lock_asset_family(p_tenant_id uuid,p_asset_id uuid)
returns void language plpgsql security invoker set search_path=public as $$
begin
 if not exists(select 1 from assets where id=p_asset_id and tenant_id=p_tenant_id and archived_at is null) then raise exception 'asset % does not exist in current tenant',p_asset_id; end if;
 perform a.id from assets a where a.tenant_id=p_tenant_id and a.id in(select f.asset_id from asset_family_ids(p_tenant_id,p_asset_id) f) order by a.id for update;
end $$;

create or replace function public.get_asset_commercial_availability(p_tenant_id uuid,p_asset_id uuid,p_at timestamptz default now())
returns table(status text,reason text,blocking_entity_type text,blocking_entity_id uuid)
language plpgsql stable security invoker set search_path=public as $$
declare v_asset assets; v_block record;
begin
 select * into v_asset from assets where id=p_asset_id and tenant_id=p_tenant_id and archived_at is null;
 if not found then return query select 'physically_unavailable','asset_not_found_or_archived',null::text,null::uuid; return; end if;
 if v_asset.physical_status in ('maintenance','inactive') then return query select 'physically_unavailable','physical_status:'||v_asset.physical_status::text,'asset',v_asset.id; return; end if;
 select d.id into v_block from deals d join deal_assets da on da.deal_id=d.id and da.tenant_id=d.tenant_id where d.tenant_id=p_tenant_id and d.status='won' and d.deal_type='sale' and da.asset_id in(select f.asset_id from asset_family_ids(p_tenant_id,p_asset_id) f) order by d.created_at limit 1;
 if found then return query select 'sold','won_sale_deal','deal',v_block.id; return; end if;
 select r.id into v_block from reservations r join reservation_assets ra on ra.reservation_id=r.id and ra.tenant_id=r.tenant_id where r.tenant_id=p_tenant_id and r.status in('pending','active') and (r.expires_at is null or r.expires_at>p_at) and ra.asset_id in(select f.asset_id from asset_family_ids(p_tenant_id,p_asset_id) f) order by r.reserved_at limit 1;
 if found then return query select 'reserved','active_reservation','reservation',v_block.id; return; end if;
 select c.id into v_block from lease_contracts c join lease_contract_assets ca on ca.contract_id=c.id and ca.tenant_id=c.tenant_id where c.tenant_id=p_tenant_id and c.status in('upcoming','active') and ca.asset_id in(select f.asset_id from asset_family_ids(p_tenant_id,p_asset_id) f) order by c.start_date limit 1;
 if found then return query select 'leased','lease_contract','lease_contract',v_block.id; return; end if;
 return query select 'available','no_commercial_block',null::text,null::uuid;
end $$;

create or replace function public.assert_assets_reservable(p_tenant_id uuid,p_asset_ids uuid[],p_ignore_reservation_id uuid default null)
returns void language plpgsql security invoker set search_path=public as $$
declare v_asset uuid; v_conflict record;
begin
 if p_asset_ids is null or cardinality(p_asset_ids)=0 then raise exception 'reservation requires at least one asset'; end if;
 foreach v_asset in array p_asset_ids loop
  perform lock_asset_family(p_tenant_id,v_asset);
  select d.id into v_conflict from deals d join deal_assets da on da.deal_id=d.id and da.tenant_id=d.tenant_id where d.tenant_id=p_tenant_id and d.status='won' and d.deal_type='sale' and da.asset_id in(select f.asset_id from asset_family_ids(p_tenant_id,v_asset) f) limit 1;
  if found then raise exception 'asset % cannot be reserved because it has already been sold',v_asset; end if;
  select r.id,r.reservation_number,ra.asset_id into v_conflict from reservations r join reservation_assets ra on ra.reservation_id=r.id and ra.tenant_id=r.tenant_id where r.tenant_id=p_tenant_id and (p_ignore_reservation_id is null or r.id<>p_ignore_reservation_id) and r.status in('pending','active') and (r.expires_at is null or r.expires_at>now()) and ra.asset_id in(select f.asset_id from asset_family_ids(p_tenant_id,v_asset) f) limit 1;
  if found then raise exception 'asset % conflicts with active reservation % (%) through asset %',v_asset,v_conflict.reservation_number,v_conflict.id,v_conflict.asset_id; end if;
 end loop;
end $$;

create or replace function public.assert_assets_sellable(p_tenant_id uuid,p_asset_ids uuid[],p_ignore_deal_id uuid default null,p_reservation_id uuid default null)
returns void language plpgsql security invoker set search_path=public as $$
declare v_asset uuid; v_conflict record;
begin
 if p_asset_ids is null or cardinality(p_asset_ids)=0 then raise exception 'sale requires at least one asset'; end if;
 foreach v_asset in array p_asset_ids loop
  perform lock_asset_family(p_tenant_id,v_asset);
  select d.id into v_conflict from deals d join deal_assets da on da.deal_id=d.id and da.tenant_id=d.tenant_id where d.tenant_id=p_tenant_id and d.status='won' and d.deal_type='sale' and (p_ignore_deal_id is null or d.id<>p_ignore_deal_id) and da.asset_id in(select f.asset_id from asset_family_ids(p_tenant_id,v_asset) f) limit 1;
  if found then raise exception 'asset % has already been sold through deal %',v_asset,v_conflict.id; end if;
  select r.id,r.reservation_number into v_conflict from reservations r join reservation_assets ra on ra.reservation_id=r.id and ra.tenant_id=r.tenant_id where r.tenant_id=p_tenant_id and (p_reservation_id is null or r.id<>p_reservation_id) and r.status in('pending','active') and (r.expires_at is null or r.expires_at>now()) and ra.asset_id in(select f.asset_id from asset_family_ids(p_tenant_id,v_asset) f) limit 1;
  if found then raise exception 'asset % is reserved by reservation % (%)',v_asset,v_conflict.reservation_number,v_conflict.id; end if;
 end loop;
end $$;

create or replace function public.create_reservation_with_assets(p_reservation jsonb,p_asset_ids uuid[])
returns reservations language plpgsql security invoker set search_path=public as $$
declare v_tenant uuid:=auth_tenant_id(); v_user uuid; v_row reservations; v_requested int; v_owned int;
begin
 if v_tenant is null then raise exception 'tenant context is required'; end if;
 v_requested:=coalesce(array_length(p_asset_ids,1),0); if v_requested=0 then raise exception 'at least one asset is required'; end if;
 select count(distinct id) into v_owned from assets where tenant_id=v_tenant and id=any(p_asset_ids) and archived_at is null;
 if v_owned<>v_requested then raise exception 'one or more assets do not exist in the current tenant'; end if;
 perform assert_assets_reservable(v_tenant,p_asset_ids,null);
 select id into v_user from users where tenant_id=v_tenant and auth_user_id=auth.uid() limit 1;
 insert into reservations(tenant_id,reservation_number,lead_id,listing_id,status,reserved_at,expires_at,deposit_amount,notes,created_by)
 values(v_tenant,p_reservation->>'reservation_number',nullif(p_reservation->>'lead_id','')::uuid,nullif(p_reservation->>'listing_id','')::uuid,coalesce((p_reservation->>'status')::reservation_status,'pending'),coalesce((p_reservation->>'reserved_at')::timestamptz,now()),nullif(p_reservation->>'expires_at','')::timestamptz,nullif(p_reservation->>'deposit_amount','')::numeric,nullif(p_reservation->>'notes',''),v_user) returning * into v_row;
 insert into reservation_assets(tenant_id,reservation_id,asset_id) select v_tenant,v_row.id,x from unnest(p_asset_ids)x;
 return v_row;
end $$;

create or replace function public.create_deal_with_assets(p_deal jsonb,p_asset_ids uuid[])
returns deals language plpgsql security invoker set search_path=public as $$
declare v_tenant uuid:=auth_tenant_id(); v_row deals; v_asset uuid; v_status deal_status; v_type deal_type; v_res uuid;
begin
 if v_tenant is null then raise exception 'tenant context required'; end if;
 if coalesce(array_length(p_asset_ids,1),0)=0 then raise exception 'at least one asset is required'; end if;
 v_status:=coalesce((p_deal->>'status')::deal_status,'open'); v_type:=(p_deal->>'deal_type')::deal_type; v_res:=nullif(p_deal->>'reservation_id','')::uuid;
 if (p_deal->>'lead_id') is not null and not exists(select 1 from leads where id=(p_deal->>'lead_id')::uuid and tenant_id=v_tenant) then raise exception 'lead does not belong to tenant'; end if;
 if (p_deal->>'listing_id') is not null and not exists(select 1 from listings where id=(p_deal->>'listing_id')::uuid and tenant_id=v_tenant) then raise exception 'listing does not belong to tenant'; end if;
 if v_res is not null and not exists(select 1 from reservations where id=v_res and tenant_id=v_tenant) then raise exception 'reservation does not belong to tenant'; end if;
 if (p_deal->>'responsible_user_id') is not null and not exists(select 1 from users where id=(p_deal->>'responsible_user_id')::uuid and tenant_id=v_tenant) then raise exception 'user does not belong to tenant'; end if;
 foreach v_asset in array p_asset_ids loop if not exists(select 1 from assets where id=v_asset and tenant_id=v_tenant and archived_at is null) then raise exception 'asset % does not belong to tenant or is archived',v_asset; end if; end loop;
 if v_status='won' and v_type='sale' then perform assert_assets_sellable(v_tenant,p_asset_ids,null,v_res); end if;
 insert into deals(tenant_id,lead_id,responsible_user_id,status,value,expected_close_date,lost_reason,commission_type,commission_value,deal_type,listing_id,reservation_id)
 values(v_tenant,(p_deal->>'lead_id')::uuid,nullif(p_deal->>'responsible_user_id','')::uuid,v_status,nullif(p_deal->>'value','')::numeric,nullif(p_deal->>'expected_close_date','')::date,p_deal->>'lost_reason',p_deal->>'commission_type',nullif(p_deal->>'commission_value','')::numeric,v_type,nullif(p_deal->>'listing_id','')::uuid,v_res) returning * into v_row;
 insert into deal_assets(tenant_id,deal_id,asset_id) select v_tenant,v_row.id,x from unnest(p_asset_ids)x;
 return v_row;
end $$;

create or replace function public.validate_won_sale_deal_availability() returns trigger language plpgsql security invoker set search_path=public as $$
declare v_assets uuid[];
begin
 if new.status='won' and new.deal_type='sale' and (old.status is distinct from new.status or old.deal_type is distinct from new.deal_type or old.reservation_id is distinct from new.reservation_id) then
  select coalesce(array_agg(asset_id),array[]::uuid[]) into v_assets from deal_assets where tenant_id=new.tenant_id and deal_id=new.id;
  if cardinality(v_assets)>0 then perform assert_assets_sellable(new.tenant_id,v_assets,new.id,new.reservation_id); end if;
 end if; return new;
end $$;
drop trigger if exists deals_validate_won_sale_availability on deals;
create trigger deals_validate_won_sale_availability before update of status,deal_type,reservation_id on deals for each row execute function validate_won_sale_deal_availability();

create or replace function public.validate_won_sale_deal_asset() returns trigger language plpgsql security invoker set search_path=public as $$
declare d deals;
begin
 select * into d from deals where id=new.deal_id and tenant_id=new.tenant_id; if not found then raise exception 'deal not found'; end if;
 if d.status='won' and d.deal_type='sale' then perform assert_assets_sellable(new.tenant_id,array[new.asset_id]::uuid[],new.deal_id,d.reservation_id); end if; return new;
end $$;
drop trigger if exists deal_assets_validate_won_sale on deal_assets;
create trigger deal_assets_validate_won_sale before insert or update of tenant_id,deal_id,asset_id on deal_assets for each row execute function validate_won_sale_deal_asset();

create or replace function public.validate_reservation_asset_availability() returns trigger language plpgsql security invoker set search_path=public as $$
declare r reservations;
begin
 select * into r from reservations where id=new.reservation_id and tenant_id=new.tenant_id; if not found then raise exception 'reservation not found'; end if;
 if r.status in('pending','active') and (r.expires_at is null or r.expires_at>now()) then perform assert_assets_reservable(new.tenant_id,array[new.asset_id]::uuid[],new.reservation_id); end if; return new;
end $$;
drop trigger if exists reservation_assets_validate_availability on reservation_assets;
create trigger reservation_assets_validate_availability before insert or update of tenant_id,reservation_id,asset_id on reservation_assets for each row execute function validate_reservation_asset_availability();

create or replace function public.validate_reservation_activation() returns trigger language plpgsql security invoker set search_path=public as $$
declare v_assets uuid[];
begin
 if new.status in('pending','active') and (new.expires_at is null or new.expires_at>now()) and (old.status is distinct from new.status or old.expires_at is distinct from new.expires_at) then
  select coalesce(array_agg(asset_id),array[]::uuid[]) into v_assets from reservation_assets where tenant_id=new.tenant_id and reservation_id=new.id;
  if cardinality(v_assets)>0 then perform assert_assets_reservable(new.tenant_id,v_assets,new.id); end if;
 end if; return new;
end $$;
drop trigger if exists reservations_validate_activation on reservations;
create trigger reservations_validate_activation before update of status,expires_at on reservations for each row execute function validate_reservation_activation();

revoke all on function asset_family_ids(uuid,uuid),lock_asset_family(uuid,uuid),get_asset_commercial_availability(uuid,uuid,timestamptz),assert_assets_reservable(uuid,uuid[],uuid),assert_assets_sellable(uuid,uuid[],uuid,uuid) from public;
revoke all on function create_reservation_with_assets(jsonb,uuid[]),create_deal_with_assets(jsonb,uuid[]) from public,anon;
grant execute on function create_reservation_with_assets(jsonb,uuid[]),create_deal_with_assets(jsonb,uuid[]),get_asset_commercial_availability(uuid,uuid,timestamptz),asset_family_ids(uuid,uuid),lock_asset_family(uuid,uuid),assert_assets_reservable(uuid,uuid[],uuid),assert_assets_sellable(uuid,uuid[],uuid,uuid) to authenticated;
revoke all on function validate_won_sale_deal_availability(),validate_won_sale_deal_asset(),validate_reservation_asset_availability(),validate_reservation_activation() from public,anon,authenticated;
