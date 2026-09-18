-- Migration 0064: project media for developer public project galleries
create table if not exists project_media (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  url text not null,
  media_type text not null default 'image' check (media_type in ('image','video')),
  alt_ar text,
  alt_en text,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists project_media_project_idx on project_media(tenant_id, project_id, order_index);
alter table project_media enable row level security;
create policy project_media_tenant_select on project_media for select to authenticated using (tenant_id=auth_tenant_id());
create policy project_media_owner_admin_insert on project_media for insert to authenticated with check (tenant_id=auth_tenant_id() and auth_user_role() in ('owner','admin') and is_tenant_active(tenant_id));
create policy project_media_owner_admin_update on project_media for update to authenticated using (tenant_id=auth_tenant_id() and auth_user_role() in ('owner','admin') and is_tenant_active(tenant_id)) with check (tenant_id=auth_tenant_id());
create policy project_media_owner_admin_delete on project_media for delete to authenticated using (tenant_id=auth_tenant_id() and auth_user_role() in ('owner','admin') and is_tenant_active(tenant_id));
create policy project_media_public_select on project_media for select to anon using (exists(select 1 from projects p join tenants t on t.id=p.tenant_id where p.id=project_media.project_id and p.tenant_id=project_media.tenant_id and p.status='published' and is_tenant_active(t.id)));
revoke all on table project_media from anon,authenticated;
grant select on table project_media to anon;
grant select,insert,update,delete on table project_media to authenticated;