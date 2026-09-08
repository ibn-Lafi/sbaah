import { getSupabaseBrowserClient } from '@/lib/supabase/client';

/** Adopts the session `api` minted after a successful OTP register/login (docs/OTP_FLOW.md section 4) — the same call supabase-js uses internally, so refresh/persistence work exactly like a normal Supabase session from here on. */
export async function adoptSession(accessToken: string, refreshToken: string): Promise<void> {
  const { error } = await getSupabaseBrowserClient().auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error) {
    throw new Error(`Failed to adopt session: ${error.message}`);
  }
}

/** null when there's no active session — callers redirect to /login in that case. */
export async function getAccessToken(): Promise<string | null> {
  const {
    data: { session },
  } = await getSupabaseBrowserClient().auth.getSession();
  return session?.access_token ?? null;
}

export async function signOut(): Promise<void> {
  await getSupabaseBrowserClient().auth.signOut();
}
