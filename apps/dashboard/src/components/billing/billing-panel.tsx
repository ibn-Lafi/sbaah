'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlanCard } from './plan-card';
import { BillingSkeleton } from './billing-skeleton';
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

/** الفوترة والاشتراك — نُقلت من مسار /billing المستقل إلى محتوى قابل لإعادة الاستخدام يُعرض أيضًا داخل تبويب "الفوترة والاشتراك" بصفحة الإعدادات الموحّدة (/billing يبقى يعمل، يعرض نفس المكوّن). يستخدم useSearchParams (نتيجة StreamPay checkout) — يتطلب Suspense من المستدعي دائمًا. */
export function BillingPanel() {
  const { accessToken } = useCurrentUser();
  const { pages } = useLocale();
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
    <div className="mx-auto flex max-w-[560px] flex-col gap-5">
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

          <div className="flex flex-col gap-4">
            <PlanCard
              plan={billing.plan}
              isCurrent={false}
              selecting={false}
              selectDisabled={false}
              currentUsage={billing.usage}
              actionLabel={t.currentPlan.changePlanButton}
              onSelect={() => { window.location.href = '/billing/plans'; }}
            />

            <div className="hidden rounded-[24px] border border-border-subtle bg-surface-card p-5">
              <div className="flex flex-col gap-4">
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
                {billing.payment_status === 'paid' && (
                  <span className="rounded-full bg-success-surface px-3 py-1 text-xs font-semibold text-success">
                    {t.currentPlan.activeBadge}
                  </span>
                )}
              </div>
            </div>

          </div>

          {error && (
            <p role="alert" className="rounded-control bg-danger-surface px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}
