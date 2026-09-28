-- Persistent per-user notification inbox.
-- Applied to production as user_notifications_foundation.
create table if not exists public.notifications (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete cascade,
 recipient_user_id uuid not null references public.users(id) on delete cascade,
 category text not null check (category in ('customers','projects','units','calendar','rent','system')),
 level text not null default 'info' check (level in ('high','important','new','info')),
 title text not null, body text not null, href text, event_key text,
 read_at timestamptz, created_at timestamptz not null default now()
);
create index if not exists notifications_recipient_created_idx on public.notifications(recipient_user_id,created_at desc);
create index if not exists notifications_tenant_recipient_unread_idx on public.notifications(tenant_id,recipient_user_id,read_at,created_at desc);
create unique index if not exists notifications_recipient_event_key_uidx on public.notifications(recipient_user_id,event_key) where event_key is not null;
alter table public.notifications enable row level security;
grant select, update on public.notifications to authenticated;
revoke insert, delete on public.notifications from anon, authenticated;
drop policy if exists notifications_own_select on public.notifications;
create policy notifications_own_select on public.notifications for select to authenticated using (tenant_id=auth_tenant_id() and recipient_user_id=auth_app_user_id());
drop policy if exists notifications_own_update on public.notifications;
create policy notifications_own_update on public.notifications for update to authenticated using (tenant_id=auth_tenant_id() and recipient_user_id=auth_app_user_id()) with check (tenant_id=auth_tenant_id() and recipient_user_id=auth_app_user_id());
