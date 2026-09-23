-- =============================================================================
-- Migration 0109: agents only reach the CRM records of their own leads
-- Run after 0108.
--
-- The API scopes an agent (role 'agent', data scope 'assigned') to leads
-- assigned to them, but the CRM tables beneath it still had tenant-wide
-- FOR ALL policies (migrations 0056/0057/0058/0070). With the public anon
-- key, any agent could read and rewrite every other agent's deals (values,
-- commissions), viewings, tasks, reservations, activities, interests and
-- requirements directly through PostgREST — and close_sale_deal() (SECURITY
-- INVOKER) let them close another agent's sale.
--
-- An agent now sees a CRM record when its lead is assigned to them, or when
-- the record itself is assigned to them; they create records only for their
-- own leads and change only records assigned to them. Owners/admins keep
-- tenant-wide access. Writes also respect the suspended/expired-tenant
-- read-only lock, as leads already do (migration 0019).
--
-- The commercial availability engine (migrations 0095/0096) runs inside the
-- caller's transaction. Once agents can no longer see each other's
-- reservations and deals, its conflict checks would silently miss them, so
-- those checks now run as SECURITY DEFINER behind a caller-tenant guard.
-- This also fixes lock_asset_family() taking no row locks at all for agents
-- (SELECT ... FOR UPDATE needs an UPDATE policy agents never had), which let
-- two agents reserve or sell the same unit concurrently.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function auth_can_access_lead(p_lead_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from leads l
    where l.id = p_lead_id
      and l.tenant_id = auth_tenant_id()
      and (auth_user_role() in ('owner', 'admin') or l.assigned_agent_id = auth_app_user_id())
  );
$$;

revoke all on function auth_can_access_lead(uuid) from public, anon;
grant execute on function auth_can_access_lead(uuid) to authenticated;

