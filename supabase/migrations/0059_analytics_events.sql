create table analytics_events (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id) on delete cascade,
 event_name text not null, actor_user_id uuid references users(id) on delete set null,
 entity_type text, entity_id uuid, source text, metadata jsonb, occurred_at timestamptz not null default now()
);
create index analytics_events_tenant_time_idx on analytics_events(tenant_id,occurred_at desc);
create index analytics_events_tenant_name_idx on analytics_events(tenant_id,event_name,occurred_at desc);
alter table analytics_events enable row level security;
create policy analytics_events_tenant_select on analytics_events for select to authenticated using(tenant_id=auth_tenant_id());
create policy analytics_events_tenant_insert on analytics_events for insert to authenticated with check(tenant_id=auth_tenant_id());