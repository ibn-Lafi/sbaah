-- =============================================================================
-- Migration 0033: manual "إضافة" for الوسطاء والمسوقين from the dashboard
--
-- Migration 0032 deliberately shipped with no authenticated INSERT policy
-- on broker_marketer_applications — only the public form (via api's
-- service role) could create rows. The founder now wants an Owner/Admin
-- "+ إضافة" button on /applicants too, same as leads' manual-add flow
-- (POST /v1/leads, migration 0005's leads_owner_admin_manage). Adding the
-- matching INSERT policy here, plus the suspended-tenant write-lock
-- restrictive policy every other writable table got in migration 0019
-- (this table didn't exist yet at that point).
-- =============================================================================

create policy broker_marketer_applications_owner_admin_insert on broker_marketer_applications
  for insert to authenticated
  with check (tenant_id = auth_tenant_id() and auth_user_role() in ('owner', 'admin'));

create policy broker_marketer_applications_tenant_active_insert on broker_marketer_applications as restrictive
  for insert to authenticated
  with check (is_tenant_active(tenant_id));

comment on table broker_marketer_applications is
  'Written either by api''s service role from POST /v1/public/broker-applications (the public form, after re-validating tenant_id/property_id server-side), or directly by an Owner/Admin via POST /v1/broker-applications (manual add from the dashboard, migration 0033) — same dual-path shape as leads.';
