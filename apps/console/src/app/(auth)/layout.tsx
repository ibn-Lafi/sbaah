'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '@/lib/auth/session';
import { getMe } from '@/lib/api/console-auth';

/** Route group for unauthenticated screens. Existing sessions are sent back to the console app. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    void getAccessToken().then(async (token) => {
      if (!token || cancelled) return;
      try {
        await getMe(token);
        if (!cancelled) router.replace('/');
      } catch {
        // A valid Supabase session is not necessarily a platform-admin session.
        // Keep the login screen available so a dashboard user can sign in as admin.
      }
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return <>{children}</>;
}
