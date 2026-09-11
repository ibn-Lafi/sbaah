'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Plan } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BillingSkeleton } from '@/components/billing/billing-skeleton';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { getBilling, startCheckout, type BillingInfo } from '@/lib/api/billing';
import { listPlans } from '@/lib/api/reference-data';
import { ApiRequestError } from '@/lib/api/client';

function UsageBar({ label, used, max }: { label: string; used: number; max: number }) {
  const pct = Math.min(100, Math.round((used / max) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-text-secondary">{label}</span>
        <span className="font-medium text-text-primary" dir="ltr">
          {used} / {max}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-subtle">
        <div
          className={`h-full ${pct >= 100 ? 'bg-danger' : 'bg-brand'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function planPriceLabel(plan: Plan): string {
  const cycleLabel = plan.billing_cycle === 'annual' ? 'سنويًا' : 'شهريًا';
  return `${plan.price.toLocaleString('en-US')} ر.س/${cycleLabel}`;
}

function BillingPageContent() {
  const { me, accessToken } = useCurrentUser();
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [switchingPlanId, setSwitchingPlanId] = useState<string | null>(null);
  const [renewing, setRenewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    void getBilling(accessToken).then(setBilling);
  }

  useEffect(reload, [accessToken]);
  useEffect(() => {
    void listPlans().then(setPlans);
  }, []);

  const checkoutResult = searchParams.get('checkout');

  async function handleCheckout(planId?: string) {
    setError(null);
    if (planId) setSwitchingPlanId(planId);
    else setRenewing(true);
    try {
      const { checkout_url } = await startCheckout(accessToken, planId);
      window.location.href = checkout_url;
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر بدء الدفع');
      setSwitchingPlanId(null);
      setRenewing(false);
    }
  }

  const otherPlans = plans?.filter((p) => p.id !== billing?.plan.id) ?? [];

  return (
    <AppShell
      title="الفوترة والاشتراك"
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      <div className="flex max-w-[560px] flex-col gap-5">
        {checkoutResult === 'success' && (
          <div className="rounded-input bg-success-surface px-4 py-3 text-sm font-medium text-success">
            جارٍ تأكيد الدفعة — قد يستغرق تحديث الباقة أدناه بضع ثوانٍ.
          </div>
        )}
        {checkoutResult === 'cancelled' && (
          <div className="rounded-input bg-warning-surface px-4 py-3 text-sm font-medium text-warning">
            أُلغيت عملية الدفع — لم يتم أي تغيير على باقتك.
          </div>
        )}

        {billing === null || plans === null ? (
          <BillingSkeleton />
        ) : (
          <>
            {billing.payment_status === 'failed' && (
              <div className="flex flex-col gap-3 rounded-input bg-danger-surface p-4">
                <p className="text-sm font-medium text-danger">فشلت آخر عملية دفع لاشتراكك — جدّد الدفع الآن لتجنّب تعليق حسابك.</p>
                <Button type="button" variant="danger" loading={renewing} onClick={() => void handleCheckout()} className="w-fit">
                  جدّد الدفع
                </Button>
              </div>
            )}

            <Card className="p-6">
              <h2 className="mb-1 text-base font-semibold text-text-primary">الباقة الحالية</h2>
              <p className="mb-4 text-2xl font-bold text-brand" dir="ltr">
                {planPriceLabel(billing.plan)}
              </p>
              <p className="text-sm text-text-secondary">{billing.plan.name_ar}</p>
            </Card>

            <Card className="flex flex-col gap-4 p-6">
              <h2 className="text-base font-semibold text-text-primary">الاستخدام الحالي</h2>
              <UsageBar label="العقارات" used={billing.usage.properties} max={billing.plan.max_properties} />
              <UsageBar label="أعضاء الفريق" used={billing.usage.users} max={billing.plan.max_users} />
            </Card>

            {otherPlans.length > 0 && (
              <Card className="flex flex-col gap-3 p-6">
                <h2 className="text-base font-semibold text-text-primary">غيّر باقتك</h2>
                {otherPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between gap-3 rounded-input border border-border-default p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{plan.name_ar}</p>
                      <p className="text-sm text-text-secondary" dir="ltr">
                        {planPriceLabel(plan)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      loading={switchingPlanId === plan.id}
                      disabled={switchingPlanId !== null || renewing}
                      onClick={() => void handleCheckout(plan.id)}
                    >
                      {plan.price > billing.plan.price ? 'الترقية' : 'التبديل'}
                    </Button>
                  </div>
                ))}
                <p className="text-xs text-text-secondary">
                  عند التبديل تُدفع باقتك الجديدة كاملة من تاريخ التبديل — بلا خصم للمدة المتبقية من باقتك الحالية.
                </p>
              </Card>
            )}

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
