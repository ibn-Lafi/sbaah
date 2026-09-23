-- =============================================================================
-- Migration 0105: a disabled team member loses all data access
-- Run after 0104.
--
-- PATCH /v1/team/[id] marks a removed member `status = 'disabled'`, but the
-- RLS identity helpers (migration 0005) and the permission resolver
-- (migration 0052) never looked at `users.status`. A disabled member's
-- still-valid JWT/refresh token — and even a fresh password or OTP login —
-- kept full read/write access to the tenant through every policy, and
-- directly through PostgREST with the public anon key.
--
-- Returning NULL for a disabled member makes every policy built on these
-- helpers deny by construction (tenant_id = NULL is never true), so this
-- one change closes the gap for all existing and future policies at once.
-- 'invited' members stay allowed: their first login is what activates them.
--
-- Signatures and return types are unchanged, so every dependent policy keeps
-- working without being recreated. Safe to re-run.
-- =============================================================================

create or replace function auth_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from users where auth_user_id = auth.uid() and status <> 'disabled';
$$;

create or replace function auth_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from users where auth_user_id = auth.uid() and status <> 'disabled';
$$;

create or replace function auth_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from users where auth_user_id = auth.uid() and status <> 'disabled';
$$;

create or replace function auth_permission_scope(check_permission text)
returns data_scope
language sql
stable
security definer
set search_path = ''
as $$
  select grants.data_scope
  from public.role_permission_grants grants
  join public.users app_user
    on app_user.auth_user_id = auth.uid()
  where grants.role = app_user.role
    and grants.permission = check_permission
    and app_user.status <> 'disabled'
  limit 1;
$$;
