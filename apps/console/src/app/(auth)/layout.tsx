'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '@/lib/auth/session';

/** Route group for unauthenticated screens. Existing sessions are sent back to the console app. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    void getAccessToken().then((token) => {
      if (token && !cancelled) router.replace('/');
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return <>{children}</>;
}
