'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthPanel } from '@/components/auth/auth-panel';
import { Card } from '@/components/ui/card';
import { LanguageToggle } from '@/components/layout/language-toggle';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { getAccessToken } from '@/lib/auth/session';

/**
 * Shared shell for /login, /register, /forgot-password — no sidebar/topbar
 * (AppShell is for authenticated screens only). The theme/language toggles
 * live inside the card itself now (founder's request), as a small icon row
 * above each page's own heading, instead of floating in a fixed page
 * corner — same order (theme, then language) as the topbar.
 *
 * `h-dvh overflow-hidden` (not `min-h-screen`) is load-bearing, not
 * cosmetic — same reasoning as AppShell: without a hard height cap the
 * page scrolls/rubber-bands as a whole on mobile even when the card's own
 * content would fit, and the toggle row could drift out of view mid-
 * gesture. The card itself becomes the one scrollable region
 * (`overflow-y-auto overscroll-contain`, capped at `max-h-full`) so a
 * genuinely tall step (e.g. register's plan-selection step) still scrolls
 * on its own without moving the surrounding viewport.
 */
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

  return (
    <div className="flex h-dvh overflow-hidden">
      <AuthPanel />
      <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-y-auto p-4 sm:p-6 lg:overflow-hidden">
        <Card className="my-auto flex max-h-full w-full max-w-[440px] flex-col overflow-y-auto overscroll-contain p-6 sm:p-8 lg:max-h-none lg:overflow-visible">
          <div className="mb-4 flex flex-none items-center justify-end gap-2">
            <ThemeToggle variant="surface" />
            <LanguageToggle variant="surface" iconOnly />
          </div>
          {children}
        </Card>
      </div>
    </div>
  );
}
