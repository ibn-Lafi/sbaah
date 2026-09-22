-- 0096: Lease-aware commercial reservation protection.
-- Applied manually to Supabase before this repository migration was committed.

create or replace function public.get_reservation_listing_type(p_tenant_id uuid,p_listing_id uuid)
returns listing_type_v2 language plpgsql stable security invoker set search_path=public as $$
declare v_type listing_type_v2;
begin
 if p_listing_id is null then return null; end if;
 select l.listing_type into v_type from listings l where l.id=p_listing_id and l.tenant_id=p_tenant_id and l.archived_at is null;
 if not found then raise exception 'listing % does not exist in current tenant or is archived',p_listing_id; end if;
 return v_type;
end $$;

create or replace function public.assert_assets_rent_reservable(p_tenant_id uuid,p_asset_ids uuid[],p_ignore_reservation_id uuid default null)
returns void language plpgsql security invoker set search_path=public as $$
declare v_asset_id uuid; v_conflict record;
begin
 if p_asset_ids is null or cardinality(p_asset_ids)=0 then raise exception 'rent reservation requires at least one asset'; end if;
 perform assert_assets_reservable(p_tenant_id,p_asset_ids,p_ignore_reservation_id);
 foreach v_asset_id in array p_asset_ids loop
  select c.id,c.status,c.start_date,c.end_date,ca.asset_id into v_conflict
  from lease_contracts c join lease_contract_assets ca on ca.contract_id=c.id and ca.tenant_id=c.tenant_id
  where c.tenant_id=p_tenant_id and c.status in('upcoming','active')
    and ca.asset_id in(select af.asset_id from asset_family_ids(p_tenant_id,v_asset_id) af)
  order by c.start_date,c.created_at limit 1;
  if found then raise exception 'asset % cannot be reserved for rent because lease contract % already occupies or commits asset %',v_asset_id,v_conflict.id,v_conflict.asset_id; end if;
 end loop;
end $$;

create or replace function public.create_reservation_with_assets(p_reservation jsonb,p_asset_ids uuid[])
returns reservations language plpgsql security invoker set search_path=public as $$
declare v_tenant uuid:=auth_tenant_id(); v_user uuid; v_reservation reservations; v_requested int; v_owned int; v_listing_id uuid; v_listing_type listing_type_v2;
begin
 if v_tenant is null then raise exception 'tenant context is required'; end if;
 v_requested:=coalesce(array_length(p_asset_ids,1),0);
 if v_requested=0 then raise exception 'at least one asset is required'; end if;
 select count(distinct a.id) into v_owned from assets a where a.tenant_id=v_tenant and a.id=any(p_asset_ids) and a.archived_at is null;
 if v_owned<>v_requested then raise exception 'one or more assets do not exist in the current tenant'; end if;
 v_listing_id:=nullif(p_reservation->>'listing_id','')::uuid;
 if v_listing_id is not null then v_listing_type:=get_reservation_listing_type(v_tenant,v_listing_id); else v_listing_type:=null; end if;
 if v_listing_type='rent' then perform assert_assets_rent_reservable(v_tenant,p_asset_ids,null); else perform assert_assets_reservable(v_tenant,p_asset_ids,null); end if;
 select id into v_user from users where tenant_id=v_tenant and auth_user_id=auth.uid() limit 1;
 insert into reservations(tenant_id,reservation_number,lead_id,listing_id,status,reserved_at,expires_at,deposit_amount,notes,created_by)
 values(v_tenant,p_reservation->>'reservation_number',nullif(p_reservation->>'lead_id','')::uuid,v_listing_id,coalesce((p_reservation->>'status')::reservation_status,'pending'),coalesce((p_reservation->>'reserved_at')::timestamptz,now()),nullif(p_reservation->>'expires_at','')::timestamptz,nullif(p_reservation->>'deposit_amount','')::numeric,nullif(p_reservation->>'notes',''),v_user) returning * into v_reservation;
 insert into reservation_assets(tenant_id,reservation_id,asset_id) select v_tenant,v_reservation.id,x from unnest(p_asset_ids)x;
 return v_reservation;
end $$;

create or replace function public.validate_reservation_asset_availability() returns trigger language plpgsql security invoker set search_path=public as $$
declare v_reservation reservations; v_listing_type listing_type_v2;
begin
 select * into v_reservation from reservations where id=new.reservation_id and tenant_id=new.tenant_id;
 if not found then raise exception 'reservation not found'; end if;
 if v_reservation.status in('pending','active') and (v_reservation.expires_at is null or v_reservation.expires_at>now()) then
  if v_reservation.listing_id is not null then v_listing_type:=get_reservation_listing_type(new.tenant_id,v_reservation.listing_id); else v_listing_type:=null; end if;
  if v_listing_type='rent' then perform assert_assets_rent_reservable(new.tenant_id,array[new.asset_id]::uuid[],new.reservation_id); else perform assert_assets_reservable(new.tenant_id,array[new.asset_id]::uuid[],new.reservation_id); end if;
 end if;
 return new;
end $$;

create or replace function public.validate_reservation_activation() returns trigger language plpgsql security invoker set search_path=public as $$
declare v_assets uuid[]; v_listing_type listing_type_v2;
begin
 if new.status in('pending','active') and (new.expires_at is null or new.expires_at>now()) and (old.status is distinct from new.status or old.expires_at is distinct from new.expires_at or old.listing_id is distinct from new.listing_id) then
  select coalesce(array_agg(ra.asset_id order by ra.asset_id),array[]::uuid[]) into v_assets from reservation_assets ra where ra.tenant_id=new.tenant_id and ra.reservation_id=new.id;
  if cardinality(v_assets)>0 then
   if new.listing_id is not null then v_listing_type:=get_reservation_listing_type(new.tenant_id,new.listing_id); else v_listing_type:=null; end if;
   if v_listing_type='rent' then perform assert_assets_rent_reservable(new.tenant_id,v_assets,new.id); else perform assert_assets_reservable(new.tenant_id,v_assets,new.id); end if;
  end if;
 end if;
 return new;
end $$;

drop trigger if exists reservations_validate_activation on reservations;
create trigger reservations_validate_activation before update of status,expires_at,listing_id on reservations for each row execute function validate_reservation_activation();

revoke all on function get_reservation_listing_type(uuid,uuid),assert_assets_rent_reservable(uuid,uuid[],uuid) from public;
grant execute on function get_reservation_listing_type(uuid,uuid),assert_assets_rent_reservable(uuid,uuid[],uuid) to authenticated;
revoke all on function create_reservation_with_assets(jsonb,uuid[]) from public,anon;
grant execute on function create_reservation_with_assets(jsonb,uuid[]) to authenticated;
revoke all on function validate_reservation_asset_availability(),validate_reservation_activation() from public,anon,authenticated;
