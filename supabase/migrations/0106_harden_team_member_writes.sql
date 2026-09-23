-- =============================================================================
-- Migration 0106: team rows are never created, deleted or re-identified by a
-- client JWT, and a tenant has exactly one Owner
-- Run after 0105.
--
-- `users_owner_admin_write` (migration 0005) is a FOR ALL policy, while the
-- privilege-escalation trigger (migrations 0041/0093) only fires on UPDATE
-- and only guards a member's *own* row. Through PostgREST with the public
-- anon key, an Admin could therefore:
--   * INSERT a second `role = 'owner'` row for an auth user they control
--     (Admin -> Owner escalation: billing, domain, account settings),
--   * DELETE the real Owner's row, locking the Owner out of the account,
--   * re-point another member's `auth_user_id`/`phone` to an identity they
--     control and act as that member.
--
-- The application never needs any of these under a user JWT: invites are
-- created by POST /v1/team/invite with the service role, owners only by
-- create_tenant_with_owner() at registration, removal is a status change
-- (`disabled`), and a verified phone change goes through
-- POST /v1/auth/profile-change with the service role. The service role and
-- the SQL editor (no auth.uid()) are unaffected.
--
-- ⚠️ Before running: the one-owner index fails if a tenant already has two
-- owner rows. Check first (must return no rows):
--   select tenant_id, count(*) from users where role = 'owner'
--   group by tenant_id having count(*) > 1;
-- =============================================================================

drop policy if exists users_no_client_insert on users;
create policy users_no_client_insert on users as restrictive
  for insert to authenticated
  with check (false);

drop policy if exists users_no_client_delete on users;
create policy users_no_client_delete on users as restrictive
  for delete to authenticated
  using (false);

create or replace function prevent_users_self_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.tenant_id is distinct from old.tenant_id
    or new.auth_user_id is distinct from old.auth_user_id
    or new.phone is distinct from old.phone
  then
    raise exception 'a team member''s identity fields cannot be changed directly';
  end if;

  if old.id = auth_app_user_id() and (
    new.role is distinct from old.role
    or new.status is distinct from old.status
  ) then
    raise exception 'not allowed to change privileged fields on your own account';
  end if;

  if new.role = 'owner' and old.role is distinct from 'owner' then
    raise exception 'a tenant has exactly one owner, set at registration';
  end if;

  if auth_user_role() = 'admin' and old.role = 'owner' then
    raise exception 'administrators cannot modify owners';
  end if;

  return new;
end;
$$;

create unique index if not exists users_one_owner_per_tenant_uidx
  on users (tenant_id)
  where role = 'owner';
