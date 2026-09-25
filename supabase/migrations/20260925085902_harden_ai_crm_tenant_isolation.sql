-- Harden the CRM tables used by Sbaah AI against cross-tenant writes.
--
-- Older *_tenant_active_* policies only checked whether the row's tenant was
-- active. Because PostgreSQL permissive policies are ORed, any authenticated
-- user could satisfy those policies with another active tenant_id. Replace
-- them with explicit tenant and role/assignment checks.

-- Leads ---------------------------------------------------------------------
drop policy if exists leads_tenant_active_insert on public.leads;
drop policy if exists leads_tenant_active_update on public.leads;
drop policy if exists leads_tenant_active_delete on public.leads;
drop policy if exists leads_owner_admin_manage on public.leads;
drop policy if exists leads_agent_select on public.leads;
drop policy if exists leads_agent_update on public.leads;
drop policy if exists leads_manager_select on public.leads;
drop policy if exists leads_manager_insert on public.leads;
drop policy if exists leads_agent_insert on public.leads;
drop policy if exists leads_manager_update on public.leads;
drop policy if exists leads_manager_delete on public.leads;

create policy leads_manager_select on public.leads
for select to authenticated
using (
  tenant_id = (select public.auth_tenant_id())
  and (select public.auth_user_role()) in ('owner', 'admin')
);

create policy leads_agent_select on public.leads
for select to authenticated
using (
  tenant_id = (select public.auth_tenant_id())
  and (select public.auth_user_role()) = 'agent'
  and assigned_agent_id = (select public.auth_app_user_id())
);

create policy leads_manager_insert on public.leads
for insert to authenticated
with check (
  tenant_id = (select public.auth_tenant_id())
  and (select public.auth_user_role()) in ('owner', 'admin')
  and public.is_tenant_active(tenant_id)
);

create policy leads_agent_insert on public.leads
for insert to authenticated
with check (
  tenant_id = (select public.auth_tenant_id())
  and (select public.auth_user_role()) = 'agent'
  and assigned_agent_id = (select public.auth_app_user_id())
  and public.is_tenant_active(tenant_id)
);

create policy leads_manager_update on public.leads
for update to authenticated
using (
  tenant_id = (select public.auth_tenant_id())
  and (select public.auth_user_role()) in ('owner', 'admin')
)
with check (
  tenant_id = (select public.auth_tenant_id())
  and (select public.auth_user_role()) in ('owner', 'admin')
  and public.is_tenant_active(tenant_id)
);

create policy leads_agent_update on public.leads
for update to authenticated
using (
  tenant_id = (select public.auth_tenant_id())
  and (select public.auth_user_role()) = 'agent'
  and assigned_agent_id = (select public.auth_app_user_id())
)
with check (
  tenant_id = (select public.auth_tenant_id())
  and (select public.auth_user_role()) = 'agent'
  and assigned_agent_id = (select public.auth_app_user_id())
  and public.is_tenant_active(tenant_id)
);

create policy leads_manager_delete on public.leads
for delete to authenticated
using (
  tenant_id = (select public.auth_tenant_id())
  and (select public.auth_user_role()) in ('owner', 'admin')
  and public.is_tenant_active(tenant_id)
);

-- Lead notes ----------------------------------------------------------------
drop policy if exists lead_notes_tenant_active_insert on public.lead_notes;
drop policy if exists lead_notes_tenant_active_update on public.lead_notes;
drop policy if exists lead_notes_tenant_active_delete on public.lead_notes;
drop policy if exists lead_notes_owner_admin_manage on public.lead_notes;
drop policy if exists lead_notes_agent_manage on public.lead_notes;
drop policy if exists lead_notes_scoped_select on public.lead_notes;
drop policy if exists lead_notes_scoped_insert on public.lead_notes;
drop policy if exists lead_notes_scoped_update on public.lead_notes;
drop policy if exists lead_notes_scoped_delete on public.lead_notes;

create policy lead_notes_scoped_select on public.lead_notes
for select to authenticated
using (public.auth_can_access_lead(lead_id));

create policy lead_notes_scoped_insert on public.lead_notes
for insert to authenticated
with check (
  public.auth_can_access_lead(lead_id)
  and user_id = (select public.auth_app_user_id())
  and exists (
    select 1
    from public.leads l
    where l.id = lead_notes.lead_id
      and l.tenant_id = (select public.auth_tenant_id())
      and public.is_tenant_active(l.tenant_id)
  )
);

create policy lead_notes_scoped_update on public.lead_notes
for update to authenticated
using (
  public.auth_can_access_lead(lead_id)
  and (
    (select public.auth_user_role()) in ('owner', 'admin')
    or user_id = (select public.auth_app_user_id())
  )
)
with check (
  public.auth_can_access_lead(lead_id)
  and (
    (select public.auth_user_role()) in ('owner', 'admin')
    or user_id = (select public.auth_app_user_id())
  )
  and exists (
    select 1
    from public.leads l
    where l.id = lead_notes.lead_id
      and l.tenant_id = (select public.auth_tenant_id())
      and public.is_tenant_active(l.tenant_id)
  )
);

create policy lead_notes_scoped_delete on public.lead_notes
for delete to authenticated
using (
  public.auth_can_access_lead(lead_id)
  and (
    (select public.auth_user_role()) in ('owner', 'admin')
    or user_id = (select public.auth_app_user_id())
  )
  and exists (
    select 1
    from public.leads l
    where l.id = lead_notes.lead_id
      and l.tenant_id = (select public.auth_tenant_id())
      and public.is_tenant_active(l.tenant_id)
  )
);

-- Projects ------------------------------------------------------------------
drop policy if exists projects_tenant_active_insert on public.projects;
drop policy if exists projects_tenant_active_update on public.projects;
drop policy if exists projects_tenant_active_delete on public.projects;
drop policy if exists projects_owner_admin_manage on public.projects;
drop policy if exists projects_agent_select on public.projects;
drop policy if exists projects_manager_select on public.projects;
drop policy if exists projects_manager_insert on public.projects;
drop policy if exists projects_manager_update on public.projects;
drop policy if exists projects_manager_delete on public.projects;

create policy projects_manager_select on public.projects
for select to authenticated
using (
  tenant_id = (select public.auth_tenant_id())
  and (select public.auth_user_role()) in ('owner', 'admin')
);

create policy projects_agent_select on public.projects
for select to authenticated
using (
  tenant_id = (select public.auth_tenant_id())
  and (select public.auth_user_role()) = 'agent'
);

create policy projects_manager_insert on public.projects
for insert to authenticated
with check (
  tenant_id = (select public.auth_tenant_id())
  and (select public.auth_user_role()) in ('owner', 'admin')
  and public.is_tenant_active(tenant_id)
);

create policy projects_manager_update on public.projects
for update to authenticated
using (
  tenant_id = (select public.auth_tenant_id())
  and (select public.auth_user_role()) in ('owner', 'admin')
)
with check (
  tenant_id = (select public.auth_tenant_id())
  and (select public.auth_user_role()) in ('owner', 'admin')
  and public.is_tenant_active(tenant_id)
);

create policy projects_manager_delete on public.projects
for delete to authenticated
using (
  tenant_id = (select public.auth_tenant_id())
  and (select public.auth_user_role()) in ('owner', 'admin')
  and public.is_tenant_active(tenant_id)
);
