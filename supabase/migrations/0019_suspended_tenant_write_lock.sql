-- =============================================================================
-- Migration 0019: block writes for a suspended/cancelled tenant
-- PRODUCT_SPEC.md section 2: a suspended account "stays open for reading
-- only... edits and publishing are blocked" — real for the first time as
-- of task 38/42, once console can actually flip `tenants.status`.
--
-- Deliberately RESTRICTIVE policies (Postgres 9.6+), not edits to the
-- existing permissive `for all` policies from migrations 0005/0009: those
-- policies also grant SELECT, and a suspended tenant's own Owner/Admin/
-- Agent must still be able to READ everything (PRODUCT_SPEC's own
-- "read-only", not "no access"). A restrictive policy scoped to INSERT/
-- UPDATE/DELETE only ANDs against the existing permissive policy without
-- touching its SELECT behavior at all — zero risk to already-tested reads.
--
-- `tenants` itself is the one exception: its restrictive UPDATE policy
-- allows `is_platform_admin()` through unconditionally, because console's
-- entire job is flipping a suspended tenant back to active — without that
-- escape hatch this migration would make suspension permanent.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- tenants — Owner's own update only; console (platform admin) is exempt.
-- ---------------------------------------------------------------------------
create policy tenants_tenant_active_update on tenants as restrictive
  for update to authenticated
  using (is_tenant_active(id) or is_platform_admin())
  with check (is_tenant_active(id) or is_platform_admin());

-- ---------------------------------------------------------------------------
-- users (team management)
-- ---------------------------------------------------------------------------
create policy users_tenant_active_insert on users as restrictive
  for insert to authenticated
  with check (is_tenant_active(tenant_id));

create policy users_tenant_active_update on users as restrictive
  for update to authenticated
  using (is_tenant_active(tenant_id))
  with check (is_tenant_active(tenant_id));

create policy users_tenant_active_delete on users as restrictive
  for delete to authenticated
  using (is_tenant_active(tenant_id));

-- ---------------------------------------------------------------------------
-- websites
-- ---------------------------------------------------------------------------
create policy websites_tenant_active_insert on websites as restrictive
  for insert to authenticated
  with check (is_tenant_active(tenant_id));

create policy websites_tenant_active_update on websites as restrictive
  for update to authenticated
  using (is_tenant_active(tenant_id))
  with check (is_tenant_active(tenant_id));

create policy websites_tenant_active_delete on websites as restrictive
  for delete to authenticated
  using (is_tenant_active(tenant_id));

-- ---------------------------------------------------------------------------
-- website_sections (tenant_id lives on the parent `websites` row)
-- ---------------------------------------------------------------------------
create policy website_sections_tenant_active_insert on website_sections as restrictive
  for insert to authenticated
  with check (
    exists (select 1 from websites where websites.id = website_sections.website_id and is_tenant_active(websites.tenant_id))
  );

create policy website_sections_tenant_active_update on website_sections as restrictive
  for update to authenticated
  using (
    exists (select 1 from websites where websites.id = website_sections.website_id and is_tenant_active(websites.tenant_id))
  )
  with check (
    exists (select 1 from websites where websites.id = website_sections.website_id and is_tenant_active(websites.tenant_id))
  );

create policy website_sections_tenant_active_delete on website_sections as restrictive
  for delete to authenticated
  using (
    exists (select 1 from websites where websites.id = website_sections.website_id and is_tenant_active(websites.tenant_id))
  );

-- ---------------------------------------------------------------------------
-- properties
-- ---------------------------------------------------------------------------
create policy properties_tenant_active_insert on properties as restrictive
  for insert to authenticated
  with check (is_tenant_active(tenant_id));

create policy properties_tenant_active_update on properties as restrictive
  for update to authenticated
  using (is_tenant_active(tenant_id))
  with check (is_tenant_active(tenant_id));

create policy properties_tenant_active_delete on properties as restrictive
  for delete to authenticated
  using (is_tenant_active(tenant_id));

