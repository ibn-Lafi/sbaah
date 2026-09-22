-- Migration 0100: source-aware public Lead + Interest creation.
-- Applied manually to Supabase before this repository migration was committed.
create or replace function public.create_public_lead_with_interest(p_tenant_id uuid,p_lead jsonb,p_interest jsonb default null)
returns public.leads language plpgsql security definer set search_path=public as $$
declare v_lead public.leads; v_project_id uuid; v_unit_type_id uuid; v_asset_id uuid; v_listing_id uuid; v_target_count integer:=0; v_source lead_source;
begin
 if p_tenant_id is null then raise exception 'tenant id is required'; end if;
 if not exists(select 1 from tenants t where t.id=p_tenant_id) then raise exception 'tenant does not exist'; end if;
 begin
  v_source:=coalesce(nullif(p_lead->>'source','')::lead_source,'website_form'::lead_source);
 exception when invalid_text_representation then raise exception 'invalid public lead source';
 end;
 if v_source not in('website_form'::lead_source,'whatsapp_click'::lead_source) then raise exception 'unsupported public lead source'; end if;
 if p_interest is null then raise exception 'public lead requires an interest target'; end if;
 v_project_id:=nullif(p_interest->>'project_id','')::uuid; v_unit_type_id:=nullif(p_interest->>'unit_type_id','')::uuid; v_asset_id:=nullif(p_interest->>'asset_id','')::uuid; v_listing_id:=nullif(p_interest->>'listing_id','')::uuid;
 v_target_count:=(v_project_id is not null)::int+(v_unit_type_id is not null)::int+(v_asset_id is not null)::int+(v_listing_id is not null)::int;
 if v_target_count<>1 then raise exception 'public lead interest must reference exactly one target'; end if;
 if v_project_id is not null and not exists(select 1 from projects where id=v_project_id and tenant_id=p_tenant_id) then raise exception 'project does not belong to tenant'; end if;
 if v_unit_type_id is not null and not exists(select 1 from unit_types where id=v_unit_type_id and tenant_id=p_tenant_id) then raise exception 'unit type does not belong to tenant'; end if;
 if v_asset_id is not null and not exists(select 1 from assets where id=v_asset_id and tenant_id=p_tenant_id and archived_at is null) then raise exception 'asset does not belong to tenant or is archived'; end if;
 if v_listing_id is not null and not exists(select 1 from listings where id=v_listing_id and tenant_id=p_tenant_id and archived_at is null and publication_status='published') then raise exception 'listing is not publicly available'; end if;
 insert into leads(tenant_id,full_name,phone,email,source,status)
 values(p_tenant_id,coalesce(nullif(p_lead->>'full_name',''),case when v_source='whatsapp_click'::lead_source then 'زائر عبر واتساب' else 'زائر الموقع' end),nullif(p_lead->>'phone',''),nullif(p_lead->>'email',''),v_source,'new'::lead_status) returning * into v_lead;
 insert into lead_interests(tenant_id,lead_id,project_id,unit_type_id,asset_id,listing_id,priority,notes)
 values(p_tenant_id,v_lead.id,v_project_id,v_unit_type_id,v_asset_id,v_listing_id,case when nullif(p_interest->>'priority','') is null then null else (p_interest->>'priority')::smallint end,nullif(p_interest->>'notes',''));
 return v_lead;
end $$;
revoke all on function public.create_public_lead_with_interest(uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.create_public_lead_with_interest(uuid,jsonb,jsonb) to service_role;
comment on function public.create_public_lead_with_interest(uuid,jsonb,jsonb) is 'Service-role-only atomic public Lead + Interest writer. Supports website_form and whatsapp_click sources while keeping lead_interests as the canonical real-estate relationship.';
