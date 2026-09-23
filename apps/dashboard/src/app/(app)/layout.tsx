'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBusinessActivities, getMe, type BusinessActivitiesResponse, type MeResponse } from '@/lib/api/auth';
import { resolveBusinessCapabilities } from '@sbaah/shared';
import { getAccessToken } from '@/lib/auth/session';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { CurrentUserProvider } from '@/lib/auth/current-user-context';
import { DashboardShellSkeleton } from '@/components/layout/dashboard-shell-skeleton';
import { ApiRequestError } from '@/lib/api/client';
import { Button } from '@/components/ui/button';

/**
 * Guard for every authenticated screen (task 24/42 built this for the
 * root page alone; task 25/42 generalizes it to a layout so
 * properties/new, properties/[id], etc. don't each re-fetch GET
 * /v1/auth/me and re-implement the redirect themselves). No session ->
 * /login; a session that fails /auth/me (no tenant membership) -> /login
 * too, same as no session — that combination isn't reachable from any
 * current registration path.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<{ me: MeResponse; accessToken: string; business: BusinessActivitiesResponse } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadError(null);
      const accessToken = await getAccessToken();
      if (!accessToken) {
        router.replace('/login');
        return;
      }
      try {
        // /auth/me is the actual authentication/tenant guard. Business activity
        // configuration is product metadata and must never turn a valid login
        // into a redirect loop if that endpoint is temporarily unavailable.
        const me = await getMe(accessToken);
        const business = await getBusinessActivities(accessToken).catch(() => ({
          activities: [],
          configured: false,
        } satisfies BusinessActivitiesResponse));
        if (!cancelled) setState({ me, accessToken, business });
      } catch (error) {
        if (error instanceof ApiRequestError && (error.status === 401 || error.code === 'unauthenticated')) {
          await getSupabaseBrowserClient().auth.signOut();
          router.replace('/login');
          return;
        }
        if (error instanceof ApiRequestError && error.code === 'account_disabled') {
          await getSupabaseBrowserClient().auth.signOut();
          router.replace('/login?reason=account_disabled');
          return;
        }
        if (!cancelled) setLoadError(error instanceof Error ? error.message : 'تعذّر تحميل حسابك. حاول مرة أخرى.');
      }
    }

    void load();

    // supabase-js already refreshes the underlying JWT in the background
    // (autoRefreshToken, on by default) for as long as the tab stays
    // open — but `state.accessToken` above was only ever set once, at
    // mount, so any page left open past the token's lifetime (exactly
    // what happens during a long DNS-troubleshooting session, for
    // example) kept sending that stale token and got a real "session
    // invalid" 401 back despite the browser's actual session being fine.
    // Following this event keeps the token every page reads via
    // useCurrentUser() current without each of them re-fetching it.
    const {
      data: { subscription },
    } = getSupabaseBrowserClient().auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/login');
        return;
      }
      if (session) {
        setState((current) => (current ? { ...current, accessToken: session.access_token } : current));
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router, retryKey]);

  if (loadError && !state) {
    return <div className="flex min-h-screen items-center justify-center p-6"><div className="w-full max-w-md rounded-2xl border border-border-default bg-surface-card p-6 text-center"><h1 className="mb-2 text-lg font-semibold">تعذّر تحميل لوحة التحكم</h1><p className="mb-5 text-sm text-text-secondary">{loadError}</p><Button type="button" onClick={() => setRetryKey((value) => value + 1)}>إعادة المحاولة</Button></div></div>;
  }

  if (!state) return <DashboardShellSkeleton />;

  const capabilities = resolveBusinessCapabilities(state.business.activities);

  return <CurrentUserProvider value={{ ...state, capabilities }}>{children}</CurrentUserProvider>;
}