-- A JWT caller may only run tenant-parameterized engine functions for their
-- own tenant; the service role (no auth.uid()) is unrestricted.
create or replace function assert_caller_tenant(p_tenant_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and p_tenant_id is distinct from auth_tenant_id() then
    raise exception 'tenant % is not the caller''s tenant', p_tenant_id using errcode = '42501';
  end if;
end;
$$;

revoke all on function assert_caller_tenant(uuid) from public, anon;
grant execute on function assert_caller_tenant(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Leads' satellite records: visible/editable with the lead itself
-- ---------------------------------------------------------------------------
drop policy if exists lead_interests_tenant_manage on lead_interests;
drop policy if exists lead_interests_scoped_select on lead_interests;
drop policy if exists lead_interests_scoped_insert on lead_interests;
drop policy if exists lead_interests_scoped_update on lead_interests;
drop policy if exists lead_interests_manager_delete on lead_interests;
create policy lead_interests_scoped_select on lead_interests for select to authenticated
  using (tenant_id = (select auth_tenant_id()) and auth_can_access_lead(lead_id));
create policy lead_interests_scoped_insert on lead_interests for insert to authenticated
  with check (tenant_id = (select auth_tenant_id()) and is_tenant_active(tenant_id) and auth_can_access_lead(lead_id));
create policy lead_interests_scoped_update on lead_interests for update to authenticated
  using (tenant_id = (select auth_tenant_id()) and auth_can_access_lead(lead_id))
  with check (tenant_id = (select auth_tenant_id()) and is_tenant_active(tenant_id) and auth_can_access_lead(lead_id));
create policy lead_interests_manager_delete on lead_interests for delete to authenticated
  using (tenant_id = (select auth_tenant_id()) and (select auth_user_role()) in ('owner', 'admin') and is_tenant_active(tenant_id));

drop policy if exists lead_requirements_tenant_manage on lead_requirements;
drop policy if exists lead_requirements_scoped_select on lead_requirements;
drop policy if exists lead_requirements_scoped_insert on lead_requirements;
drop policy if exists lead_requirements_scoped_update on lead_requirements;
drop policy if exists lead_requirements_manager_delete on lead_requirements;
create policy lead_requirements_scoped_select on lead_requirements for select to authenticated
  using (tenant_id = (select auth_tenant_id()) and auth_can_access_lead(lead_id));
create policy lead_requirements_scoped_insert on lead_requirements for insert to authenticated
  with check (tenant_id = (select auth_tenant_id()) and is_tenant_active(tenant_id) and auth_can_access_lead(lead_id));
create policy lead_requirements_scoped_update on lead_requirements for update to authenticated
  using (tenant_id = (select auth_tenant_id()) and auth_can_access_lead(lead_id))
  with check (tenant_id = (select auth_tenant_id()) and is_tenant_active(tenant_id) and auth_can_access_lead(lead_id));
create policy lead_requirements_manager_delete on lead_requirements for delete to authenticated
  using (tenant_id = (select auth_tenant_id()) and (select auth_user_role()) in ('owner', 'admin') and is_tenant_active(tenant_id));

-- Activities are an audit trail: members log under their own name, only
-- owners/admins may correct or remove entries.
drop policy if exists crm_activities_tenant_manage on crm_activities;
drop policy if exists crm_activities_scoped_select on crm_activities;
drop policy if exists crm_activities_scoped_insert on crm_activities;
drop policy if exists crm_activities_manager_update on crm_activities;
drop policy if exists crm_activities_manager_delete on crm_activities;
create policy crm_activities_scoped_select on crm_activities for select to authenticated
  using (tenant_id = (select auth_tenant_id()) and auth_can_access_lead(lead_id));
create policy crm_activities_scoped_insert on crm_activities for insert to authenticated
  with check (
    tenant_id = (select auth_tenant_id()) and is_tenant_active(tenant_id) and auth_can_access_lead(lead_id)
    and ((select auth_user_role()) in ('owner', 'admin') or user_id = (select auth_app_user_id()))
  );
create policy crm_activities_manager_update on crm_activities for update to authenticated
  using (tenant_id = (select auth_tenant_id()) and (select auth_user_role()) in ('owner', 'admin'))
  with check (tenant_id = (select auth_tenant_id()) and (select auth_user_role()) in ('owner', 'admin') and is_tenant_active(tenant_id));
create policy crm_activities_manager_delete on crm_activities for delete to authenticated
  using (tenant_id = (select auth_tenant_id()) and (select auth_user_role()) in ('owner', 'admin') and is_tenant_active(tenant_id));

-- ---------------------------------------------------------------------------
-- Assignable records: tasks, viewings, deals
-- ---------------------------------------------------------------------------
drop policy if exists crm_tasks_tenant_manage on crm_tasks;
drop policy if exists crm_tasks_scoped_select on crm_tasks;
drop policy if exists crm_tasks_scoped_insert on crm_tasks;
drop policy if exists crm_tasks_scoped_update on crm_tasks;
drop policy if exists crm_tasks_manager_delete on crm_tasks;
create policy crm_tasks_scoped_select on crm_tasks for select to authenticated
  using (
    tenant_id = (select auth_tenant_id())
    and ((select auth_user_role()) in ('owner', 'admin') or assigned_user_id = (select auth_app_user_id())
      or (lead_id is not null and auth_can_access_lead(lead_id)))
  );
create policy crm_tasks_scoped_insert on crm_tasks for insert to authenticated
  with check (
    tenant_id = (select auth_tenant_id()) and is_tenant_active(tenant_id)
    and ((select auth_user_role()) in ('owner', 'admin')
      or (assigned_user_id = (select auth_app_user_id()) and lead_id is not null and auth_can_access_lead(lead_id)))
  );
create policy crm_tasks_scoped_update on crm_tasks for update to authenticated
  using (tenant_id = (select auth_tenant_id())
    and ((select auth_user_role()) in ('owner', 'admin') or assigned_user_id = (select auth_app_user_id())))
  with check (tenant_id = (select auth_tenant_id()) and is_tenant_active(tenant_id)
    and ((select auth_user_role()) in ('owner', 'admin') or assigned_user_id = (select auth_app_user_id())));
create policy crm_tasks_manager_delete on crm_tasks for delete to authenticated
  using (tenant_id = (select auth_tenant_id()) and (select auth_user_role()) in ('owner', 'admin') and is_tenant_active(tenant_id));

drop policy if exists viewings_tenant_manage on viewings;
drop policy if exists viewings_scoped_select on viewings;
drop policy if exists viewings_scoped_insert on viewings;
drop policy if exists viewings_scoped_update on viewings;
drop policy if exists viewings_manager_delete on viewings;
create policy viewings_scoped_select on viewings for select to authenticated
  using (tenant_id = (select auth_tenant_id())
    and (assigned_user_id = (select auth_app_user_id()) or auth_can_access_lead(lead_id)));
create policy viewings_scoped_insert on viewings for insert to authenticated
  with check (
    tenant_id = (select auth_tenant_id()) and is_tenant_active(tenant_id) and auth_can_access_lead(lead_id)
    and ((select auth_user_role()) in ('owner', 'admin') or assigned_user_id = (select auth_app_user_id()))
  );
create policy viewings_scoped_update on viewings for update to authenticated
  using (tenant_id = (select auth_tenant_id())
    and ((select auth_user_role()) in ('owner', 'admin') or assigned_user_id = (select auth_app_user_id())))
  with check (tenant_id = (select auth_tenant_id()) and is_tenant_active(tenant_id)
    and ((select auth_user_role()) in ('owner', 'admin') or assigned_user_id = (select auth_app_user_id())));
create policy viewings_manager_delete on viewings for delete to authenticated
  using (tenant_id = (select auth_tenant_id()) and (select auth_user_role()) in ('owner', 'admin') and is_tenant_active(tenant_id));

drop policy if exists deals_tenant_manage on deals;
drop policy if exists deals_scoped_select on deals;
drop policy if exists deals_scoped_insert on deals;
drop policy if exists deals_scoped_update on deals;
drop policy if exists deals_manager_delete on deals;
create policy deals_scoped_select on deals for select to authenticated
  using (tenant_id = (select auth_tenant_id())
    and (responsible_user_id = (select auth_app_user_id()) or auth_can_access_lead(lead_id)));
create policy deals_scoped_insert on deals for insert to authenticated
  with check (
    tenant_id = (select auth_tenant_id()) and is_tenant_active(tenant_id) and auth_can_access_lead(lead_id)
    and ((select auth_user_role()) in ('owner', 'admin') or responsible_user_id = (select auth_app_user_id()))
  );
create policy deals_scoped_update on deals for update to authenticated
  using (tenant_id = (select auth_tenant_id())
    and ((select auth_user_role()) in ('owner', 'admin') or responsible_user_id = (select auth_app_user_id())))
  with check (tenant_id = (select auth_tenant_id()) and is_tenant_active(tenant_id)
    and ((select auth_user_role()) in ('owner', 'admin') or responsible_user_id = (select auth_app_user_id())));
create policy deals_manager_delete on deals for delete to authenticated
  using (tenant_id = (select auth_tenant_id()) and (select auth_user_role()) in ('owner', 'admin') and is_tenant_active(tenant_id));

-- Policy subqueries run with the caller's RLS, so a junction row follows
-- the visibility of its parent deal/reservation.
drop policy if exists deal_assets_tenant_manage on deal_assets;
drop policy if exists deal_assets_scoped_select on deal_assets;
drop policy if exists deal_assets_scoped_write on deal_assets;
create policy deal_assets_scoped_select on deal_assets for select to authenticated
  using (tenant_id = (select auth_tenant_id())
    and exists (select 1 from deals d where d.id = deal_assets.deal_id and d.tenant_id = deal_assets.tenant_id));
create policy deal_assets_scoped_write on deal_assets for all to authenticated
  using (
    tenant_id = (select auth_tenant_id())
    and exists (select 1 from deals d where d.id = deal_assets.deal_id and d.tenant_id = deal_assets.tenant_id
      and ((select auth_user_role()) in ('owner', 'admin') or d.responsible_user_id = (select auth_app_user_id())))
  )
  with check (
    tenant_id = (select auth_tenant_id()) and is_tenant_active(tenant_id)
    and exists (select 1 from deals d where d.id = deal_assets.deal_id and d.tenant_id = deal_assets.tenant_id
      and ((select auth_user_role()) in ('owner', 'admin') or d.responsible_user_id = (select auth_app_user_id())))
  );

-- ---------------------------------------------------------------------------
-- Reservations: owned through their lead (a lead-less hold is manager-only)
-- ---------------------------------------------------------------------------
drop policy if exists reservations_tenant_manage on reservations;
drop policy if exists reservations_scoped_select on reservations;
drop policy if exists reservations_scoped_insert on reservations;
drop policy if exists reservations_scoped_update on reservations;
drop policy if exists reservations_manager_delete on reservations;
create policy reservations_scoped_select on reservations for select to authenticated
  using (
    tenant_id = (select auth_tenant_id())
    and ((select auth_user_role()) in ('owner', 'admin') or created_by = (select auth_app_user_id())
      or (lead_id is not null and auth_can_access_lead(lead_id)))
  );
create policy reservations_scoped_insert on reservations for insert to authenticated
  with check (
    tenant_id = (select auth_tenant_id()) and is_tenant_active(tenant_id)
    and ((select auth_user_role()) in ('owner', 'admin') or (lead_id is not null and auth_can_access_lead(lead_id)))
  );
create policy reservations_scoped_update on reservations for update to authenticated
  using (tenant_id = (select auth_tenant_id())
    and ((select auth_user_role()) in ('owner', 'admin') or (lead_id is not null and auth_can_access_lead(lead_id))))
  with check (tenant_id = (select auth_tenant_id()) and is_tenant_active(tenant_id)
    and ((select auth_user_role()) in ('owner', 'admin') or (lead_id is not null and auth_can_access_lead(lead_id))));
create policy reservations_manager_delete on reservations for delete to authenticated
  using (tenant_id = (select auth_tenant_id()) and (select auth_user_role()) in ('owner', 'admin') and is_tenant_active(tenant_id));

drop policy if exists reservation_assets_tenant_manage on reservation_assets;
drop policy if exists reservation_assets_scoped_select on reservation_assets;
drop policy if exists reservation_assets_scoped_write on reservation_assets;
create policy reservation_assets_scoped_select on reservation_assets for select to authenticated
  using (tenant_id = (select auth_tenant_id())
    and exists (select 1 from reservations r where r.id = reservation_assets.reservation_id and r.tenant_id = reservation_assets.tenant_id));
create policy reservation_assets_scoped_write on reservation_assets for all to authenticated
  using (
    tenant_id = (select auth_tenant_id())
    and exists (select 1 from reservations r where r.id = reservation_assets.reservation_id and r.tenant_id = reservation_assets.tenant_id
      and ((select auth_user_role()) in ('owner', 'admin') or (r.lead_id is not null and auth_can_access_lead(r.lead_id))))
  )
  with check (
    tenant_id = (select auth_tenant_id()) and is_tenant_active(tenant_id)
    and exists (select 1 from reservations r where r.id = reservation_assets.reservation_id and r.tenant_id = reservation_assets.tenant_id
      and ((select auth_user_role()) in ('owner', 'admin') or (r.lead_id is not null and auth_can_access_lead(r.lead_id))))
  );

-- Tracking pixels are tenant settings: POST /v1/marketing/pixels requires
-- tenant.settings.manage (owner) and GET tenant.settings.read (owner/admin).
drop policy if exists tracking_pixels_tenant_manage on tracking_pixels;
drop policy if exists tracking_pixels_manager_select on tracking_pixels;
drop policy if exists tracking_pixels_owner_write on tracking_pixels;
create policy tracking_pixels_manager_select on tracking_pixels for select to authenticated
  using (tenant_id = (select auth_tenant_id()) and (select auth_user_role()) in ('owner', 'admin'));
create policy tracking_pixels_owner_write on tracking_pixels for all to authenticated
  using (tenant_id = (select auth_tenant_id()) and (select auth_user_role()) = 'owner')
  with check (tenant_id = (select auth_tenant_id()) and (select auth_user_role()) = 'owner' and is_tenant_active(tenant_id));

-- ---------------------------------------------------------------------------
-- Availability engine: same logic as migrations 0095/0096, now evaluated
-- over the whole tenant regardless of the caller's own record visibility.
-- ---------------------------------------------------------------------------
create or replace function public.lock_asset_family(p_tenant_id uuid, p_asset_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
 perform assert_caller_tenant(p_tenant_id);
 if not exists(select 1 from assets where id=p_asset_id and tenant_id=p_tenant_id and archived_at is null) then raise exception 'asset % does not exist in current tenant',p_asset_id; end if;
 perform a.id from assets a where a.tenant_id=p_tenant_id and a.id in(select f.asset_id from asset_family_ids(p_tenant_id,p_asset_id) f) order by a.id for update;
end $$;

create or replace function public.get_asset_commercial_availability(p_tenant_id uuid, p_asset_id uuid, p_at timestamptz default now())
returns table(status text, reason text, blocking_entity_type text, blocking_entity_id uuid)
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_asset assets; v_block record;
begin
 perform assert_caller_tenant(p_tenant_id);
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

create or replace function public.assert_assets_reservable(p_tenant_id uuid, p_asset_ids uuid[], p_ignore_reservation_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_asset uuid; v_conflict record;
begin
 perform assert_caller_tenant(p_tenant_id);
 if p_asset_ids is null or cardinality(p_asset_ids)=0 then raise exception 'reservation requires at least one asset'; end if;
 foreach v_asset in array p_asset_ids loop
  perform lock_asset_family(p_tenant_id,v_asset);
  select d.id into v_conflict from deals d join deal_assets da on da.deal_id=d.id and da.tenant_id=d.tenant_id where d.tenant_id=p_tenant_id and d.status='won' and d.deal_type='sale' and da.asset_id in(select f.asset_id from asset_family_ids(p_tenant_id,v_asset) f) limit 1;
  if found then raise exception 'asset % cannot be reserved because it has already been sold',v_asset; end if;
  select r.id,r.reservation_number,ra.asset_id into v_conflict from reservations r join reservation_assets ra on ra.reservation_id=r.id and ra.tenant_id=r.tenant_id where r.tenant_id=p_tenant_id and (p_ignore_reservation_id is null or r.id<>p_ignore_reservation_id) and r.status in('pending','active') and (r.expires_at is null or r.expires_at>now()) and ra.asset_id in(select f.asset_id from asset_family_ids(p_tenant_id,v_asset) f) limit 1;
  if found then raise exception 'asset % conflicts with active reservation % (%) through asset %',v_asset,v_conflict.reservation_number,v_conflict.id,v_conflict.asset_id; end if;
 end loop;
end $$;

create or replace function public.assert_assets_sellable(p_tenant_id uuid, p_asset_ids uuid[], p_ignore_deal_id uuid default null, p_reservation_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_asset uuid; v_conflict record;
begin
 perform assert_caller_tenant(p_tenant_id);
 if p_asset_ids is null or cardinality(p_asset_ids)=0 then raise exception 'sale requires at least one asset'; end if;
 foreach v_asset in array p_asset_ids loop
  perform lock_asset_family(p_tenant_id,v_asset);
  select d.id into v_conflict from deals d join deal_assets da on da.deal_id=d.id and da.tenant_id=d.tenant_id where d.tenant_id=p_tenant_id and d.status='won' and d.deal_type='sale' and (p_ignore_deal_id is null or d.id<>p_ignore_deal_id) and da.asset_id in(select f.asset_id from asset_family_ids(p_tenant_id,v_asset) f) limit 1;
  if found then raise exception 'asset % has already been sold through deal %',v_asset,v_conflict.id; end if;
  select r.id,r.reservation_number into v_conflict from reservations r join reservation_assets ra on ra.reservation_id=r.id and ra.tenant_id=r.tenant_id where r.tenant_id=p_tenant_id and (p_reservation_id is null or r.id<>p_reservation_id) and r.status in('pending','active') and (r.expires_at is null or r.expires_at>now()) and ra.asset_id in(select f.asset_id from asset_family_ids(p_tenant_id,v_asset) f) limit 1;
  if found then raise exception 'asset % is reserved by reservation % (%)',v_asset,v_conflict.reservation_number,v_conflict.id; end if;
 end loop;
end $$;

create or replace function public.assert_assets_rent_reservable(p_tenant_id uuid, p_asset_ids uuid[], p_ignore_reservation_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_asset_id uuid; v_conflict record;
begin
 perform assert_caller_tenant(p_tenant_id);
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

revoke all on function lock_asset_family(uuid, uuid), get_asset_commercial_availability(uuid, uuid, timestamptz),
  assert_assets_reservable(uuid, uuid[], uuid), assert_assets_sellable(uuid, uuid[], uuid, uuid),
  assert_assets_rent_reservable(uuid, uuid[], uuid)
  from public, anon;
grant execute on function lock_asset_family(uuid, uuid), get_asset_commercial_availability(uuid, uuid, timestamptz),
  assert_assets_reservable(uuid, uuid[], uuid), assert_assets_sellable(uuid, uuid[], uuid, uuid),
  assert_assets_rent_reservable(uuid, uuid[], uuid)
  to authenticated;

-- ---------------------------------------------------------------------------
-- close_sale_deal (migration 0101) row-locks and pauses the deal's listing,
-- which agents may read but never update, so an agent could not close even
-- their own sale once it had a listing. It now runs as SECURITY DEFINER and
-- authorizes the caller itself: an owner/admin, or the deal's responsible
-- agent. A deal that is already won or lost is final.
-- ---------------------------------------------------------------------------
create or replace function public.close_sale_deal(p_deal_id uuid, p_sale_value numeric default null)
returns public.deals
language plpgsql
security definer
set search_path = public
as $$
declare v_tenant uuid:=auth_tenant_id(); v_deal public.deals; v_asset_ids uuid[]; v_sale_value numeric; v_reservation public.reservations; v_listing public.listings;
begin
 if v_tenant is null then raise exception 'tenant context is required'; end if;
 if p_deal_id is null then raise exception 'deal id is required'; end if;
 select * into v_deal from public.deals d where d.id=p_deal_id and d.tenant_id=v_tenant for update;
 if not found then raise exception 'deal does not exist in current tenant'; end if;
 if auth_user_role() not in ('owner','admin') and v_deal.responsible_user_id is distinct from auth_app_user_id() then
  raise exception 'only the responsible agent or a manager can close this deal' using errcode = '42501';
 end if;
 if v_deal.status in ('won'::deal_status,'lost'::deal_status) then raise exception 'deal is already closed'; end if;
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

revoke all on function public.close_sale_deal(uuid, numeric) from public, anon;
grant execute on function public.close_sale_deal(uuid, numeric) to authenticated;
