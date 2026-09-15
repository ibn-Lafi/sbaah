'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BillingSkeleton } from '@/components/billing/billing-skeleton';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { getBilling, startCheckout, type BillingInfo } from '@/lib/api/billing';
import { ApiRequestError } from '@/lib/api/client';

function UsageBar({ label, used, max, unlimitedLabel }: { label: string; used: number; max: number | null; unlimitedLabel: string }) {
  const pct = max !== null ? Math.min(100, Math.round((used / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-text-secondary">{label}</span>
        <span className="font-medium text-text-primary" dir={max !== null ? 'ltr' : undefined}>
          {max !== null ? `${used} / ${max}` : unlimitedLabel}
        </span>
      </div>
      {max !== null && (
        <div className="h-2 overflow-hidden rounded-full bg-surface-subtle">
          <div className={`h-full ${pct >= 100 ? 'bg-danger' : 'bg-brand'}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

/** `next_renewal_at` is already an ISO timestamp — slicing gives the same YYYY-MM-DD shape shown everywhere else in the dashboard, no locale/timezone formatting needed. */
function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

function BillingPageContent() {
  const { me, accessToken } = useCurrentUser();
  const { locale, pages } = useLocale();
  const t = pages.billing;
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [renewing, setRenewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getBilling(accessToken).then(setBilling);
  }, [accessToken]);

  const checkoutResult = searchParams.get('checkout');

  async function handleRenew() {
    setError(null);
    setRenewing(true);
    try {
      const { checkout_url } = await startCheckout(accessToken);
      window.location.href = checkout_url;
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.checkout.startFailed);
      setRenewing(false);
    }
  }

  return (
    <AppShell
      title={t.pageTitle}
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
    >
      <div className="flex max-w-[560px] flex-col gap-5">
        {checkoutResult === 'success' && (
          <div className="rounded-input bg-success-surface px-4 py-3 text-sm font-medium text-success">
            {t.checkout.success}
          </div>
        )}
        {checkoutResult === 'cancelled' && (
          <div className="rounded-input bg-warning-surface px-4 py-3 text-sm font-medium text-warning">
            {t.checkout.cancelled}
          </div>
        )}

        {billing === null ? (
          <BillingSkeleton />
        ) : (
          <>
            {billing.payment_status === 'failed' && (
              <div className="flex flex-col gap-3 rounded-input bg-danger-surface p-4">
                <p className="text-sm font-medium text-danger">{t.paymentFailed.message}</p>
                <Button type="button" variant="danger" loading={renewing} onClick={() => void handleRenew()} className="w-fit">
                  {t.paymentFailed.renewButton}
                </Button>
              </div>
            )}

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-text-secondary">{t.currentPlan.label}</p>
                  <h2 className="mt-1 text-xl font-bold text-text-primary">
                    {locale === 'en' ? billing.plan.name_en : billing.plan.name_ar}
                  </h2>
                </div>
                {billing.payment_status === 'paid' && (
                  <span className="rounded-full bg-success-surface px-3 py-1 text-xs font-semibold text-success">
                    {t.currentPlan.activeBadge}
                  </span>
                )}
              </div>

              <div className="mt-5 flex flex-col gap-4">
                <UsageBar
                  label={t.currentPlan.propertiesUsage}
                  used={billing.usage.properties}
                  max={billing.plan.max_properties}
                  unlimitedLabel={t.unlimited}
                />
                <UsageBar
                  label={t.currentPlan.usersUsage}
                  used={billing.usage.users}
                  max={billing.plan.max_users}
                  unlimitedLabel={t.unlimited}
                />
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <p className="text-xs text-text-secondary" dir="ltr">
                  {billing.next_renewal_at ? t.currentPlan.nextRenewal(formatDate(billing.next_renewal_at)) : ''}
                </p>
                <Link href="/billing/plans">
                  <Button type="button" className="w-fit">
                    {t.currentPlan.changePlanButton}
                  </Button>
                </Link>
              </div>
            </Card>

            {error && (
              <p role="alert" className="rounded-control bg-danger-surface px-4 py-3 text-sm text-danger">
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={null}>
      <BillingPageContent />
    </Suspense>
  );
}
