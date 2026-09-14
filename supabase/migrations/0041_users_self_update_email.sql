-- =============================================================================
-- Migration 0041: a user may update their own email
-- Run after 0040.
--
-- Migration 0005's `users_owner_admin_write` policy only lets Owner/Admin
-- write `users` rows — an Agent editing their own email from "حسابي"
-- (PATCH /v1/auth/me) has no policy to allow that update at all. This adds
-- one, scoped to a user's own row.
--
-- RLS policies are permissive (OR'd together): once this policy exists,
-- it alone would let a self-update reach ANY column on the caller's own
-- row, not just email — the API route only ever sends `{email}`, but RLS
-- is meant to be a real boundary independent of route code (same
-- reasoning as migration 0019's write-lock). A trigger enforces the
-- narrower rule a plain policy can't express (comparing OLD vs NEW): a
-- non-owner/admin actor updating their own row may change email (and
-- full_name, already editable via the same self-service idea) but not
-- role/status/tenant_id/phone/auth_user_id.
-- =============================================================================

create policy users_self_update on users
  for update to authenticated
  using (id = auth_app_user_id())
  with check (id = auth_app_user_id());

create function prevent_users_self_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth_user_role() not in ('owner', 'admin') then
    if new.role is distinct from old.role
      or new.status is distinct from old.status
      or new.tenant_id is distinct from old.tenant_id
      or new.phone is distinct from old.phone
      or new.auth_user_id is distinct from old.auth_user_id
    then
      raise exception 'not allowed to change this field on your own account';
    end if;
  end if;
  return new;
end;
$$;

create trigger users_prevent_self_privilege_escalation
  before update on users
  for each row
  execute function prevent_users_self_privilege_escalation();
