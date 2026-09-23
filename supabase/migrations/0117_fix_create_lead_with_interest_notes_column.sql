-- 0117: fix a hard, 100%-reproducing bug in create_lead_with_interest().
--
-- Migration 0099 inserts into leads(...,notes,...), but `leads` has never
-- had a `notes` column (migration 0004) — only `lead_notes`, a separate
-- table for the per-lead note timeline (dashboard's "سجل الملاحظات",
-- added after a lead already exists). Every call to POST /v1/leads (the
-- dashboard's "add a lead/customer" form) failed with "column "notes" of
-- relation "leads" does not exist" regardless of input, since Postgres
-- rejects the column reference before any data is even considered.
-- Reproduced directly against the API.
--
-- The public inquiry form's create_public_lead_with_interest() never
-- referenced `notes` and is unaffected.

create or replace function public.create_lead_with_interest(p_lead jsonb,p_interest jsonb default null)
returns public.leads language plpgsql security invoker set search_path=public as $$
declare v_tenant uuid:=auth_tenant_id(); v_lead public.leads; v_project_id uuid; v_unit_type_id uuid; v_asset_id uuid; v_listing_id uuid; v_target_count integer:=0;
begin
 if v_tenant is null then raise exception 'tenant context is required'; end if;
 if p_interest is not null then
  v_project_id:=nullif(p_interest->>'project_id','')::uuid; v_unit_type_id:=nullif(p_interest->>'unit_type_id','')::uuid; v_asset_id:=nullif(p_interest->>'asset_id','')::uuid; v_listing_id:=nullif(p_interest->>'listing_id','')::uuid;
  v_target_count:=(v_project_id is not null)::int+(v_unit_type_id is not null)::int+(v_asset_id is not null)::int+(v_listing_id is not null)::int;
  if v_target_count<>1 then raise exception 'lead interest must reference exactly one target'; end if;
 end if;
 if v_project_id is not null and not exists(select 1 from projects where id=v_project_id and tenant_id=v_tenant) then raise exception 'project does not belong to current tenant'; end if;
 if v_unit_type_id is not null and not exists(select 1 from unit_types where id=v_unit_type_id and tenant_id=v_tenant) then raise exception 'unit type does not belong to current tenant'; end if;
 if v_asset_id is not null and not exists(select 1 from assets where id=v_asset_id and tenant_id=v_tenant and archived_at is null) then raise exception 'asset does not belong to current tenant or is archived'; end if;
 if v_listing_id is not null and not exists(select 1 from listings where id=v_listing_id and tenant_id=v_tenant and archived_at is null) then raise exception 'listing does not belong to current tenant or is archived'; end if;
 if nullif(p_lead->>'assigned_agent_id','') is not null and not exists(select 1 from users where id=(p_lead->>'assigned_agent_id')::uuid and tenant_id=v_tenant) then raise exception 'assigned agent does not belong to current tenant'; end if;
 insert into leads(tenant_id,full_name,phone,email,source,status,assigned_agent_id,lost_reason,customer_relationship)
 values(v_tenant,p_lead->>'full_name',nullif(p_lead->>'phone',''),nullif(p_lead->>'email',''),coalesce(nullif(p_lead->>'source','')::lead_source,'manual'::lead_source),coalesce(nullif(p_lead->>'status','')::lead_status,'new'::lead_status),nullif(p_lead->>'assigned_agent_id','')::uuid,nullif(p_lead->>'lost_reason',''),nullif(p_lead->>'customer_relationship','')) returning * into v_lead;
 if p_interest is not null then
  insert into lead_interests(tenant_id,lead_id,project_id,unit_type_id,asset_id,listing_id,priority,notes)
  values(v_tenant,v_lead.id,v_project_id,v_unit_type_id,v_asset_id,v_listing_id,case when nullif(p_interest->>'priority','') is null then null else (p_interest->>'priority')::smallint end,nullif(p_interest->>'notes',''));
 end if;
 return v_lead;
end $$;

revoke all on function public.create_lead_with_interest(jsonb,jsonb) from public,anon;
grant execute on function public.create_lead_with_interest(jsonb,jsonb) to authenticated;
