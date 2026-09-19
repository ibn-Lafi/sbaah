-- OAuth state is short-lived, one-time, and stores no Google token.
create table google_analytics_oauth_states (
  id uuid primary key default gen_random_uuid(),
  state_hash text not null unique,
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index google_analytics_oauth_states_expiry_idx on google_analytics_oauth_states(expires_at);
alter table google_analytics_oauth_states enable row level security;
revoke all on google_analytics_oauth_states from anon, authenticated;
