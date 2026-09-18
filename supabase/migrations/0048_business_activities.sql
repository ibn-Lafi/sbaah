-- =============================================================================
-- Migration 0048: tenant business activities
--
-- Business activity is independent from tenants.account_type and users.role.
-- A tenant may enable more than one activity. Existing tenants are deliberately
-- left with zero rows ("unconfigured") rather than guessing their business.
-- =============================================================================

create type business_activity as enum ('marketing', 'brokerage', 'development');

create table tenant_business_activities (
  tenant_id uuid not null references tenants (id) on delete cascade,
  activity business_activity not null,
  created_at timestamptz not null default now(),
  created_by uuid references users (id) on delete set null,
  primary key (tenant_id, activity)
);

create index tenant_business_activities_tenant_id_idx
  on tenant_business_activities (tenant_id);

alter table tenant_business_activities enable row level security;

-- All authenticated tenant members may read their organization's configured
-- activities. The existing helper resolves tenant membership from auth.uid().
create policy tenant_business_activities_tenant_select
  on tenant_business_activities
  for select
  to authenticated
  using (tenant_id = auth_tenant_id());

-- Only the tenant owner may change product activities in the initial rollout.
-- This keeps the mutation boundary narrower than the legacy admin role until
-- the centralized permission system lands in RBAC-001..004.
create policy tenant_business_activities_owner_insert
  on tenant_business_activities
  for insert
  to authenticated
  with check (
    tenant_id = auth_tenant_id()
    and auth_user_role() = 'owner'
    and is_tenant_active(tenant_id)
  );

create policy tenant_business_activities_owner_delete
  on tenant_business_activities
  for delete
  to authenticated
  using (
    tenant_id = auth_tenant_id()
    and auth_user_role() = 'owner'
    and is_tenant_active(tenant_id)
  );

-- No UPDATE policy: the composite key is the value. Changing an activity is
-- intentionally represented as delete + insert, producing simpler RLS rules.
