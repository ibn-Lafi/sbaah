create type viewing_status as enum ('scheduled','completed','rescheduled','cancelled','no_show');
create type viewing_outcome as enum ('interested','follow_up','not_interested');
create type deal_status as enum ('open','negotiation','won','lost');

create table viewings (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id) on delete cascade,
 lead_id uuid not null references leads(id) on delete cascade, property_id uuid references properties(id) on delete set null,
 unit_id uuid references units(id) on delete set null, assigned_user_id uuid not null references users(id) on delete restrict,
 scheduled_at timestamptz not null, status viewing_status not null default 'scheduled', outcome viewing_outcome,
 notes text, created_by uuid references users(id) on delete set null, created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), check ((property_id is not null)::int + (unit_id is not null)::int = 1)
);
create index viewings_tenant_schedule_idx on viewings(tenant_id,scheduled_at);
create index viewings_lead_idx on viewings(tenant_id,lead_id);

create table deals (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id) on delete cascade,
 lead_id uuid not null references leads(id) on delete restrict, property_id uuid references properties(id) on delete set null,
 unit_id uuid references units(id) on delete set null, responsible_user_id uuid references users(id) on delete set null,
 status deal_status not null default 'open', value numeric(14,2) check(value>=0), expected_close_date date,
 lost_reason text, commission_type text check(commission_type in ('fixed','percentage')),
 commission_value numeric(14,4) check(commission_value>=0), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index deals_tenant_status_idx on deals(tenant_id,status);

alter table viewings enable row level security; alter table deals enable row level security;
create policy viewings_tenant_manage on viewings for all to authenticated using(tenant_id=auth_tenant_id()) with check(tenant_id=auth_tenant_id());
create policy deals_tenant_manage on deals for all to authenticated using(tenant_id=auth_tenant_id()) with check(tenant_id=auth_tenant_id());