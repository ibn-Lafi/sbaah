-- Team RBAC foundation: per-user grants + forced password change.
-- Owner remains unrestricted; team members receive only explicit grants.
alter table public.users
  add column if not exists must_change_password boolean not null default false;

create table if not exists public.user_permission_grants (
  user_id uuid not null references public.users(id) on delete cascade,
  permission text not null,
  data_scope public.data_scope not null default 'organization',
  created_at timestamptz not null default now(),
  primary key (user_id, permission)
);

create index if not exists user_permission_grants_user_id_idx
  on public.user_permission_grants(user_id);

alter table public.user_permission_grants enable row level security;
revoke all on table public.user_permission_grants from anon, authenticated;

create or replace function public.auth_permission_scope(check_permission text)
returns public.data_scope
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when app_user.role = 'owner'::public.user_role then 'organization'::public.data_scope
    else (
      select grant_row.data_scope
      from public.user_permission_grants grant_row
      where grant_row.user_id = app_user.id
        and grant_row.permission = check_permission
      limit 1
    )
  end
  from public.users app_user
  where app_user.auth_user_id = auth.uid()
    and app_user.status <> 'disabled'
  limit 1;
$$;

create or replace function public.auth_has_permission(check_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.auth_permission_scope(check_permission) is not null;
$$;

revoke all on function public.auth_permission_scope(text) from public;
revoke all on function public.auth_has_permission(text) from public;
grant execute on function public.auth_permission_scope(text) to authenticated;
grant execute on function public.auth_has_permission(text) to authenticated;

comment on column public.users.must_change_password is
  'True for team accounts created with an administrator-issued temporary password; dashboard access must remain blocked until changed.';
