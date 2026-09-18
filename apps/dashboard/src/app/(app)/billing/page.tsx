'use client';

import { Suspense } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { BillingPanel } from '@/components/billing/billing-panel';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { useLocale } from '@/lib/i18n/locale-context';

export default function BillingPage() {
  const { me } = useCurrentUser();
  const { pages } = useLocale();

  return (
    <AppShell title={pages.billing.pageTitle} orgName={me.tenant.name_ar} accountType={me.tenant.account_type}>
      <Suspense fallback={null}>
        <BillingPanel />
      </Suspense>
    </AppShell>
  );
}
