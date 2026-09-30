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
import { getBilling, requestCustomPlan, startCheckout, type BillingInfo } from '@/lib/api/billing';
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
  const [requestPlan, setRequestPlan] = useState<Plan | null>(null);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    void getBilling(accessToken).then(setBilling);
  }, [accessToken]);
  useEffect(() => {
    void listPlans().then(setPlans);
  }, []);

  async function handleSelect(plan: Plan) {
    if (plan.purchase_mode === 'request') { setRequestPlan(plan); setRequestSent(false); return; }
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
  const goldTier=tiers?.find(t=>t.key.toLowerCase()==='gold');
  const goldSavingsPercent=goldTier?.monthly&&goldTier.annual&&goldTier.monthly.price>0?Math.round((1-goldTier.annual.price/(goldTier.monthly.price*12))*100):undefined;

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

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center"><PlanCycleToggle value={cycle} onChange={setCycle} savingsPercent={goldSavingsPercent} /><PlanComparisonButton /></div>

        {billing === null || tiers === null ? (
          <LoadingState />
        ) : (
          <div className="-mx-3.5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3.5 py-1 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex sm:overflow-x-auto sm:px-0 sm:pb-4 lg:justify-center">
            {tiers.map((tier) => {
              const plan = planForCycle(tier, cycle);
              return (
                <div key={tier.key} className="w-[calc(100vw-44px)] max-w-[360px] shrink-0 snap-center sm:w-[360px] sm:max-w-[360px]">
                <PlanCard
                  plan={plan}
                  monthlyEquivalent={tier.monthly}
                  isCurrent={plan.id === billing.plan.id}
                  selecting={selectingPlanId === plan.id}
                  selectDisabled={selectingPlanId !== null}
                  actionLabel={plan.purchase_mode === 'request' ? 'اطلب الباقة' : undefined}
                  onSelect={() => void handleSelect(plan)}
                />
                </div>
              );
            })}
          </div>
        )}

        {requestPlan && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4" onMouseDown={(e)=>{if(e.target===e.currentTarget)setRequestPlan(null)}}><div className="w-full max-w-md rounded-[24px] bg-surface-card p-5 shadow-2xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold text-text-primary">طلب باقة الخزامى</h2><button type="button" onClick={()=>setRequestPlan(null)} className="text-text-secondary">✕</button></div>{requestSent?<div className="py-8 text-center"><p className="font-semibold text-text-primary">تم إرسال طلبك بنجاح</p><p className="mt-2 text-sm text-text-secondary">سيتواصل معك فريق سبعة.</p></div>:<form className="space-y-3" onSubmit={async(e)=>{e.preventDefault();const fd=new FormData(e.currentTarget);setError(null);try{await requestCustomPlan(accessToken,{plan_id:requestPlan.id,full_name:String(fd.get('full_name')||''),email:String(fd.get('email')||''),phone:String(fd.get('phone')||''),details:String(fd.get('details')||'')});setRequestSent(true)}catch(err){setError(err instanceof ApiRequestError?err.message:'تعذر إرسال الطلب')}}}><input name="full_name" required placeholder="الاسم" className="h-11 w-full rounded-xl border border-border-subtle bg-surface-page px-3 text-sm"/><input name="email" type="email" required placeholder="البريد الإلكتروني" className="h-11 w-full rounded-xl border border-border-subtle bg-surface-page px-3 text-sm"/><input name="phone" required placeholder="رقم التواصل" className="h-11 w-full rounded-xl border border-border-subtle bg-surface-page px-3 text-sm"/><textarea name="details" rows={4} placeholder="تفاصيل احتياجك (اختياري)" className="w-full rounded-xl border border-border-subtle bg-surface-page p-3 text-sm"/><button className="h-11 w-full rounded-xl bg-brand font-semibold text-white">إرسال الطلب</button></form>}</div></div>}

        {error && (
          <p role="alert" className="rounded-control bg-danger-surface px-4 py-3 text-center text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </AppShell>
  );
}
