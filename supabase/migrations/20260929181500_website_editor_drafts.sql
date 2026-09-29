create table if not exists website_editor_drafts (
  website_id uuid primary key references websites(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  website jsonb not null default '{}'::jsonb,
  sections jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (website_id, tenant_id)
);
alter table website_editor_drafts enable row level security;
create policy website_editor_drafts_tenant_manage on website_editor_drafts for all to authenticated
using (tenant_id = auth_tenant_id() and auth_user_role() in ('owner','admin'))
with check (tenant_id = auth_tenant_id() and auth_user_role() in ('owner','admin'));
create index if not exists website_editor_drafts_tenant_id_idx on website_editor_drafts(tenant_id);
