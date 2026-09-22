-- Migration 0101: atomic sale deal closing.
-- Applied manually to Supabase before this repository migration was committed.
create or replace function public.close_sale_deal(p_deal_id uuid,p_sale_value numeric default null)
returns public.deals language plpgsql security invoker set search_path=public as $$
declare v_tenant uuid:=auth_tenant_id(); v_deal public.deals; v_asset_ids uuid[]; v_sale_value numeric; v_reservation public.reservations; v_listing public.listings;
begin
 if v_tenant is null then raise exception 'tenant context is required'; end if;
 if p_deal_id is null then raise exception 'deal id is required'; end if;
 select * into v_deal from public.deals d where d.id=p_deal_id and d.tenant_id=v_tenant for update;
 if not found then raise exception 'deal does not exist in current tenant'; end if;
 if v_deal.deal_type is distinct from 'sale'::deal_type then raise exception 'only sale deals can be closed through close_sale_deal'; end if;
 if v_deal.lead_id is null then raise exception 'sale deal requires a buyer lead'; end if;
 if not exists(select 1 from public.leads l where l.id=v_deal.lead_id and l.tenant_id=v_tenant) then raise exception 'buyer lead does not belong to current tenant'; end if;
 select coalesce(array_agg(da.asset_id order by da.asset_id),array[]::uuid[]) into v_asset_ids from public.deal_assets da where da.tenant_id=v_tenant and da.deal_id=v_deal.id;
 if cardinality(v_asset_ids)=0 then raise exception 'sale deal requires at least one asset'; end if;
 perform public.assert_assets_sellable(v_tenant,v_asset_ids,v_deal.id,v_deal.reservation_id);
 v_sale_value:=coalesce(p_sale_value,v_deal.value);
 if v_sale_value is null then raise exception 'final sale value is required'; end if;
 if v_sale_value<0 then raise exception 'final sale value cannot be negative'; end if;
 if v_deal.reservation_id is not null then
  select * into v_reservation from public.reservations r where r.id=v_deal.reservation_id and r.tenant_id=v_tenant for update;
  if not found then raise exception 'deal reservation does not belong to current tenant'; end if;
  if v_reservation.lead_id is not null and v_reservation.lead_id<>v_deal.lead_id then raise exception 'reservation belongs to a different lead'; end if;
  if exists(select 1 from unnest(v_asset_ids) as deal_asset(asset_id) where not exists(select 1 from public.reservation_assets ra where ra.tenant_id=v_tenant and ra.reservation_id=v_reservation.id and ra.asset_id=deal_asset.asset_id)) then raise exception 'deal assets do not match the linked reservation'; end if;
 end if;
 if v_deal.listing_id is not null then
  select * into v_listing from public.listings l where l.id=v_deal.listing_id and l.tenant_id=v_tenant and l.archived_at is null for update;
  if not found then raise exception 'deal listing does not belong to current tenant or is archived'; end if;
  if v_listing.listing_type is distinct from 'sale'::listing_type_v2 then raise exception 'sale deal must reference a sale listing'; end if;
 end if;
 update public.deals set status='won'::deal_status,value=v_sale_value,closed_at=coalesce(closed_at,now()),lost_reason=null where id=v_deal.id and tenant_id=v_tenant returning * into v_deal;
 if v_deal.reservation_id is not null then update public.reservations set status='converted'::reservation_status,converted_at=coalesce(converted_at,now()) where id=v_deal.reservation_id and tenant_id=v_tenant; end if;
 if v_deal.listing_id is not null then update public.listings set publication_status='paused' where id=v_deal.listing_id and tenant_id=v_tenant and listing_type='sale'::listing_type_v2 and archived_at is null; end if;
 return v_deal;
end $$;
revoke all on function public.close_sale_deal(uuid,numeric) from public,anon;
grant execute on function public.close_sale_deal(uuid,numeric) to authenticated;
comment on function public.close_sale_deal(uuid,numeric) is 'Atomically closes a sale deal: locks assets, validates sale availability, records final sale value and closed_at, converts the linked reservation, and pauses the linked sale listing. Sold remains a derived commercial state; leases do not block investment-property sales.';
create index if not exists deals_tenant_won_sale_idx on public.deals(tenant_id,id) where status='won'::deal_status and deal_type='sale'::deal_type;
