alter type lead_status add value if not exists 'in_progress';

create table lead_requirements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  purpose listing_type,
  budget_min numeric(14,2) check(budget_min>=0),
  budget_max numeric(14,2) check(budget_max>=0),
  property_types property_type[] not null default '{}',
  city_ids uuid[] not null default '{}',
  district_ids uuid[] not null default '{}',
  area_min numeric(12,2) check(area_min>0),
  area_max numeric(12,2) check(area_max>0),
  bedrooms_min smallint check(bedrooms_min>=0),
  timeline text,
  financing text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table lead_interests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  property_id uuid references properties(id) on delete cascade,
  unit_id uuid references units(id) on delete cascade,
  created_at timestamptz not null default now(),
  check ((property_id is not null)::int + (unit_id is not null)::int = 1)
);
create table crm_activities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  activity_type text not null,
  summary text not null,
  metadata jsonb,
  occurred_at timestamptz not null default now()
);
create table crm_tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  assigned_user_id uuid references users(id) on delete set null,
  title text not null,
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table leads add column lost_reason text;

create index lead_requirements_tenant_lead_idx on lead_requirements(tenant_id,lead_id);
create index lead_interests_tenant_lead_idx on lead_interests(tenant_id,lead_id);
create index crm_activities_tenant_lead_idx on crm_activities(tenant_id,lead_id,occurred_at desc);
create index crm_tasks_tenant_due_idx on crm_tasks(tenant_id,due_at) where completed_at is null;

alter table lead_requirements enable row level security;
alter table lead_interests enable row level security;
alter table crm_activities enable row level security;
alter table crm_tasks enable row level security;
create policy lead_requirements_tenant_manage on lead_requirements for all to authenticated using(tenant_id=auth_tenant_id()) with check(tenant_id=auth_tenant_id());
create policy lead_interests_tenant_manage on lead_interests for all to authenticated using(tenant_id=auth_tenant_id()) with check(tenant_id=auth_tenant_id());
create policy crm_activities_tenant_manage on crm_activities for all to authenticated using(tenant_id=auth_tenant_id()) with check(tenant_id=auth_tenant_id());
create policy crm_tasks_tenant_manage on crm_tasks for all to authenticated using(tenant_id=auth_tenant_id()) with check(tenant_id=auth_tenant_id());