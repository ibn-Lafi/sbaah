-- Core persistence for one Sbaah AI assistant per tenant.
create table if not exists public.ai_assistants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  personality text not null default '' check (char_length(personality) <= 6000),
  status text not null default 'active' check (status in ('active','paused')),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_assistants_one_per_tenant unique (tenant_id)
);
create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  assistant_id uuid not null references public.ai_assistants(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  title text,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  sender text not null check (sender in ('user','assistant','system','tool')),
  content text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists public.ai_action_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  assistant_id uuid not null references public.ai_assistants(id) on delete cascade,
  conversation_id uuid references public.ai_conversations(id) on delete set null,
  requested_by uuid references public.users(id) on delete set null,
  tool_name text not null,
  risk_level text not null default 'read' check (risk_level in ('read','write','sensitive')),
  status text not null check (status in ('requested','awaiting_confirmation','running','succeeded','failed','cancelled')),
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  error_message text,
  confirmed_at timestamptz,
  executed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ai_conversations_tenant_last_message_idx on public.ai_conversations(tenant_id, last_message_at desc);
create index if not exists ai_messages_conversation_created_idx on public.ai_messages(conversation_id, created_at);
create index if not exists ai_action_logs_tenant_created_idx on public.ai_action_logs(tenant_id, created_at desc);
alter table public.ai_assistants enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_action_logs enable row level security;
revoke all on public.ai_assistants, public.ai_conversations, public.ai_messages, public.ai_action_logs from anon;
grant select, insert, update on public.ai_assistants to authenticated, service_role;
grant select, insert, update, delete on public.ai_conversations, public.ai_messages to authenticated, service_role;
grant select on public.ai_action_logs to authenticated;
grant select, insert, update, delete on public.ai_action_logs to service_role;
create policy ai_assistants_tenant_select on public.ai_assistants for select to authenticated using (tenant_id = auth_tenant_id());
create policy ai_assistants_owner_admin_insert on public.ai_assistants for insert to authenticated with check (tenant_id = auth_tenant_id() and auth_user_role() = any(array['owner'::user_role,'admin'::user_role]));
create policy ai_assistants_owner_admin_update on public.ai_assistants for update to authenticated using (tenant_id = auth_tenant_id() and auth_user_role() = any(array['owner'::user_role,'admin'::user_role])) with check (tenant_id = auth_tenant_id() and auth_user_role() = any(array['owner'::user_role,'admin'::user_role]));
create policy ai_conversations_tenant_select on public.ai_conversations for select to authenticated using (tenant_id = auth_tenant_id());
create policy ai_conversations_tenant_insert on public.ai_conversations for insert to authenticated with check (tenant_id = auth_tenant_id() and created_by = auth_app_user_id());
create policy ai_conversations_tenant_update on public.ai_conversations for update to authenticated using (tenant_id = auth_tenant_id() and created_by = auth_app_user_id()) with check (tenant_id = auth_tenant_id() and created_by = auth_app_user_id());
create policy ai_conversations_tenant_delete on public.ai_conversations for delete to authenticated using (tenant_id = auth_tenant_id() and created_by = auth_app_user_id());
create policy ai_messages_tenant_select on public.ai_messages for select to authenticated using (tenant_id = auth_tenant_id());
create policy ai_messages_user_insert on public.ai_messages for insert to authenticated with check (tenant_id = auth_tenant_id() and sender = 'user' and created_by = auth_app_user_id());
create policy ai_messages_user_delete on public.ai_messages for delete to authenticated using (tenant_id = auth_tenant_id() and sender = 'user' and created_by = auth_app_user_id());
create policy ai_action_logs_owner_admin_select on public.ai_action_logs for select to authenticated using (tenant_id = auth_tenant_id() and auth_user_role() = any(array['owner'::user_role,'admin'::user_role]));
