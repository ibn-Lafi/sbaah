'use client';

import { useEffect, useState } from 'react';
import { groupPlansByTier, planForCycle, type BillingCycle, type Plan, type PlanTier } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { BackButton } from '@/components/ui/back-button';
import { LoadingState } from '@/components/ui/loading-state';
import { PlanCycleToggle } from '@/components/billing/plan-cycle-toggle';
import { PlanCard } from '@/components/billing/plan-card';
import { PlanComparisonButton } from '@/components/billing/plan-comparison-modal';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { getBilling, startCheckout, type BillingInfo } from '@/lib/api/billing';
import { listPlans } from '@/lib/api/reference-data';
import { ApiRequestError } from '@/lib/api/client';

export default function ChangePlanPage() {
  const { me, accessToken } = useCurrentUser();
  const { pages } = useLocale();
  const t = pages.billing;
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
      setError(err instanceof ApiRequestError ? err.message : t.checkout.startFailed);
      setSelectingPlanId(null);
    }
  }

  const tiers: PlanTier[] | null = plans ? groupPlansByTier(plans) : null;

  return (
    <AppShell
      title={t.pageTitle}
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
    >
      <div className="mx-auto flex max-w-[820px] flex-col gap-6">
        <BackButton href="/billing" label={t.plans.backButton} className="self-start" />

        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary">{t.plans.heading}</h1>
          <p className="mt-1 text-sm text-text-secondary">{t.plans.subheading}</p>
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center"><PlanCycleToggle value={cycle} onChange={setCycle} /><PlanComparisonButton /></div>

        {billing === null || tiers === null ? (
          <LoadingState />
        ) : (
          <div className="-mx-3.5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3.5 py-1 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0">
            {tiers.map((tier) => {
              const plan = planForCycle(tier, cycle);
              return (
                <div key={tier.key} className="w-[calc(100vw-44px)] max-w-[360px] shrink-0 snap-center sm:w-auto sm:max-w-none">
                <PlanCard
                  plan={plan}
                  monthlyEquivalent={tier.monthly}
                  isCurrent={plan.id === billing.plan.id}
                  selecting={selectingPlanId === plan.id}
                  selectDisabled={selectingPlanId !== null}
                  onSelect={() => void handleSelect(plan)}
                />
                </div>
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
