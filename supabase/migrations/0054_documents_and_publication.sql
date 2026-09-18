create type document_owner_type as enum ('property','project','unit','marketing_mandate','deal');
create type publication_state as enum ('draft','ready','published','blocked');

create table documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  owner_type document_owner_type not null,
  owner_id uuid not null,
  document_type text not null,
  name text not null,
  storage_path text not null,
  mime_type text,
  expires_at timestamptz,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index documents_tenant_owner_idx on documents(tenant_id, owner_type, owner_id);
alter table documents enable row level security;
create policy documents_tenant_select on documents for select to authenticated using (tenant_id=auth_tenant_id());
create policy documents_tenant_insert on documents for insert to authenticated with check (tenant_id=auth_tenant_id() and created_by=auth_app_user_id() and is_tenant_active(tenant_id));
create policy documents_tenant_delete on documents for delete to authenticated using (tenant_id=auth_tenant_id() and is_tenant_active(tenant_id));

alter table properties add column publication_state publication_state not null default 'draft';