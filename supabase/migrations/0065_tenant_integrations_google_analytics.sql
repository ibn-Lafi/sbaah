-- Google Analytics tenant integration.
-- Secrets/tokens are never readable by anon users. Owner/Admin manage their own tenant row through RLS.
create table tenant_integrations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  provider text not null check (provider in ('google_analytics')),
  status text not null default 'installed' check (status in ('installed','connected','error')),
  measurement_id text,
  external_property_id text,
  external_stream_id text,
  oauth_refresh_token_ciphertext text,
  oauth_scopes text[] not null default '{}'::text[],
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, provider),
  constraint tenant_integrations_ga_measurement_id_check check (
    measurement_id is null or measurement_id ~ '^G-[A-Z0-9]+$'
  )
);

create index tenant_integrations_tenant_provider_idx on tenant_integrations(tenant_id, provider);

create trigger tenant_integrations_set_updated_at
  before update on tenant_integrations
  for each row execute function set_updated_at();

alter table tenant_integrations enable row level security;

create policy tenant_integrations_tenant_select on tenant_integrations
  for select to authenticated
  using (tenant_id = auth_tenant_id() and auth_user_role() in ('owner','admin'));

create policy tenant_integrations_tenant_insert on tenant_integrations
  for insert to authenticated
  with check (tenant_id = auth_tenant_id() and auth_user_role() in ('owner','admin'));

create policy tenant_integrations_tenant_update on tenant_integrations
  for update to authenticated
  using (tenant_id = auth_tenant_id() and auth_user_role() in ('owner','admin'))
  with check (tenant_id = auth_tenant_id() and auth_user_role() in ('owner','admin'));

create policy tenant_integrations_tenant_delete on tenant_integrations
  for delete to authenticated
  using (tenant_id = auth_tenant_id() and auth_user_role() in ('owner','admin'));

revoke all on tenant_integrations from anon, authenticated;
grant select, insert, update, delete on tenant_integrations to authenticated;
