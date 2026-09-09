import { getSupabaseBrowserClient } from '@/lib/supabase/client';

/** Adopts the session `api` mints only after both login factors pass (password + TOTP, task 37/42) — the login/setup-totp/confirm-totp/verify-totp endpoints never return a session on their own. */
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
