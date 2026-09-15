'use client';

import Link from 'next/link';
import type { AccountType } from '@sbaah/shared';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { MobileNav } from './mobile-nav';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { getPlatformRootDomain } from '@/lib/env/platform-root-domain';

interface AppShellProps {
  title: string;
  orgName: string;
  accountType: AccountType;
  roleLabel: string;
  children: React.ReactNode;
}

/** Whole days left until `iso` — 0 on its final calendar day, never negative (callers check expiry separately). */
function daysRemaining(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

/**
 * The authenticated dashboard chrome — every route under `(app)` renders
 * inside this. Reads `tenant.status` from context itself (task 38/42)
 * instead of a new prop threaded through all 21 pages that render
 * `<AppShell>` — PRODUCT_SPEC section 2's "read-only" requirement for a
 * suspended/cancelled account is a banner only; the actual write block is
 * enforced server-side (RLS, migration 0019), this just tells the user why
 * their next edit will fail before they attempt it.
 */
export function AppShell({ title, orgName, accountType, roleLabel, children }: AppShellProps) {
  const { me } = useCurrentUser();
  const { t } = useLocale();
  const status = me.tenant.status;
  // Always the subdomain URL, never the (possibly unverified/not-yet-
  // DNS-configured) custom domain — this link must always actually load.
  const siteUrl = `https://${me.tenant.subdomain}.${getPlatformRootDomain()}`;

  // trial_ends_at is only ever set for a trial-plan signup (migration
  // 0047) — an independent signal from `status`, so it needs its own
  // banner even while status is still 'active'. Past it, RLS (updated
  // is_tenant_active) already blocks every write server-side, same as
  // suspended; this banner just explains why before the user tries.
  const trialEndsAt = me.tenant.trial_ends_at;
  const trialExpired = trialEndsAt !== null && new Date(trialEndsAt) <= new Date();

  return (
    // `h-dvh` + `overflow-hidden` (not `min-h-screen`) is load-bearing, not
    // cosmetic: without a hard height cap the root can grow taller than the
    // viewport to fit long content, and the browser scrolls the *document*
    // instead — dragging Topbar along with it. Capping the root + min-h-0 on
    // every flex-col ancestor down to the actual `overflow-auto` div is what
    // keeps Topbar genuinely fixed in place while only page content scrolls.
    // `dvh` (not `vh`) so mobile Safari's collapsing address bar doesn't
    // leave a gap or clip content at the bottom.
    <div className="flex h-dvh overflow-hidden">
      <Sidebar orgName={orgName} accountType={accountType} roleLabel={roleLabel} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Topbar title={title} siteUrl={siteUrl} accountType={accountType} />
        {/* Mobile: the page content is a rounded-top sheet that overlaps UP into the purple header by -mt-5 (founder's Zid reference, red-circled) — the header stays a plain square rectangle behind it; the curve itself, and the small light notches it cuts into the header's own bottom corners, come entirely from this card's corner radius sitting on top. Desktop is untouched (no radius, no overlap, transparent). */}
        <div className="bg-surface-page relative z-10 -mt-5 flex min-h-0 flex-1 flex-col rounded-t-[28px] md:mt-0 md:rounded-none md:bg-transparent">
          {status !== 'active' && (
            <div className="bg-warning-surface text-warning px-4 py-3 text-sm font-medium md:px-7">
              {status === 'suspended' ? t.appShell.suspended : t.appShell.cancelled}
            </div>
          )}
          {status === 'active' && trialExpired && (
            <div className="bg-warning-surface text-warning flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm font-medium md:px-7">
              <span>{t.appShell.trialExpired}</span>
              <Link href="/billing" className="font-semibold whitespace-nowrap underline">
                {t.appShell.subscribeNow}
              </Link>
            </div>
          )}
          {status === 'active' && !trialExpired && trialEndsAt && (
            <div className="bg-brand-surface text-brand flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm font-medium md:px-7">
              <span>{t.appShell.trialDaysRemaining(daysRemaining(trialEndsAt))}</span>
              <Link href="/billing" className="font-semibold whitespace-nowrap underline">
                {t.appShell.subscribeNow}
              </Link>
            </div>
          )}
          <div className="flex-1 overflow-auto overscroll-contain p-4 pb-28 md:p-7">{children}</div>
        </div>
      </div>
      <MobileNav orgName={orgName} accountType={accountType} roleLabel={roleLabel} />
    </div>
  );
}
