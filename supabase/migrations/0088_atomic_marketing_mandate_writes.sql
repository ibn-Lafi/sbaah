-- =============================================================================
-- Migration 0088: Atomic marketing mandate creation
-- Creates mandate + asset links in one PostgreSQL transaction.
-- SECURITY INVOKER preserves tenant RLS and owner/admin write policies.
-- =============================================================================

create or replace function public.create_marketing_mandate_with_assets(
  p_mandate jsonb,
  p_asset_ids uuid[]
)
returns public.marketing_mandates
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tenant uuid := auth_tenant_id();
  v_mandate public.marketing_mandates;
  v_requested integer;
  v_owned integer;
  v_owner_party uuid;
begin
  if v_tenant is null then
    raise exception 'tenant context is required';
  end if;

  v_requested := coalesce(array_length(p_asset_ids, 1), 0);
  if v_requested = 0 then
    raise exception 'at least one asset is required';
  end if;

  select count(distinct id) into v_owned
  from public.assets
  where tenant_id = v_tenant
    and id = any(p_asset_ids)
    and archived_at is null;

  if v_owned <> v_requested then
    raise exception 'one or more assets do not exist in the current tenant';
  end if;

  v_owner_party := case
    when nullif(p_mandate->>'owner_party_id', '') is null then null
    else (p_mandate->>'owner_party_id')::uuid
  end;

  if v_owner_party is not null and not exists (
    select 1 from public.parties
    where id = v_owner_party and tenant_id = v_tenant
  ) then
    raise exception 'owner party does not exist in the current tenant';
  end if;

  insert into public.marketing_mandates (
    tenant_id, reference_number, owner_party_id, mandate_type,
    commission_type, commission_value, status, starts_at, expires_at, notes
  ) values (
    v_tenant,
    p_mandate->>'reference_number',
    v_owner_party,
    (p_mandate->>'mandate_type')::marketing_mandate_type,
    case when nullif(p_mandate->>'commission_type','') is null then null else (p_mandate->>'commission_type')::commission_type end,
    case when nullif(p_mandate->>'commission_value','') is null then null else (p_mandate->>'commission_value')::numeric end,
    coalesce((p_mandate->>'status')::marketing_mandate_status, 'draft'::marketing_mandate_status),
    case when nullif(p_mandate->>'starts_at','') is null then null else (p_mandate->>'starts_at')::date end,
    case when nullif(p_mandate->>'expires_at','') is null then null else (p_mandate->>'expires_at')::date end,
    nullif(p_mandate->>'notes','')
  )
  returning * into v_mandate;

  insert into public.marketing_mandate_assets(tenant_id, marketing_mandate_id, asset_id)
  select v_tenant, v_mandate.id, asset_id
  from unnest(p_asset_ids) as asset_id;

  return v_mandate;
end;
$$;

revoke all on function public.create_marketing_mandate_with_assets(jsonb, uuid[]) from public;
revoke execute on function public.create_marketing_mandate_with_assets(jsonb, uuid[]) from anon;
grant execute on function public.create_marketing_mandate_with_assets(jsonb, uuid[]) to authenticated;
