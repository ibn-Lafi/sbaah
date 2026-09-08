import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | undefined;

/**
 * The dashboard's own Supabase session, obtained directly with the public
 * anon key (PRODUCT_SPEC.md section 7) — used for password login
 * (`signInWithPassword`) and to adopt the session `api` mints after a
 * successful OTP flow (`setSession`, docs/OTP_FLOW.md section 4). Default
 * persistence (localStorage + auto-refresh) is exactly the 30-day
 * same-device session PRODUCT_SPEC section 2 describes — Supabase's own
 * default behavior, not something built here (see OTP_FLOW.md section 7).
 *
 * `NEXT_PUBLIC_*` vars must be referenced as static `process.env.X`
 * property accesses, never through a helper with a dynamic key — Next.js
 * inlines them into the client bundle by literal text substitution at
 * build time, so `process.env[name]` (a runtime lookup) always resolves
 * to undefined in the browser, even with a correct .env file.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
    browserClient = createClient(url, anonKey);
  }
  return browserClient;
}
