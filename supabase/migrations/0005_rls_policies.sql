-- =============================================================================
-- Migration 0005: Row Level Security
-- PRODUCT_SPEC.md section 10. Run after 0004.
--
-- Design summary:
--   * `api` is the only service with a direct Supabase connection
--     (PRODUCT_SPEC section 7). For authenticated calls (dashboard/console)
--     it forwards the caller's own JWT, so every query below runs AS that
--     user (Postgres role `authenticated`, auth.uid() = their auth user id)
--     — RLS is the real enforcement, not a formality.
--   * For public-site's anonymous calls it uses the anon key (Postgres
--     role `anon`) for READS only. Public WRITES (the inquiry form, page
--     view tracking) go through dedicated `api` endpoints using the
--     service role, which validates tenant_id/property_id server-side
--     before inserting — RLS intentionally grants `anon` no INSERT
--     rights on leads/property_views (see PRODUCT_SPEC section 10).
--   * Console (platform-owner) access is authorized via the
--     `is_platform_admin()` helper below, which checks `platform_admins`
--     — NEVER via users.role. This is the fix for the naming-collision
--     risk documented in PRODUCT_SPEC section 8.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper functions
-- `security definer` lets these read users/platform_admins regardless of
-- the RLS policies on those tables themselves (avoids recursive lookups).
-- ---------------------------------------------------------------------------

create function auth_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from users where auth_user_id = auth.uid();
$$;

create function auth_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from users where auth_user_id = auth.uid();
$$;

create function auth_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from users where auth_user_id = auth.uid();
$$;

create function is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from platform_admins where auth_user_id = auth.uid());
$$;

-- `anon` has NO select policy on `tenants` (it must never see billing/CR/tax
-- data). This function lets public read-policies below check "is this
-- tenant active" without exposing the row itself — `security definer`
-- bypasses RLS for this narrow, single-column check only.
create function is_tenant_active(check_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from tenants where id = check_tenant_id and status = 'active'
  );
$$;

-- =============================================================================
-- platform_admins — no write policy at all (bootstrap/additions are manual,
-- direct DB access only, per PRODUCT_SPEC section 9).
-- =============================================================================
alter table platform_admins enable row level security;

create policy platform_admins_self_or_admin_select on platform_admins
  for select to authenticated
  using (auth_user_id = auth.uid() or is_platform_admin());

-- =============================================================================
-- plans / themes / cities / districts — public reference data.
-- Readable by anyone (including anonymous visitors); writable only by
-- the platform owner via `console` (PRODUCT_SPEC section 10).
-- =============================================================================
alter table plans enable row level security;
alter table themes enable row level security;
alter table cities enable row level security;
alter table districts enable row level security;

create policy plans_public_select on plans for select to anon, authenticated using (true);
create policy plans_admin_write on plans for all to authenticated
  using (is_platform_admin()) with check (is_platform_admin());

create policy themes_public_select on themes for select to anon, authenticated using (true);
create policy themes_admin_write on themes for all to authenticated
  using (is_platform_admin()) with check (is_platform_admin());

create policy cities_public_select on cities for select to anon, authenticated using (true);
create policy cities_admin_write on cities for all to authenticated
  using (is_platform_admin()) with check (is_platform_admin());

create policy districts_public_select on districts for select to anon, authenticated using (true);
create policy districts_admin_write on districts for all to authenticated
  using (is_platform_admin()) with check (is_platform_admin());

-- =============================================================================
-- tenants
-- Members see their own tenant; the platform owner sees/manages all
-- (activate/suspend, billing) — this is `console`'s core capability.
-- =============================================================================
alter table tenants enable row level security;

create policy tenants_own_select on tenants
  for select to authenticated
  using (id = auth_tenant_id() or is_platform_admin());

create policy tenants_owner_update on tenants
  for update to authenticated
  using (id = auth_tenant_id() and auth_user_role() = 'owner')
  with check (id = auth_tenant_id() and auth_user_role() = 'owner');

create policy tenants_admin_write on tenants
  for all to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

