-- =============================================================================
-- Migration 0004: CRM tables (leads, lead_notes, property_views, audit_logs)
-- PRODUCT_SPEC.md section 9. Run after 0003.
-- =============================================================================

create type lead_source as enum ('website_form', 'whatsapp_click', 'manual');
create type lead_status as enum ('new', 'contacted', 'qualified', 'won', 'lost');

-- ---------------------------------------------------------------------------
-- leads
-- A visitor interaction becomes a Lead automatically (PRODUCT_SPEC
-- section 1). follow_up_at drives the daily digest email (pg_cron,
-- migration 0006) — no separate "reminder sent" flag: the digest is
-- intentionally repeated daily until the status/date changes.
-- ---------------------------------------------------------------------------
create table leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  property_id uuid references properties (id) on delete set null,
  full_name text not null,
  phone text not null,
  email text,
  source lead_source not null,
  status lead_status not null default 'new',
  assigned_agent_id uuid references users (id),
  follow_up_at timestamptz,
  created_at timestamptz not null default now()
);

create index leads_tenant_id_idx on leads (tenant_id);
create index leads_tenant_status_idx on leads (tenant_id, status);
create index leads_assigned_agent_id_idx on leads (assigned_agent_id) where assigned_agent_id is not null;
create index leads_follow_up_at_idx on leads (follow_up_at) where follow_up_at is not null;

create table lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  user_id uuid not null references users (id),
  note_text text not null,
  created_at timestamptz not null default now()
);

create index lead_notes_lead_id_idx on lead_notes (lead_id);

-- ---------------------------------------------------------------------------
-- property_views
-- One row per view event. Aggregated on read for analytics (PRODUCT_SPEC
-- section 4/9) — no separate rollup/summary table needed at this scale.
-- ---------------------------------------------------------------------------
create table property_views (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  property_id uuid not null references properties (id) on delete cascade,
  source text,
  created_at timestamptz not null default now()
);

create index property_views_tenant_id_idx on property_views (tenant_id);
create index property_views_property_id_idx on property_views (property_id);

-- ---------------------------------------------------------------------------
-- audit_logs
-- Sensitive operations only (role changes, deletions, billing changes) —
-- not every read/write, per PRODUCT_SPEC section 9.
-- ---------------------------------------------------------------------------
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  user_id uuid references users (id),
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_tenant_id_idx on audit_logs (tenant_id);
