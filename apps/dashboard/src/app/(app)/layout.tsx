'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMe, type MeResponse } from '@/lib/api/auth';
import { getAccessToken } from '@/lib/auth/session';
import { CurrentUserProvider } from '@/lib/auth/current-user-context';
import { DashboardShellSkeleton } from '@/components/layout/dashboard-shell-skeleton';

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
  const [state, setState] = useState<{ me: MeResponse; accessToken: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        router.replace('/login');
        return;
      }
      try {
        const me = await getMe(accessToken);
        if (!cancelled) setState({ me, accessToken });
      } catch {
        router.replace('/login');
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!state) {
    return <DashboardShellSkeleton />;
  }

  return <CurrentUserProvider value={state}>{children}</CurrentUserProvider>;
}
