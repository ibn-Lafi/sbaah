'use client';

import { useState } from 'react';
import { annualSavingsMonths, groupPlansByTier, planForCycle, type BillingCycle, type Plan } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import { MARKETING_CONTENT } from '@/lib/marketing/content';
import { CheckIcon } from './icons';

function CycleToggle({ value, onChange, labels, savingsPercent }: { value: BillingCycle; onChange: (cycle: BillingCycle) => void; labels: { annual: string; monthly: string }; savingsPercent?:number }) {
  const options: { value: BillingCycle; label: string }[] = [{ value: 'monthly', label: labels.monthly }, { value: 'annual', label: labels.annual }];
  return <div className="mx-auto flex w-[280px] gap-1 rounded-full bg-brand/[.08] p-1 ring-1 ring-brand/15">{options.map(option=><button key={option.value} type="button" onClick={()=>onChange(option.value)} aria-pressed={value===option.value} className={`h-10 flex-1 rounded-full text-[13px] font-semibold transition-all ${value===option.value?'bg-brand text-white shadow-sm':'text-text-secondary hover:bg-surface-subtle hover:text-brand'}`}>{option.label}{option.value==='annual'&&savingsPercent?` · ${labels.annual==='سنوي'?'وفّر':'Save'} ${savingsPercent}%`:''}</button>)}</div>;
}

function MetallicBackdrop({ tone }: { tone: 'platinum' | 'gold' | 'lavender' }) {
  if(tone==='lavender') return <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(20,10,30,.08),rgba(18,8,25,.78)),url('https://images.unsplash.com/photo-1499002238440-d264edd596ec?auto=format&fit=crop&w=1200&q=85')] bg-cover bg-center" aria-hidden="true"/>;
  const background = tone === 'platinum'
    ? 'radial-gradient(circle at 15% 8%,rgba(255,255,255,.92),transparent 27%),radial-gradient(circle at 88% 12%,rgba(220,224,232,.42),transparent 26%),radial-gradient(circle at 48% 62%,rgba(120,125,135,.72),transparent 38%),linear-gradient(135deg,#8b8f96 0%,#202228 43%,#06070a 70%,#777b83 100%)'
    : 'radial-gradient(circle at 18% 10%,rgba(255,229,155,.72),transparent 27%),radial-gradient(circle at 86% 18%,rgba(211,145,36,.65),transparent 29%),radial-gradient(circle at 38% 70%,rgba(120,64,7,.8),transparent 37%),linear-gradient(135deg,#9a5c12 0%,#2b1705 48%,#110b04 72%,#a86b17 100%)';
  return <div className="absolute inset-0 overflow-hidden" style={{background}} aria-hidden="true"><span className="absolute -left-[18%] -top-[12%] h-[52%] w-[72%] rounded-[50%] border border-white/20 bg-black/5"/><span className="absolute -right-[25%] -top-[8%] h-[55%] w-[70%] rounded-[50%] border border-white/20 bg-black/15"/><span className="absolute -bottom-[22%] left-[2%] h-[58%] w-[72%] rounded-[50%] border border-white/10 bg-black/10"/><div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/20 to-black/70"/></div>;
}

