-- 0113: Keep the trial end date and custom-domain verification state out of
-- reach of tenant members' own JWTs.
--
-- `tenants_owner_update` (0005) lets an Owner update any column of their
-- tenant row through PostgREST; 0043 only protected status/plan_id/
-- payment_status. is_tenant_active() also reads `trial_ends_at`, so a trial
-- Owner could clear it and keep the trial plan forever, and could mark an
-- unverified (or plan-excluded) custom domain as 'verified' without the
-- Cloudflare check in POST /v1/tenant/domain/verify.
--
-- The API now writes these columns with the service role after its own
-- owner/plan/Cloudflare checks, and platform admins (console) and the billing
-- webhook have no `users` row, so none of them is affected by this guard.
-- Safe to re-run; no data changes.

create or replace function prevent_tenants_owner_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth_user_role() is not null and (
    new.status is distinct from old.status
    or new.plan_id is distinct from old.plan_id
    or new.payment_status is distinct from old.payment_status
    or new.trial_ends_at is distinct from old.trial_ends_at
    or new.custom_domain is distinct from old.custom_domain
    or new.custom_domain_status is distinct from old.custom_domain_status
    or new.custom_domain_dns_records is distinct from old.custom_domain_dns_records
    or new.custom_domain_cloudflare_id is distinct from old.custom_domain_cloudflare_id
    or new.custom_domain_railway_id is distinct from old.custom_domain_railway_id
  ) then
    raise exception 'not allowed to change this field on your own account'
      using errcode = '42501';
  end if;
  return new;
end;
$$;
