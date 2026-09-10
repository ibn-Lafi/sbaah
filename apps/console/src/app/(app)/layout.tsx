'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMe, type MeResponse } from '@/lib/api/console-auth';
import { getAccessToken } from '@/lib/auth/session';
import { CurrentAdminProvider } from '@/lib/auth/current-admin-context';
import { ConsoleShellSkeleton } from '@/components/layout/console-shell-skeleton';

/**
 * Guard for every authenticated `console` screen — same pattern as
 * `dashboard`'s `(app)/layout.tsx` (task 25/42): fetch `/console-auth/me`
 * once, share it via context, redirect to `/login` on any failure. A
 * session that fails `/console-auth/me` (valid Supabase session, no
 * `platform_admins` row) is treated identically to no session at all —
 * that combination isn't reachable via this app's own login flow, but a
 * customer's stray dashboard session should never render anything here.
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
    return <ConsoleShellSkeleton />;
  }

  return (
    <CurrentAdminProvider value={{ admin: state.me.admin, accessToken: state.accessToken }}>
      {children}
    </CurrentAdminProvider>
  );
}
