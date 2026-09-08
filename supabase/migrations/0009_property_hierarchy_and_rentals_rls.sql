-- =============================================================================
-- Migration 0009: RLS for projects/buildings/rentals
-- PRODUCT_SPEC.md sections 4.1-4.2 (task 13/42). Run after 0008.
--
-- Mirrors the properties/leads RLS pattern from migration 0005 exactly —
-- same helper functions, same Owner/Admin/Agent/public shape. No new
-- helper functions needed.
-- =============================================================================

-- =============================================================================
-- projects / buildings
-- Owner/Admin: full control. Agent: read-only within their tenant (they
-- work with individual units, not project/building management, but need
-- to see which project/building a unit belongs to). Public: projects
-- only when published; buildings have no status of their own, so any
-- building of an active tenant is visible (matches the websites pattern
-- in 0005 — no per-row status column there either).
-- =============================================================================
alter table projects enable row level security;
alter table buildings enable row level security;

create policy projects_owner_admin_manage on projects
  for all to authenticated
  using (tenant_id = auth_tenant_id() and auth_user_role() in ('owner', 'admin'))
  with check (tenant_id = auth_tenant_id() and auth_user_role() in ('owner', 'admin'));

create policy projects_agent_select on projects
  for select to authenticated
  using (tenant_id = auth_tenant_id() and auth_user_role() = 'agent');

create policy projects_public_select on projects
  for select to anon
  using (status = 'published' and is_tenant_active(tenant_id));

create policy buildings_owner_admin_manage on buildings
  for all to authenticated
  using (tenant_id = auth_tenant_id() and auth_user_role() in ('owner', 'admin'))
  with check (tenant_id = auth_tenant_id() and auth_user_role() in ('owner', 'admin'));

create policy buildings_agent_select on buildings
  for select to authenticated
  using (tenant_id = auth_tenant_id() and auth_user_role() = 'agent');

create policy buildings_public_select on buildings
  for select to anon
  using (is_tenant_active(tenant_id));

-- =============================================================================
-- rentals
-- Contains tenant PII (name, phone, rent amount) — no `anon` policy at
-- all, same reasoning as `leads` in 0005. Owner/Admin: full access.
-- Agent: only rentals on properties assigned to them.
-- =============================================================================
alter table rentals enable row level security;

create policy rentals_owner_admin_manage on rentals
  for all to authenticated
  using (tenant_id = auth_tenant_id() and auth_user_role() in ('owner', 'admin'))
  with check (tenant_id = auth_tenant_id() and auth_user_role() in ('owner', 'admin'));

create policy rentals_agent_manage on rentals
  for all to authenticated
  using (
    exists (
      select 1 from properties
      where properties.id = rentals.property_id
        and properties.tenant_id = auth_tenant_id()
        and auth_user_role() = 'agent'
        and properties.agent_id = auth_app_user_id()
    )
  )
  with check (
    exists (
      select 1 from properties
      where properties.id = rentals.property_id
        and properties.tenant_id = auth_tenant_id()
        and auth_user_role() = 'agent'
        and properties.agent_id = auth_app_user_id()
    )
  );
