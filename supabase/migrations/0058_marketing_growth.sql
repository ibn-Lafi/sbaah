create table marketing_mandates (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id) on delete cascade,
 reference_number text not null, issuer text, starts_at date, expires_at date, notes text,
 created_at timestamptz not null default now(), unique(tenant_id,reference_number)
);
alter table properties add constraint properties_marketing_mandate_fk foreign key(marketing_mandate_id) references marketing_mandates(id) on delete set null;

alter table leads add column utm_source text, add column utm_medium text, add column utm_campaign text, add column utm_content text, add column utm_term text, add column referrer text;

create table tracking_pixels (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id) on delete cascade,
 provider text not null check(provider in ('meta','tiktok','snapchat')), pixel_id text not null,
 is_enabled boolean not null default true, created_at timestamptz not null default now(), unique(tenant_id,provider,pixel_id)
);
alter table marketing_mandates enable row level security; alter table tracking_pixels enable row level security;
create policy marketing_mandates_tenant_manage on marketing_mandates for all to authenticated using(tenant_id=auth_tenant_id()) with check(tenant_id=auth_tenant_id());
create policy tracking_pixels_tenant_manage on tracking_pixels for all to authenticated using(tenant_id=auth_tenant_id()) with check(tenant_id=auth_tenant_id());