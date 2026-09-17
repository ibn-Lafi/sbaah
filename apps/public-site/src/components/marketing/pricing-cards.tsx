'use client';

import { useState } from 'react';
import { annualSavingsMonths, groupPlansByTier, planForCycle, type BillingCycle, type Plan } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import { MARKETING_CONTENT } from '@/lib/marketing/content';
import { CheckIcon } from './icons';

function CycleToggle({ value, onChange, labels }: { value: BillingCycle; onChange: (cycle: BillingCycle) => void; labels: { annual: string; monthly: string } }) {
  const options: { value: BillingCycle; label: string }[] = [{ value: 'annual', label: labels.annual }, { value: 'monthly', label: labels.monthly }];
  return <div className="mx-auto flex w-[220px] gap-1 rounded-full border border-white/10 bg-white/[.06] p-1">{options.map(option=><button key={option.value} type="button" onClick={()=>onChange(option.value)} className={`h-10 flex-1 rounded-full text-[13px] font-semibold transition-all ${value===option.value?'bg-white text-neutral-950 shadow-sm':'text-white/60 hover:text-white'}`}>{option.label}</button>)}</div>;
}

function MetallicBackdrop({ tone }: { tone: 'platinum' | 'gold' }) {
  const background = tone === 'platinum'
    ? 'radial-gradient(circle at 15% 8%,rgba(255,255,255,.92),transparent 27%),radial-gradient(circle at 88% 12%,rgba(220,224,232,.42),transparent 26%),radial-gradient(circle at 48% 62%,rgba(120,125,135,.72),transparent 38%),linear-gradient(135deg,#8b8f96 0%,#202228 43%,#06070a 70%,#777b83 100%)'
    : 'radial-gradient(circle at 18% 10%,rgba(255,229,155,.72),transparent 27%),radial-gradient(circle at 86% 18%,rgba(211,145,36,.65),transparent 29%),radial-gradient(circle at 38% 70%,rgba(120,64,7,.8),transparent 37%),linear-gradient(135deg,#9a5c12 0%,#2b1705 48%,#110b04 72%,#a86b17 100%)';
  return <div className="absolute inset-0 overflow-hidden" style={{background}} aria-hidden="true"><span className="absolute -left-[18%] -top-[12%] h-[52%] w-[72%] rounded-[50%] border border-white/20 bg-black/5 shadow-[0_0_50px_rgba(255,255,255,.08)]"/><span className="absolute -right-[25%] -top-[8%] h-[55%] w-[70%] rounded-[50%] border border-white/20 bg-black/15"/><span className="absolute -bottom-[22%] left-[2%] h-[58%] w-[72%] rounded-[50%] border border-white/10 bg-black/10"/><div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/20 to-black/70"/></div>;
}

export function PricingCards({ plans, locale, dashboardUrl }: { plans: Plan[]; locale: Locale; dashboardUrl: string | undefined }) {
  const t=MARKETING_CONTENT[locale].pricing;
  const [cycle,setCycle]=useState<BillingCycle>('annual');
  const tiers=groupPlansByTier(plans).slice(0,2);
  const tones: Array<'platinum'|'gold'>=['platinum','gold'];

  return <div className="mt-8 flex flex-col items-center gap-8">
    <CycleToggle value={cycle} onChange={setCycle} labels={t.cycleToggle}/>
    <div className="flex w-full snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-5 sm:justify-center sm:overflow-visible sm:px-0 lg:gap-6">
      {tiers.map((tier,index)=>{
        const plan=planForCycle(tier,cycle);
        const savingsMonths=cycle==='annual'&&tier.monthly&&tier.annual?annualSavingsMonths(tier.monthly,tier.annual):0;
        const tone=tones[index] ?? 'gold';
        return <article key={tier.key} className="relative min-h-[430px] w-[86%] max-w-[390px] flex-none snap-center overflow-hidden rounded-[30px] border border-white/15 text-white shadow-[0_22px_60px_-28px_rgba(0,0,0,.75)] sm:w-[360px] sm:flex-none">
          <MetallicBackdrop tone={tone}/>
          <div className="relative z-10 flex min-h-[430px] flex-col p-7 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div><div className="flex items-center gap-2"><h3 className="text-xl font-bold">{locale==='ar'?plan.name_ar:plan.name_en}</h3><svg viewBox="0 0 24 24" className="h-5 w-5 text-white/65" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 16l5-5 4 4 7-8"/><path d="M15 7h5v5"/></svg></div>{savingsMonths>0&&<span className="mt-2 inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/75 backdrop-blur">{t.savingsLabel(savingsMonths)}</span>}</div>
              <div className="text-end"><div className="font-display text-4xl font-bold tracking-tight" dir="ltr">{plan.price.toLocaleString('en-US')}</div><div className="mt-1 text-xs text-white/65">{t.currency} {t.priceNote(t.cycleLabel(plan.billing_cycle))}</div></div>
            </div>
            <div className="my-7 h-px bg-white/65"/>
            <ul className="flex flex-1 flex-col gap-4 text-[14px] text-white/90">
              <li className="flex items-center justify-between gap-3"><span className="flex items-center gap-2"><CheckIcon className="h-4 w-4 flex-none text-white"/>{t.propertiesLimit}</span><strong dir={plan.max_properties!=null?'ltr':undefined}>{plan.max_properties!=null?plan.max_properties.toLocaleString('en-US'):t.unlimited}</strong></li>
              <li className="flex items-center justify-between gap-3"><span className="flex items-center gap-2"><CheckIcon className="h-4 w-4 flex-none text-white"/>{t.usersLimit}</span><strong dir={plan.max_users!=null?'ltr':undefined}>{plan.max_users!=null?plan.max_users.toLocaleString('en-US'):t.unlimited}</strong></li>
              <li className="flex items-center gap-2"><CheckIcon className="h-4 w-4 flex-none text-white"/>{plan.custom_domain_allowed?t.customDomainYes:t.customDomainNo}</li>
            </ul>
            <p className="mt-5 text-[11px] text-white/55">{t.vatNote}</p>
            {dashboardUrl&&<a href={`${dashboardUrl}/register`} className="mt-5 flex h-12 items-center justify-center rounded-2xl border border-white/35 bg-white/10 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white hover:text-neutral-950">{t.cta}</a>}
          </div>
        </article>;
      })}
    </div>
  </div>;
}
