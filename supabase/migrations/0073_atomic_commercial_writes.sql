-- =============================================================================
-- Migration 0073: Atomic commercial write functions
-- Multi-table listing/reservation creation must succeed or roll back as one DB
-- transaction. Functions are SECURITY INVOKER so existing RLS remains active.
-- =============================================================================

create or replace function create_listing_with_assets(
  p_listing jsonb,
  p_asset_ids uuid[]
)
returns listings
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tenant uuid := auth_tenant_id();
  v_user uuid;
  v_listing listings;
  v_requested integer;
  v_owned integer;
begin
  if v_tenant is null then raise exception 'tenant context is required'; end if;
  v_requested := coalesce(array_length(p_asset_ids,1),0);
  if v_requested = 0 then raise exception 'at least one asset is required'; end if;

  select count(distinct id) into v_owned
  from assets
  where tenant_id=v_tenant and id=any(p_asset_ids) and archived_at is null;
  if v_owned<>v_requested then raise exception 'one or more assets do not exist in the current tenant'; end if;

  select id into v_user from users
  where tenant_id=v_tenant and auth_user_id=auth.uid() limit 1;

  insert into listings(
    tenant_id,listing_number,listing_type,title_ar,title_en,description_ar,description_en,
    asking_price,pricing_period,advertisement_license_number,advertisement_license_expires_at,
    advertiser_name,marketing_mandate_id,assigned_user_id,created_by
  ) values (
    v_tenant,
    p_listing->>'listing_number',
    (p_listing->>'listing_type')::listing_type_v2,
    p_listing->>'title_ar',
    nullif(p_listing->>'title_en',''),
    nullif(p_listing->>'description_ar',''),
    nullif(p_listing->>'description_en',''),
    (p_listing->>'asking_price')::numeric,
    case when nullif(p_listing->>'pricing_period','') is null then null else (p_listing->>'pricing_period')::listing_pricing_period end,
    nullif(p_listing->>'advertisement_license_number',''),
    case when nullif(p_listing->>'advertisement_license_expires_at','') is null then null else (p_listing->>'advertisement_license_expires_at')::date end,
    nullif(p_listing->>'advertiser_name',''),
    case when nullif(p_listing->>'marketing_mandate_id','') is null then null else (p_listing->>'marketing_mandate_id')::uuid end,
    case when nullif(p_listing->>'assigned_user_id','') is null then null else (p_listing->>'assigned_user_id')::uuid end,
    v_user
  ) returning * into v_listing;

  insert into listing_assets(tenant_id,listing_id,asset_id)
  select v_tenant,v_listing.id,x from unnest(p_asset_ids) x;

  return v_listing;
end;
$$;

create or replace function create_reservation_with_assets(
  p_reservation jsonb,
  p_asset_ids uuid[]
)
returns reservations
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tenant uuid := auth_tenant_id();
  v_user uuid;
  v_reservation reservations;
  v_requested integer;
  v_owned integer;
begin
  if v_tenant is null then raise exception 'tenant context is required'; end if;
  v_requested := coalesce(array_length(p_asset_ids,1),0);
  if v_requested = 0 then raise exception 'at least one asset is required'; end if;

  select count(distinct id) into v_owned
  from assets
  where tenant_id=v_tenant and id=any(p_asset_ids) and archived_at is null;
  if v_owned<>v_requested then raise exception 'one or more assets do not exist in the current tenant'; end if;

  select id into v_user from users
  where tenant_id=v_tenant and auth_user_id=auth.uid() limit 1;

  insert into reservations(
    tenant_id,reservation_number,lead_id,listing_id,status,reserved_at,expires_at,
    deposit_amount,notes,created_by
  ) values (
    v_tenant,
    p_reservation->>'reservation_number',
    case when nullif(p_reservation->>'lead_id','') is null then null else (p_reservation->>'lead_id')::uuid end,
    case when nullif(p_reservation->>'listing_id','') is null then null else (p_reservation->>'listing_id')::uuid end,
    coalesce((p_reservation->>'status')::reservation_status,'pending'::reservation_status),
    coalesce((p_reservation->>'reserved_at')::timestamptz,now()),
    case when nullif(p_reservation->>'expires_at','') is null then null else (p_reservation->>'expires_at')::timestamptz end,
    case when nullif(p_reservation->>'deposit_amount','') is null then null else (p_reservation->>'deposit_amount')::numeric end,
    nullif(p_reservation->>'notes',''),
    v_user
  ) returning * into v_reservation;

  insert into reservation_assets(tenant_id,reservation_id,asset_id)
  select v_tenant,v_reservation.id,x from unnest(p_asset_ids) x;

  return v_reservation;
end;
$$;

revoke all on function create_listing_with_assets(jsonb,uuid[]) from public;
revoke all on function create_reservation_with_assets(jsonb,uuid[]) from public;
grant execute on function create_listing_with_assets(jsonb,uuid[]) to authenticated;
grant execute on function create_reservation_with_assets(jsonb,uuid[]) to authenticated;