export function PricingCards({ plans, locale, dashboardUrl }: { plans: Plan[]; locale: Locale; dashboardUrl: string | undefined }) {
  const t=MARKETING_CONTENT[locale].pricing;
  const [cycle,setCycle]=useState<BillingCycle>('annual');
  const allTiers=groupPlansByTier(plans);
  const goldTier=allTiers.find(tier=>tier.key.toLowerCase()==='gold');
  const goldSavingsPercent=goldTier?.monthly&&goldTier.annual&&goldTier.monthly.price>0?Math.round((1-goldTier.annual.price/(goldTier.monthly.price*12))*100):undefined;
  const tiers=allTiers.filter(tier=>cycle==='annual'?Boolean(tier.annual):Boolean(tier.monthly));

  return <div className="mt-8 flex flex-col items-center gap-8 bg-surface-card">
    <CycleToggle value={cycle} onChange={setCycle} labels={t.cycleToggle} savingsPercent={goldSavingsPercent}/>
    <div className="pricing-scrollbar-hidden flex w-[calc(100%+3rem)] snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 sm:w-full sm:max-w-none sm:justify-start sm:px-6 lg:justify-center lg:gap-6">
      {tiers.map((tier,index)=>{
        const plan=(cycle==='annual'?tier.annual:tier.monthly)!;
        const savingsMonths=cycle==='annual'&&tier.monthly&&tier.annual?annualSavingsMonths(tier.monthly,tier.annual):0;
        const normalized=(plan.name_en||plan.name_ar).toLowerCase();
        const tone:'platinum'|'gold'|'lavender'=normalized.includes('lavender')||normalized.includes('خزام')?'lavender':normalized.includes('plat')||normalized.includes('بلات')?'platinum':'gold';
        return <article key={tier.key} className="relative min-h-[430px] w-[86vw] max-w-[390px] flex-none snap-center overflow-hidden rounded-[30px] border border-white/15 text-white sm:w-[360px]">
          <MetallicBackdrop tone={tone}/>
          <div className="relative z-10 flex min-h-[430px] flex-col p-7 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div><div className="flex items-center gap-2"><h3 className="text-xl font-bold">{locale==='ar'?plan.name_ar:plan.name_en}</h3><svg viewBox="0 0 24 24" className="h-5 w-5 text-white/65" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 16l5-5 4 4 7-8"/><path d="M15 7h5v5"/></svg></div>{savingsMonths>0&&<span className="mt-2 inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/75 backdrop-blur">{t.savingsLabel(savingsMonths)}</span>}</div>
              <div className="text-end">{plan.purchase_mode==='free'?<><div className="font-display text-3xl font-bold">{locale==='ar'?'مجانية':'Free'}</div><div className="mt-1 text-xs text-white/65">{locale==='ar'?'بدون رسوم':'No charge'}</div></>:plan.purchase_mode==='request'?<><div className="font-display text-2xl font-bold">{locale==='ar'?'حسب الطلب':'Custom'}</div><div className="mt-1 text-xs text-white/65">{locale==='ar'?'سنوي':'Annual'}</div></>:<><div className="font-display text-4xl font-bold tracking-tight" dir="ltr">{plan.price.toLocaleString('en-US')}</div><div className="mt-1 text-xs text-white/65">{t.currency} {t.priceNote(t.cycleLabel(plan.billing_cycle))}</div></>}</div>
            </div>
            <div className="my-7 h-px bg-white/65"/>
            <ul className="flex flex-1 flex-col gap-4 text-[14px] text-white/90">
              <li className="flex items-center justify-between gap-3"><span className="flex items-center gap-2"><CheckIcon className="h-4 w-4 flex-none text-white"/>{t.propertiesLimit}</span><strong dir={plan.max_properties!=null?'ltr':undefined}>{plan.max_properties!=null?plan.max_properties.toLocaleString('en-US'):t.unlimited}</strong></li>
              <li className="flex items-center justify-between gap-3"><span className="flex items-center gap-2"><CheckIcon className="h-4 w-4 flex-none text-white"/>{t.usersLimit}</span><strong dir={plan.max_users!=null?'ltr':undefined}>{plan.max_users!=null?plan.max_users.toLocaleString('en-US'):t.unlimited}</strong></li>
              <li className="flex items-center gap-2"><CheckIcon className="h-4 w-4 flex-none text-white"/>{plan.custom_domain_allowed?t.customDomainYes:t.customDomainNo}</li>
            </ul>
            {plan.purchase_mode==='checkout'&&<p className="mt-5 text-[11px] text-white/55">{t.vatNote}</p>}
            {dashboardUrl&&<a href={`${dashboardUrl}/register`} className="mt-5 flex h-12 items-center justify-center rounded-2xl border border-white/35 bg-white/10 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white hover:text-neutral-950">{plan.purchase_mode==='request'?(locale==='ar'?'اطلب الباقة':'Request plan'):t.cta}</a>}
          </div>
        </article>;
      })}
      <style>{`.pricing-scrollbar-hidden{-ms-overflow-style:none;scrollbar-width:none}.pricing-scrollbar-hidden::-webkit-scrollbar{display:none}`}</style>
    </div>
  </div>;
}
