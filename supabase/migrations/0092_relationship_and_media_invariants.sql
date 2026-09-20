-- 0092: Close parent-update/link-removal integrity gaps and make primary asset media atomic.

create or replace function public.validate_reservation_listing_parent()
returns trigger
language plpgsql
security invoker
set search_path=public
as $$
begin
  if new.listing_id is not null and exists (
    select 1
    from reservation_assets ra
    where ra.tenant_id=new.tenant_id
      and ra.reservation_id=new.id
      and not exists (
        select 1 from listing_assets la
        where la.tenant_id=new.tenant_id
          and la.listing_id=new.listing_id
          and la.asset_id=ra.asset_id
      )
  ) then
    raise exception 'all reservation assets must belong to the selected listing';
  end if;
  return new;
end $$;

drop trigger if exists reservations_validate_listing_parent on public.reservations;
create trigger reservations_validate_listing_parent
before update of tenant_id,listing_id on public.reservations
for each row execute function public.validate_reservation_listing_parent();

create or replace function public.validate_deal_listing_parent()
returns trigger
language plpgsql
security invoker
set search_path=public
as $$
begin
  if new.listing_id is not null and exists (
    select 1
    from deal_assets da
    where da.tenant_id=new.tenant_id
      and da.deal_id=new.id
      and not exists (
        select 1 from listing_assets la
        where la.tenant_id=new.tenant_id
          and la.listing_id=new.listing_id
          and la.asset_id=da.asset_id
      )
  ) then
    raise exception 'all deal assets must belong to the selected listing';
  end if;
  return new;
end $$;

drop trigger if exists deals_validate_listing_parent on public.deals;
create trigger deals_validate_listing_parent
before update of tenant_id,listing_id on public.deals
for each row execute function public.validate_deal_listing_parent();

create or replace function public.protect_referenced_listing_asset()
returns trigger
language plpgsql
security invoker
set search_path=public
as $$
begin
  if exists (
    select 1 from viewings v
    where v.tenant_id=old.tenant_id
      and v.listing_id=old.listing_id
      and v.asset_id=old.asset_id
  ) or exists (
    select 1
    from reservations r
    join reservation_assets ra
      on ra.tenant_id=r.tenant_id and ra.reservation_id=r.id
    where r.tenant_id=old.tenant_id
      and r.listing_id=old.listing_id
      and ra.asset_id=old.asset_id
  ) or exists (
    select 1
    from deals d
    join deal_assets da
      on da.tenant_id=d.tenant_id and da.deal_id=d.id
    where d.tenant_id=old.tenant_id
      and d.listing_id=old.listing_id
      and da.asset_id=old.asset_id
  ) then
    raise exception 'listing asset is referenced by CRM history and cannot be removed or reassigned';
  end if;
  return old;
end $$;

drop trigger if exists listing_assets_protect_referenced_relation on public.listing_assets;
create trigger listing_assets_protect_referenced_relation
before delete or update of tenant_id,listing_id,asset_id on public.listing_assets
for each row execute function public.protect_referenced_listing_asset();

create or replace function public.normalize_asset_media_primary()
returns trigger
language plpgsql
security invoker
set search_path=public
as $$
begin
  if new.is_primary then
    update asset_media
    set is_primary=false
    where tenant_id=new.tenant_id
      and asset_id=new.asset_id
      and is_primary=true
      and id<>new.id;
  end if;
  return new;
end $$;

drop trigger if exists asset_media_normalize_primary on public.asset_media;
create trigger asset_media_normalize_primary
before insert or update of is_primary,asset_id,tenant_id on public.asset_media
for each row execute function public.normalize_asset_media_primary();

revoke all on function public.validate_reservation_listing_parent() from public,anon,authenticated;
revoke all on function public.validate_deal_listing_parent() from public,anon,authenticated;
revoke all on function public.protect_referenced_listing_asset() from public,anon,authenticated;
revoke all on function public.normalize_asset_media_primary() from public,anon,authenticated;
