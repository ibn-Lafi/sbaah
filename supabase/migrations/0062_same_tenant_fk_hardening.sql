-- Defense-in-depth: every tenant-owned FK introduced by the new domains
-- must resolve inside the same tenant, even if a client bypasses the API.
alter table users add constraint users_id_tenant_unique unique(id,tenant_id);
alter table projects add constraint projects_id_tenant_unique unique(id,tenant_id);
alter table buildings add constraint buildings_id_tenant_unique unique(id,tenant_id);
alter table properties add constraint properties_id_tenant_unique unique(id,tenant_id);
alter table leads add constraint leads_id_tenant_unique unique(id,tenant_id);
alter table marketing_mandates add constraint marketing_mandates_id_tenant_unique unique(id,tenant_id);
alter table units add constraint units_id_tenant_unique unique(id,tenant_id);

alter table buildings add constraint buildings_project_same_tenant foreign key(project_id,tenant_id) references projects(id,tenant_id) on delete set null (project_id);
alter table properties add constraint properties_project_same_tenant foreign key(project_id,tenant_id) references projects(id,tenant_id) on delete set null (project_id);
alter table properties add constraint properties_building_same_tenant foreign key(building_id,tenant_id) references buildings(id,tenant_id) on delete set null (building_id);

alter table project_phases add constraint project_phases_project_same_tenant foreign key(project_id,tenant_id) references projects(id,tenant_id) on delete cascade;
alter table unit_types add constraint unit_types_project_same_tenant foreign key(project_id,tenant_id) references projects(id,tenant_id) on delete cascade;
alter table units add constraint units_project_same_tenant foreign key(project_id,tenant_id) references projects(id,tenant_id) on delete cascade;
alter table units add constraint units_phase_same_tenant foreign key(phase_id,tenant_id) references project_phases(id,tenant_id) on delete set null (phase_id);
alter table units add constraint units_building_same_tenant foreign key(building_id,tenant_id) references buildings(id,tenant_id) on delete set null (building_id);
alter table units add constraint units_unit_type_same_tenant foreign key(unit_type_id,tenant_id) references unit_types(id,tenant_id) on delete restrict;

alter table lead_requirements add constraint lead_requirements_lead_same_tenant foreign key(lead_id,tenant_id) references leads(id,tenant_id) on delete cascade;
alter table lead_interests add constraint lead_interests_lead_same_tenant foreign key(lead_id,tenant_id) references leads(id,tenant_id) on delete cascade;
alter table lead_interests add constraint lead_interests_property_same_tenant foreign key(property_id,tenant_id) references properties(id,tenant_id) on delete cascade;
alter table lead_interests add constraint lead_interests_unit_same_tenant foreign key(unit_id,tenant_id) references units(id,tenant_id) on delete cascade;
alter table crm_activities add constraint crm_activities_lead_same_tenant foreign key(lead_id,tenant_id) references leads(id,tenant_id) on delete cascade;
alter table crm_tasks add constraint crm_tasks_lead_same_tenant foreign key(lead_id,tenant_id) references leads(id,tenant_id) on delete cascade;
alter table crm_tasks add constraint crm_tasks_assignee_same_tenant foreign key(assigned_user_id,tenant_id) references users(id,tenant_id) on delete set null (assigned_user_id);

alter table viewings add constraint viewings_lead_same_tenant foreign key(lead_id,tenant_id) references leads(id,tenant_id) on delete cascade;
alter table viewings add constraint viewings_property_same_tenant foreign key(property_id,tenant_id) references properties(id,tenant_id) on delete set null (property_id);
alter table viewings add constraint viewings_unit_same_tenant foreign key(unit_id,tenant_id) references units(id,tenant_id) on delete set null (unit_id);
alter table viewings add constraint viewings_assignee_same_tenant foreign key(assigned_user_id,tenant_id) references users(id,tenant_id) on delete restrict;

alter table deals add constraint deals_lead_same_tenant foreign key(lead_id,tenant_id) references leads(id,tenant_id) on delete restrict;
alter table deals add constraint deals_property_same_tenant foreign key(property_id,tenant_id) references properties(id,tenant_id) on delete set null (property_id);
alter table deals add constraint deals_unit_same_tenant foreign key(unit_id,tenant_id) references units(id,tenant_id) on delete set null (unit_id);
alter table deals add constraint deals_responsible_same_tenant foreign key(responsible_user_id,tenant_id) references users(id,tenant_id) on delete set null (responsible_user_id);

alter table properties add constraint properties_marketing_mandate_same_tenant foreign key(marketing_mandate_id,tenant_id) references marketing_mandates(id,tenant_id) on delete set null (marketing_mandate_id);
