-- =============================================================================
-- Migration 0010: create_tenant_with_owner() — atomic registration write
-- docs/OTP_FLOW.md section 5a (task 14/42). Run after 0009.
--
-- Registration needs the Supabase Auth user created first (a separate
-- GoTrue API call, not a plain SQL insert — no way to wrap it in the same
-- Postgres transaction as the rows below). This function makes the part
-- that CAN be transactional actually atomic: if the `users` insert fails
-- for any reason after `tenants` succeeded (e.g. a constraint violation),
-- the whole call rolls back — no orphaned tenant row with no owner.
--
-- Callable only via the service role (never granted to anon/authenticated
-- — registration is one of the pre-auth paths documented in
-- docs/OTP_FLOW.md, same reasoning as otp_verifications in migration 0007).
-- =============================================================================

create function create_tenant_with_owner(
  p_name_ar text,
  p_name_en text,
  p_account_type account_type,
  p_fal_license_number text,
  p_cr_number text,
  p_tax_number text,
  p_subdomain text,
  p_plan_id uuid,
  p_auth_user_id uuid,
  p_owner_full_name text,
  p_owner_phone text
)
returns table (tenant_id uuid, user_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_user_id uuid;
begin
  insert into tenants (name_ar, name_en, account_type, fal_license_number, cr_number, tax_number, subdomain, plan_id)
  values (p_name_ar, p_name_en, p_account_type, p_fal_license_number, p_cr_number, p_tax_number, p_subdomain, p_plan_id)
  returning id into v_tenant_id;

  insert into users (tenant_id, auth_user_id, full_name, phone, role)
  values (v_tenant_id, p_auth_user_id, p_owner_full_name, p_owner_phone, 'owner')
  returning id into v_user_id;

  return query select v_tenant_id, v_user_id;
end;
$$;

revoke all on function create_tenant_with_owner from public;
