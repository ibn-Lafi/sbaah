create type conversation_status as enum ('ai_active','human_handoff','closed');
create table whatsapp_conversations (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id) on delete cascade,
 lead_id uuid references leads(id) on delete set null, external_contact_id text not null, status conversation_status not null default 'ai_active',
 assigned_user_id uuid references users(id) on delete set null, last_message_at timestamptz, created_at timestamptz not null default now(),
 unique(tenant_id,external_contact_id)
);
create table whatsapp_messages (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id) on delete cascade,
 conversation_id uuid not null references whatsapp_conversations(id) on delete cascade, provider_message_id text,
 direction text not null check(direction in ('inbound','outbound')), sender_type text not null check(sender_type in ('customer','ai','human','system')),
 body text, metadata jsonb, created_at timestamptz not null default now(), unique(tenant_id,provider_message_id)
);
create index whatsapp_conversations_tenant_last_idx on whatsapp_conversations(tenant_id,last_message_at desc);
create index whatsapp_messages_conversation_idx on whatsapp_messages(conversation_id,created_at);
alter table whatsapp_conversations enable row level security; alter table whatsapp_messages enable row level security;
create policy whatsapp_conversations_tenant_select on whatsapp_conversations for select to authenticated using(tenant_id=auth_tenant_id());
create policy whatsapp_messages_tenant_select on whatsapp_messages for select to authenticated using(tenant_id=auth_tenant_id());