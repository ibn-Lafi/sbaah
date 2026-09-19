create table if not exists platform_google_analytics (
  id boolean primary key default true check (id),
  measurement_id text not null,
  external_property_id text,
  external_stream_id text,
  oauth_refresh_token_ciphertext text,
  oauth_scopes text[] not null default '{}'::text[],
  connected_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table platform_google_analytics enable row level security;
revoke all on platform_google_analytics from anon, authenticated;
create table if not exists platform_google_analytics_oauth_states (
  id uuid primary key default gen_random_uuid(),
  state_hash text not null unique,
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table platform_google_analytics_oauth_states enable row level security;
revoke all on platform_google_analytics_oauth_states from anon, authenticated;
