-- =============================================================================
-- Migration 0107: create_tenant_with_owner() is service-role only
-- Run after 0106.
--
-- Migrations 0010/0047 only ran `revoke all ... from public`. Supabase also
-- grants EXECUTE on new public-schema functions *directly* to anon and
-- authenticated through default privileges (the same issue migration 0087
-- fixed for the commercial RPCs), so this SECURITY DEFINER function stayed
-- callable through PostgREST with the public anon key: anyone could create a
-- tenant on any plan with no payment and no trial end, bind it to an auth
-- user that has no membership yet, and claim an arbitrary phone number so
-- its real owner can no longer register.
--
-- Only POST /v1/auth/register calls it, with the service role.
-- =============================================================================

revoke all on function create_tenant_with_owner(text, text, account_type, text, uuid, timestamptz, uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function create_tenant_with_owner(text, text, account_type, text, uuid, timestamptz, uuid, text, text, text)
  to service_role;
