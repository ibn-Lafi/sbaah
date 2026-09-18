-- Final RLS/publication hardening for the new domains.
drop policy if exists properties_public_select on properties;
create policy properties_public_select on properties for select to anon
using (status='published' and publication_state='published' and is_tenant_active(tenant_id));

create policy projects_public_select on projects for select to anon
using (status='published' and is_tenant_active(tenant_id));
create policy unit_types_public_select on unit_types for select to anon
using (exists(select 1 from projects p where p.id=unit_types.project_id and p.tenant_id=unit_types.tenant_id and p.status='published' and is_tenant_active(p.tenant_id)));
create policy units_public_select on units for select to anon
using (availability='available' and exists(select 1 from projects p where p.id=units.project_id and p.tenant_id=units.tenant_id and p.status='published' and is_tenant_active(p.tenant_id)));

revoke all on documents, project_phases, unit_types, units, lead_requirements, lead_interests, crm_activities, crm_tasks, viewings, deals, marketing_mandates, tracking_pixels, analytics_events, whatsapp_conversations, whatsapp_messages from anon, authenticated;
grant select,insert,update,delete on documents, project_phases, unit_types, units, lead_requirements, lead_interests, crm_activities, crm_tasks, viewings, deals, marketing_mandates, tracking_pixels to authenticated;
grant select,insert on analytics_events to authenticated;
grant select on whatsapp_conversations, whatsapp_messages to authenticated;
grant select on projects, unit_types, units to anon;
