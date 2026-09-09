import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | undefined;

/**
 * `console`'s own Supabase session, obtained directly with the public
 * anon key (PRODUCT_SPEC.md section 7) — used to adopt the session `api`
 * mints after a successful email+password login (task 37/42), same
 * pattern as `dashboard`'s equivalent client.
 *
 * `NEXT_PUBLIC_*` vars must be referenced as static `process.env.X`
 * property accesses, never through a helper with a dynamic key — Next.js
 * inlines them into the client bundle by literal text substitution at
 * build time (task 24/42 found this the hard way in `dashboard`).
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
