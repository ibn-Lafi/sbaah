-- =============================================================================
-- Migration 0051: harden tenant business activity grants and creator ownership
-- Run after 0050.
-- =============================================================================

-- RLS policies and table grants are separate controls. Anonymous clients do
-- not need this table at all; authenticated tenant members need SELECT and
-- Owners need INSERT/DELETE as constrained by the policies.
revoke all on table tenant_business_activities from anon, authenticated;
grant select, insert, delete on table tenant_business_activities to authenticated;

drop policy if exists tenant_business_activities_owner_insert
  on tenant_business_activities;

create policy tenant_business_activities_owner_insert
  on tenant_business_activities
  for insert
  to authenticated
  with check (
    tenant_id = auth_tenant_id()
    and created_by = auth_app_user_id()
    and auth_user_role() = 'owner'
    and is_tenant_active(tenant_id)
  );
