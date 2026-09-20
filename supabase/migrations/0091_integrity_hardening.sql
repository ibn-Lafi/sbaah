-- 0091: Final relationship integrity hardening for unified real-estate core.
-- Adds invariants that should be guaranteed by the database, not only APIs.

-- A viewing with listing context must point to an asset that belongs to that listing.
create or replace function public.validate_viewing_listing_asset()
returns trigger
language plpgsql
security invoker
set search_path=public
as $$
begin
  if new.listing_id is not null and not exists (
    select 1 from listing_assets la
    where la.tenant_id=new.tenant_id
      and la.listing_id=new.listing_id
      and la.asset_id=new.asset_id
  ) then
    raise exception 'viewing asset must belong to the selected listing';
  end if;
  return new;
end $$;

drop trigger if exists viewings_validate_listing_asset on public.viewings;
create trigger viewings_validate_listing_asset
before insert or update of tenant_id,asset_id,listing_id on public.viewings
for each row execute function public.validate_viewing_listing_asset();

-- A reservation with listing context may only reserve assets from that listing.
create or replace function public.validate_reservation_listing_assets()
returns trigger
language plpgsql
security invoker
set search_path=public
as $$
declare v_listing uuid;
begin
  select listing_id into v_listing
  from reservations
  where id=new.reservation_id and tenant_id=new.tenant_id;

  if v_listing is not null and not exists (
    select 1 from listing_assets la
    where la.tenant_id=new.tenant_id
      and la.listing_id=v_listing
      and la.asset_id=new.asset_id
  ) then
    raise exception 'reservation asset must belong to the selected listing';
  end if;
  return new;
end $$;

drop trigger if exists reservation_assets_validate_listing on public.reservation_assets;
create trigger reservation_assets_validate_listing
before insert or update of tenant_id,reservation_id,asset_id on public.reservation_assets
for each row execute function public.validate_reservation_listing_assets();

-- Deal listing context must agree with every linked physical asset.
create or replace function public.validate_deal_listing_assets()
returns trigger
language plpgsql
security invoker
set search_path=public
as $$
declare v_listing uuid;
begin
  select listing_id into v_listing
  from deals
  where id=new.deal_id and tenant_id=new.tenant_id;

  if v_listing is not null and not exists (
    select 1 from listing_assets la
    where la.tenant_id=new.tenant_id
      and la.listing_id=v_listing
      and la.asset_id=new.asset_id
  ) then
    raise exception 'deal asset must belong to the selected listing';
  end if;
  return new;
end $$;

drop trigger if exists deal_assets_validate_listing on public.deal_assets;
create trigger deal_assets_validate_listing
before insert or update of tenant_id,deal_id,asset_id on public.deal_assets
for each row execute function public.validate_deal_listing_assets();

revoke all on function public.validate_viewing_listing_asset() from public,anon,authenticated;
revoke all on function public.validate_reservation_listing_assets() from public,anon,authenticated;
revoke all on function public.validate_deal_listing_assets() from public,anon,authenticated;