-- ---------------------------------------------------------------------------
-- property_media (tenant_id lives on the parent `properties` row)
-- ---------------------------------------------------------------------------
create policy property_media_tenant_active_insert on property_media as restrictive
  for insert to authenticated
  with check (
    exists (select 1 from properties where properties.id = property_media.property_id and is_tenant_active(properties.tenant_id))
  );

create policy property_media_tenant_active_update on property_media as restrictive
  for update to authenticated
  using (
    exists (select 1 from properties where properties.id = property_media.property_id and is_tenant_active(properties.tenant_id))
  )
  with check (
    exists (select 1 from properties where properties.id = property_media.property_id and is_tenant_active(properties.tenant_id))
  );

create policy property_media_tenant_active_delete on property_media as restrictive
  for delete to authenticated
  using (
    exists (select 1 from properties where properties.id = property_media.property_id and is_tenant_active(properties.tenant_id))
  );

-- ---------------------------------------------------------------------------
-- leads
-- ---------------------------------------------------------------------------
create policy leads_tenant_active_insert on leads as restrictive
  for insert to authenticated
  with check (is_tenant_active(tenant_id));

create policy leads_tenant_active_update on leads as restrictive
  for update to authenticated
  using (is_tenant_active(tenant_id))
  with check (is_tenant_active(tenant_id));

create policy leads_tenant_active_delete on leads as restrictive
  for delete to authenticated
  using (is_tenant_active(tenant_id));

-- ---------------------------------------------------------------------------
-- lead_notes (tenant_id lives on the parent `leads` row)
-- ---------------------------------------------------------------------------
create policy lead_notes_tenant_active_insert on lead_notes as restrictive
  for insert to authenticated
  with check (
    exists (select 1 from leads where leads.id = lead_notes.lead_id and is_tenant_active(leads.tenant_id))
  );

create policy lead_notes_tenant_active_update on lead_notes as restrictive
  for update to authenticated
  using (
    exists (select 1 from leads where leads.id = lead_notes.lead_id and is_tenant_active(leads.tenant_id))
  )
  with check (
    exists (select 1 from leads where leads.id = lead_notes.lead_id and is_tenant_active(leads.tenant_id))
  );

create policy lead_notes_tenant_active_delete on lead_notes as restrictive
  for delete to authenticated
  using (
    exists (select 1 from leads where leads.id = lead_notes.lead_id and is_tenant_active(leads.tenant_id))
  );

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
create policy projects_tenant_active_insert on projects as restrictive
  for insert to authenticated
  with check (is_tenant_active(tenant_id));

create policy projects_tenant_active_update on projects as restrictive
  for update to authenticated
  using (is_tenant_active(tenant_id))
  with check (is_tenant_active(tenant_id));

create policy projects_tenant_active_delete on projects as restrictive
  for delete to authenticated
  using (is_tenant_active(tenant_id));

-- ---------------------------------------------------------------------------
-- buildings
-- ---------------------------------------------------------------------------
create policy buildings_tenant_active_insert on buildings as restrictive
  for insert to authenticated
  with check (is_tenant_active(tenant_id));

create policy buildings_tenant_active_update on buildings as restrictive
  for update to authenticated
  using (is_tenant_active(tenant_id))
  with check (is_tenant_active(tenant_id));

create policy buildings_tenant_active_delete on buildings as restrictive
  for delete to authenticated
  using (is_tenant_active(tenant_id));

-- ---------------------------------------------------------------------------
-- rentals
-- ---------------------------------------------------------------------------
create policy rentals_tenant_active_insert on rentals as restrictive
  for insert to authenticated
  with check (is_tenant_active(tenant_id));

create policy rentals_tenant_active_update on rentals as restrictive
  for update to authenticated
  using (is_tenant_active(tenant_id))
  with check (is_tenant_active(tenant_id));

create policy rentals_tenant_active_delete on rentals as restrictive
  for delete to authenticated
  using (is_tenant_active(tenant_id));
