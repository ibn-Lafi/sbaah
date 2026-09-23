-- =============================================================================
-- Migration 0112: support center schema under version control
-- Run after 0111.
--
-- The support center tables were created from docs/sql/support_center.sql,
-- outside the numbered migrations, so no database rebuilt from this
-- repository had them. This migration is written to be safe on a database
-- where that file already ran: tables and indexes are IF NOT EXISTS and
-- every policy is dropped and recreated.
--
-- The policies now use the shared identity helpers instead of raw
-- `users` subqueries, so a disabled member loses access here too
-- (migration 0105), and a member can no longer file a ticket or message
-- under another user's name or pre-set staff-only fields through
-- PostgREST.
-- =============================================================================

create extension if not exists pgcrypto;

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,
  tenant_id uuid references public.tenants(id) on delete set null,
  created_by_user_id uuid references public.users(id) on delete set null,
  requester_name text not null,
  requester_email text not null,
  requester_phone text,
  type text not null check (type in ('complaint','suggestion','support')),
  category text not null check (category in ('billing','technical','account','website','domain','other')),
  subject text not null,
  description text not null,
  status text not null default 'open' check (status in ('open','in_progress','waiting_customer','resolved','closed')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  assigned_admin_id uuid references public.platform_admins(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_type text not null check (sender_type in ('customer','admin')),
  sender_user_id uuid references public.users(id) on delete set null,
  sender_admin_id uuid references public.platform_admins(id) on delete set null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists support_tickets_tenant_idx on public.support_tickets(tenant_id, created_at desc);
create index if not exists support_tickets_status_idx on public.support_tickets(status, created_at desc);
create index if not exists support_ticket_messages_ticket_idx on public.support_ticket_messages(ticket_id, created_at);

alter table public.support_tickets enable row level security;
alter table public.support_ticket_messages enable row level security;

drop policy if exists support_tickets_tenant_select on public.support_tickets;
create policy support_tickets_tenant_select on public.support_tickets for select to authenticated
  using (tenant_id = auth_tenant_id() or is_platform_admin());

drop policy if exists support_tickets_tenant_insert on public.support_tickets;
create policy support_tickets_tenant_insert on public.support_tickets for insert to authenticated
  with check (
    tenant_id = auth_tenant_id()
    and created_by_user_id = auth_app_user_id()
    and status = 'open'
    and assigned_admin_id is null
  );

drop policy if exists support_tickets_admin_update on public.support_tickets;
create policy support_tickets_admin_update on public.support_tickets for update to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

drop policy if exists support_messages_read on public.support_ticket_messages;
create policy support_messages_read on public.support_ticket_messages for select to authenticated
  using (
    exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id and (t.tenant_id = auth_tenant_id() or is_platform_admin())
    )
  );

drop policy if exists support_messages_customer_insert on public.support_ticket_messages;
create policy support_messages_customer_insert on public.support_ticket_messages for insert to authenticated
  with check (
    sender_type = 'customer'
    and sender_user_id = auth_app_user_id()
    and sender_admin_id is null
    and exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id and t.tenant_id = auth_tenant_id()
    )
  );

drop policy if exists support_messages_admin_insert on public.support_ticket_messages;
create policy support_messages_admin_insert on public.support_ticket_messages for insert to authenticated
  with check (sender_type = 'admin' and is_platform_admin());

create or replace function public.set_support_ticket_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists support_ticket_updated_at on public.support_tickets;
create trigger support_ticket_updated_at before update on public.support_tickets
  for each row execute function public.set_support_ticket_updated_at();

revoke all on function public.set_support_ticket_updated_at() from public, anon, authenticated;
