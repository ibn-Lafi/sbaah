import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const NO_SESSION_PERSISTENCE = { auth: { persistSession: false, autoRefreshToken: false } } as const;

/**
 * Bypasses RLS entirely. Use ONLY for the narrow server-side paths that
 * must run before a user JWT exists (pre-auth OTP send/verify,
 * registration, password reset — see docs/OTP_FLOW.md) and for explicit
 * console-triggered cross-tenant operations (PRODUCT_SPEC.md section 7).
 * Never expose the underlying key to a browser.
 */
export function createServiceRoleClient(): SupabaseClient {
  return createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    NO_SESSION_PERSISTENCE,
  );
}

/**
 * Runs every query AS the calling user — Supabase's API gateway resolves
 * `accessToken` to that user's identity, and Postgres RLS enforces
 * tenant isolation from there (PRODUCT_SPEC.md section 10). This is the
 * ONLY client `api` should use for authenticated requests; never the
 * service role client above for anything a user could trigger directly.
 */
export function createUserScopedClient(accessToken: string): SupabaseClient {
  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_ANON_KEY'), {
    ...NO_SESSION_PERSISTENCE,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

/** Anonymous, read-only client — public-site's data via api's /v1/public/* endpoints (RLS still applies as `anon`). */
export function createAnonClient(): SupabaseClient {
  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_ANON_KEY'), NO_SESSION_PERSISTENCE);
}
