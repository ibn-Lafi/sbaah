-- =============================================================================
-- Migration 0043: prevent an Owner from touching their own tenant's
-- billing/status columns through `tenants_owner_update`
-- Run after 0042.
--
-- Security audit finding: `tenants_owner_update` (migration 0005) is a
-- plain permissive policy — `for update ... using (id = auth_tenant_id()
-- and auth_user_role() = 'owner')` with no column restriction. Every
-- current route that writes `tenants` under an Owner's own JWT
-- (tenant/account-type, tenant/social-links, tenant/subdomain,
-- tenant/domain) only ever sends a narrow, hand-built field set that
-- never includes `status`/`plan_id`/`payment_status` — so there is no
-- working exploit today. But RLS is meant to be a real boundary
-- independent of route code (same reasoning as migrations 0019 and
-- 0041): a single future route that spreads request input into
-- `.update()` on `tenants` under the Owner's own client would otherwise
-- let that Owner activate a suspended account, change their own plan
-- without paying, or forge a payment status — exactly the levers
-- `console/accounts/[id]/route.ts` and the StreamPay webhook exist to
-- gate.
--
-- Unlike migration 0041 (which exempts owner/admin from the users
-- trigger, since owner/admin legitimately manage OTHER users' role/status
-- there), the risky actor here is the Owner themselves acting on their
-- OWN tenant row, so the guard can't exempt owner — instead it targets
-- exactly the actor `tenants_owner_update` governs (`auth_user_role() =
-- 'owner'`), leaving two other real writers of these columns
-- unaffected: `console/accounts/[id]/route.ts` (platform admin's own
-- JWT — `auth_user_role()` returns null for a platform admin, since
-- platform_admins is a separate table from `users`) and
-- `billing/webhook/streampay/route.ts` (service role — bypasses RLS
-- entirely, and `auth_user_role()` also returns null with no user JWT).
-- =============================================================================

create function prevent_tenants_owner_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth_user_role() = 'owner' then
    if new.status is distinct from old.status
      or new.plan_id is distinct from old.plan_id
      or new.payment_status is distinct from old.payment_status
    then
      raise exception 'not allowed to change this field on your own account';
    end if;
  end if;
  return new;
end;
$$;

create trigger tenants_prevent_owner_privilege_escalation
  before update on tenants
  for each row
  execute function prevent_tenants_owner_privilege_escalation();
