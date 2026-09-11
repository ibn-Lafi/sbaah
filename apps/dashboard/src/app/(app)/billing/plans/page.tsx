'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { BillingCycle, Plan } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { LoadingState } from '@/components/ui/loading-state';
import { PlanCycleToggle } from '@/components/billing/plan-cycle-toggle';
import { PlanCard } from '@/components/billing/plan-card';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { getBilling, startCheckout, type BillingInfo } from '@/lib/api/billing';
import { listPlans } from '@/lib/api/reference-data';
import { groupPlansByTier, planForCycle, type PlanTier } from '@/lib/billing/plan-tiers';
import { ApiRequestError } from '@/lib/api/client';

export default function ChangePlanPage() {
  const { me, accessToken } = useCurrentUser();
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>('annual');
  const [selectingPlanId, setSelectingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getBilling(accessToken).then(setBilling);
  }, [accessToken]);
  useEffect(() => {
    void listPlans().then(setPlans);
  }, []);

  async function handleSelect(plan: Plan) {
    setError(null);
    setSelectingPlanId(plan.id);
    try {
      const { checkout_url } = await startCheckout(accessToken, plan.id);
      window.location.href = checkout_url;
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر بدء الدفع');
      setSelectingPlanId(null);
    }
  }

  const tiers: PlanTier[] | null = plans ? groupPlansByTier(plans) : null;

  return (
    <AppShell
      title="الفوترة والاشتراك"
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      <div className="mx-auto flex max-w-[820px] flex-col gap-6">
        <Link href="/billing" className="self-end text-sm font-medium text-text-secondary hover:text-text-primary">
          › رجوع للفوترة
        </Link>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary">اختر باقتك</h1>
          <p className="mt-1 text-sm text-text-secondary">يمكنك تغيير الباقة في أي وقت من صفحة الفوترة.</p>
        </div>

        <PlanCycleToggle value={cycle} onChange={setCycle} />

        {billing === null || tiers === null ? (
          <LoadingState />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {tiers.map((tier) => {
              const plan = planForCycle(tier, cycle);
              return (
                <PlanCard
                  key={tier.key}
                  plan={plan}
                  monthlyEquivalent={tier.monthly}
                  isCurrent={plan.id === billing.plan.id}
                  selecting={selectingPlanId === plan.id}
                  selectDisabled={selectingPlanId !== null}
                  onSelect={() => void handleSelect(plan)}
                />
              );
            })}
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-control bg-danger-surface px-4 py-3 text-center text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </AppShell>
  );
}
