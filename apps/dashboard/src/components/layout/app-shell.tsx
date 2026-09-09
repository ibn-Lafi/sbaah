'use client';

import type { AccountType } from '@sbaah/shared';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { getPlatformRootDomain } from '@/lib/env/platform-root-domain';

interface AppShellProps {
  title: string;
  orgName: string;
  accountType: AccountType;
  roleLabel: string;
  children: React.ReactNode;
}

const SUSPENDED_MESSAGE: Record<'suspended' | 'cancelled', string> = {
  suspended: 'حسابك معلَّق حاليًا — البيانات معروضة للقراءة فقط، ولا يمكن إجراء أي تعديل حتى تجديد اشتراكك.',
  cancelled: 'تم إلغاء هذا الحساب — البيانات معروضة للقراءة فقط.',
};

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
  const status = me.tenant.status;
  // Always the subdomain URL, never the (possibly unverified/not-yet-
  // DNS-configured) custom domain — this link must always actually load.
  const siteUrl = `https://${me.tenant.subdomain}.${getPlatformRootDomain()}`;

  return (
    <div className="flex min-h-screen">
      <Sidebar orgName={orgName} accountType={accountType} roleLabel={roleLabel} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} siteUrl={siteUrl} />
        {status !== 'active' && (
          <div className="border-b border-amber-200 bg-amber-50 px-7 py-3 text-sm font-medium text-amber-800">
            {SUSPENDED_MESSAGE[status]}
          </div>
        )}
        <div className="flex-1 overflow-auto p-7">{children}</div>
      </div>
    </div>
  );
}