-- =============================================================================
-- users
-- Owner/Admin manage their tenant's team; Agent sees only their own row.
-- =============================================================================
alter table users enable row level security;

create policy users_tenant_select on users
  for select to authenticated
  using (
    tenant_id = auth_tenant_id()
    and (auth_user_role() in ('owner', 'admin') or id = auth_app_user_id())
  );

create policy users_owner_admin_write on users
  for all to authenticated
  using (tenant_id = auth_tenant_id() and auth_user_role() in ('owner', 'admin'))
  with check (tenant_id = auth_tenant_id() and auth_user_role() in ('owner', 'admin'));

-- =============================================================================
-- websites / website_sections
-- Editing the site is Owner/Admin only (PRODUCT_SPEC section 8 — Agent
-- has no website access). Public-site needs read access for ACTIVE
-- tenants only — a suspended tenant's site shows the "unavailable" page
-- instead (PRODUCT_SPEC section 2), enforced here at the data layer too.
-- =============================================================================
alter table websites enable row level security;
alter table website_sections enable row level security;

create policy websites_tenant_manage on websites
  for all to authenticated
  using (tenant_id = auth_tenant_id() and auth_user_role() in ('owner', 'admin'))
  with check (tenant_id = auth_tenant_id() and auth_user_role() in ('owner', 'admin'));

create policy websites_public_select on websites
  for select to anon
  using (is_tenant_active(tenant_id));

create policy website_sections_tenant_manage on website_sections
  for all to authenticated
  using (
    exists (
      select 1 from websites
      where websites.id = website_sections.website_id
        and websites.tenant_id = auth_tenant_id()
        and auth_user_role() in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from websites
      where websites.id = website_sections.website_id
        and websites.tenant_id = auth_tenant_id()
        and auth_user_role() in ('owner', 'admin')
    )
  );

create policy website_sections_public_select on website_sections
  for select to anon
  using (
    is_visible
    and exists (
      select 1 from websites
      where websites.id = website_sections.website_id
        and is_tenant_active(websites.tenant_id)
    )
  );

-- =============================================================================
-- properties
-- Owner/Admin: full control over their tenant's listings.
-- Agent: sees and updates only properties assigned to them (agent_id).
-- Public: only `status = 'published'` listings of ACTIVE tenants.
-- =============================================================================
alter table properties enable row level security;

create policy properties_owner_admin_manage on properties
  for all to authenticated
  using (tenant_id = auth_tenant_id() and auth_user_role() in ('owner', 'admin'))
  with check (tenant_id = auth_tenant_id() and auth_user_role() in ('owner', 'admin'));

create policy properties_agent_select on properties
  for select to authenticated
  using (
    tenant_id = auth_tenant_id()
    and auth_user_role() = 'agent'
    and agent_id = auth_app_user_id()
  );

create policy properties_agent_update on properties
  for update to authenticated
  using (
    tenant_id = auth_tenant_id()
    and auth_user_role() = 'agent'
    and agent_id = auth_app_user_id()
  )
  with check (
    tenant_id = auth_tenant_id()
    and auth_user_role() = 'agent'
    and agent_id = auth_app_user_id()
  );

create policy properties_public_select on properties
  for select to anon
  using (status = 'published' and is_tenant_active(tenant_id));

-- =============================================================================
-- property_media
-- Follows the parent property's access: Owner/Admin manage all, Agent
-- manages their assigned properties' media, public sees media of
-- published listings only.
-- =============================================================================
alter table property_media enable row level security;

create policy property_media_owner_admin_manage on property_media
  for all to authenticated
  using (
    exists (
      select 1 from properties
      where properties.id = property_media.property_id
        and properties.tenant_id = auth_tenant_id()
        and auth_user_role() in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from properties
      where properties.id = property_media.property_id
        and properties.tenant_id = auth_tenant_id()
        and auth_user_role() in ('owner', 'admin')
    )
  );

