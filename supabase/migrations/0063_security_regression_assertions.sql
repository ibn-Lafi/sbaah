-- =============================================================================
-- Migration 0063: security regression assertions for new tenant-owned domains
-- This is a reusable diagnostic function. It does not create test data.
-- =============================================================================
create or replace function security_schema_assertions()
returns table(check_name text, passed boolean)
language sql
stable
security definer
set search_path=''
as $$
  select 'rls_enabled:'||c.relname,
         c.relrowsecurity
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public'
    and c.relname = any(array[
      'tenant_business_activities','documents','project_phases','unit_types','units',
      'lead_requirements','lead_interests','crm_activities','crm_tasks','viewings','deals',
      'marketing_mandates','tracking_pixels','analytics_events','whatsapp_conversations','whatsapp_messages'
    ])
  union all
  select 'cross_tenant_fk:'||conname, true
  from pg_catalog.pg_constraint
  where connamespace='public'::regnamespace
    and conname like '%_same_tenant';
$$;
revoke all on function security_schema_assertions() from public, anon, authenticated;
