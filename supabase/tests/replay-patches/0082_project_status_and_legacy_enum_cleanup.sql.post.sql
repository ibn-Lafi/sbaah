-- Restores the policy dropped by the .pre.sql, exactly as migration 0064 defined it.
create policy project_media_public_select on project_media for select to anon using (exists(select 1 from projects p join tenants t on t.id=p.tenant_id where p.id=project_media.project_id and p.tenant_id=project_media.tenant_id and p.status='published' and is_tenant_active(t.id)));
