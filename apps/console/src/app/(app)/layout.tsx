'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMe, type MeResponse } from '@/lib/api/console-auth';
import { getAccessToken, signOut } from '@/lib/auth/session';
import { CurrentAdminProvider } from '@/lib/auth/current-admin-context';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { ConsoleShellSkeleton } from '@/components/layout/console-shell-skeleton';
import { ApiRequestError } from '@/lib/api/client';
import { Button } from '@/components/ui/button';

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
        const me = await getMe(accessToken);
        if (!cancelled) setState({ me, accessToken });
      } catch (error) {
        if (error instanceof ApiRequestError && (error.status === 401 || error.status === 403)) {
          await signOut().catch(() => undefined);
          router.replace('/login');
          return;
        }
        if (!cancelled) setLoadError(error instanceof Error ? error.message : 'تعذّر تحميل لوحة الإدارة. حاول مرة أخرى.');
      }
    }

    void load();

    const {
      data: { subscription },
    } = getSupabaseBrowserClient().auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setState(null);
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

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm text-red-600">{loadError}</p>
        <Button onClick={() => setRetryKey((value) => value + 1)}>إعادة المحاولة</Button>
      </div>
    );
  }

  if (!state) {
    return <ConsoleShellSkeleton />;
  }

  return (
    <CurrentAdminProvider value={{ admin: state.me.admin, accessToken: state.accessToken }}>
      {children}
    </CurrentAdminProvider>
  );
}