create policy property_media_agent_manage on property_media
  for all to authenticated
  using (
    exists (
      select 1 from properties
      where properties.id = property_media.property_id
        and properties.tenant_id = auth_tenant_id()
        and auth_user_role() = 'agent'
        and properties.agent_id = auth_app_user_id()
    )
  )
  with check (
    exists (
      select 1 from properties
      where properties.id = property_media.property_id
        and properties.tenant_id = auth_tenant_id()
        and auth_user_role() = 'agent'
        and properties.agent_id = auth_app_user_id()
    )
  );

create policy property_media_public_select on property_media
  for select to anon
  using (
    exists (
      select 1 from properties
      where properties.id = property_media.property_id
        and properties.status = 'published'
        and is_tenant_active(properties.tenant_id)
    )
  );

-- =============================================================================
-- leads
-- Owner/Admin: full access. Agent: only leads assigned to them. No
-- `anon` policy at all — the public inquiry form is inserted by `api`
-- using the service role after validating tenant_id/property_id server
-- side (PRODUCT_SPEC section 10), not by granting `anon` direct INSERT.
-- =============================================================================
alter table leads enable row level security;

create policy leads_owner_admin_manage on leads
  for all to authenticated
  using (tenant_id = auth_tenant_id() and auth_user_role() in ('owner', 'admin'))
  with check (tenant_id = auth_tenant_id() and auth_user_role() in ('owner', 'admin'));

create policy leads_agent_select on leads
  for select to authenticated
  using (
    tenant_id = auth_tenant_id()
    and auth_user_role() = 'agent'
    and assigned_agent_id = auth_app_user_id()
  );

create policy leads_agent_update on leads
  for update to authenticated
  using (
    tenant_id = auth_tenant_id()
    and auth_user_role() = 'agent'
    and assigned_agent_id = auth_app_user_id()
  )
  with check (
    tenant_id = auth_tenant_id()
    and auth_user_role() = 'agent'
    and assigned_agent_id = auth_app_user_id()
  );

-- =============================================================================
-- lead_notes
-- Same shape as leads: Owner/Admin see all notes on tenant leads, Agent
-- only notes on leads assigned to them.
-- =============================================================================
alter table lead_notes enable row level security;

create policy lead_notes_owner_admin_manage on lead_notes
  for all to authenticated
  using (
    exists (
      select 1 from leads
      where leads.id = lead_notes.lead_id
        and leads.tenant_id = auth_tenant_id()
        and auth_user_role() in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from leads
      where leads.id = lead_notes.lead_id
        and leads.tenant_id = auth_tenant_id()
        and auth_user_role() in ('owner', 'admin')
    )
  );

create policy lead_notes_agent_manage on lead_notes
  for all to authenticated
  using (
    exists (
      select 1 from leads
      where leads.id = lead_notes.lead_id
        and leads.tenant_id = auth_tenant_id()
        and auth_user_role() = 'agent'
        and leads.assigned_agent_id = auth_app_user_id()
    )
  )
  with check (
    exists (
      select 1 from leads
      where leads.id = lead_notes.lead_id
        and leads.tenant_id = auth_tenant_id()
        and auth_user_role() = 'agent'
        and leads.assigned_agent_id = auth_app_user_id()
    )
  );

-- =============================================================================
-- property_views
-- Read-only for tenant members (analytics). Insertion of view events from
-- public-site is done by `api` via the service role, same reasoning as
-- leads above — no `anon` write policy.
-- =============================================================================
alter table property_views enable row level security;

create policy property_views_tenant_select on property_views
  for select to authenticated
  using (tenant_id = auth_tenant_id() and auth_user_role() in ('owner', 'admin'));

-- =============================================================================
-- audit_logs
-- Owner/Admin can read their tenant's audit trail. Any tenant member can
-- log their own actions (user_id must be their own row) — no `anon` access.
-- =============================================================================
alter table audit_logs enable row level security;

create policy audit_logs_owner_admin_select on audit_logs
  for select to authenticated
  using (tenant_id = auth_tenant_id() and auth_user_role() in ('owner', 'admin'));

create policy audit_logs_self_insert on audit_logs
  for insert to authenticated
  with check (tenant_id = auth_tenant_id() and user_id = auth_app_user_id());
