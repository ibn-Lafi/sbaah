import { annualSavingsMonths, type Plan } from '@sbaah/shared';
import { useLocale } from '@/lib/i18n/locale-context';

function CheckIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 6 9 17l-5-5" /></svg>;
}

function MetallicBackdrop({ tone }: { tone: 'platinum' | 'gold' }) {
  const background = tone === 'platinum'
    ? 'radial-gradient(circle at 15% 8%,rgba(255,255,255,.92),transparent 27%),radial-gradient(circle at 88% 12%,rgba(220,224,232,.42),transparent 26%),radial-gradient(circle at 48% 62%,rgba(120,125,135,.72),transparent 38%),linear-gradient(135deg,#8b8f96 0%,#202228 43%,#06070a 70%,#777b83 100%)'
    : 'radial-gradient(circle at 18% 10%,rgba(255,229,155,.72),transparent 27%),radial-gradient(circle at 86% 18%,rgba(211,145,36,.65),transparent 29%),radial-gradient(circle at 38% 70%,rgba(120,64,7,.8),transparent 37%),linear-gradient(135deg,#9a5c12 0%,#2b1705 48%,#110b04 72%,#a86b17 100%)';
  return <div className="absolute inset-0 overflow-hidden" style={{background}} aria-hidden="true"><span className="absolute -left-[18%] -top-[12%] h-[52%] w-[72%] rounded-[50%] border border-white/20 bg-black/5"/><span className="absolute -right-[25%] -top-[8%] h-[55%] w-[70%] rounded-[50%] border border-white/20 bg-black/15"/><span className="absolute -bottom-[22%] left-[2%] h-[58%] w-[72%] rounded-[50%] border border-white/10 bg-black/10"/><div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/20 to-black/70"/></div>;
}

interface PlanCardProps {
  plan: Plan;
  monthlyEquivalent?: Plan;
  isCurrent: boolean;
  selected?: boolean;
  onSelect: () => void;
  selecting: boolean;
  selectDisabled: boolean;
  showIntroPricing?: boolean;
  currentUsage?: { properties: number; users: number };
  actionLabel?: string;
}

export function PlanCard({ plan, monthlyEquivalent, isCurrent, selected=false, onSelect, selecting, selectDisabled, showIntroPricing=false, currentUsage, actionLabel }: PlanCardProps) {
  const { locale, pages } = useLocale();
  const t=pages.billing.planCard;
  const cycleLabel=t.cycleLabel(plan.billing_cycle);
  const savingsMonths=plan.billing_cycle==='annual'&&monthlyEquivalent?annualSavingsMonths(monthlyEquivalent,plan):0;
  const hasIntroPrice=showIntroPricing&&plan.intro_price!=null&&plan.intro_months!=null;
  const normalizedName=(plan.name_en||plan.name_ar).toLowerCase();
  const tone: 'platinum'|'gold'=normalizedName.includes('plat')||normalizedName.includes('بلات')?'platinum':'gold';

  return <article className={`relative min-h-[390px] w-full overflow-hidden rounded-[26px] sm:min-h-[430px] sm:rounded-[30px] border text-white transition-all ${isCurrent||selected?'border-white/70 ring-2 ring-brand ring-offset-2 ring-offset-surface-page':'border-white/15'}`}>
    <MetallicBackdrop tone={tone}/>
    <div className="relative z-10 flex min-h-[390px] flex-col p-5 sm:min-h-[430px] sm:p-8">
      <div className="flex min-h-[28px] items-start justify-between gap-4">
        <div><div className="flex items-center gap-2"><h3 className="text-lg font-bold sm:text-xl">{locale==='en'?plan.name_en:plan.name_ar}</h3><svg viewBox="0 0 24 24" className="h-5 w-5 text-white/65" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 16l5-5 4 4 7-8"/><path d="M15 7h5v5"/></svg></div>{savingsMonths>0&&<span className="mt-2 inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/75 backdrop-blur">{t.savingsLabel(savingsMonths)}</span>}{isCurrent&&<span className="mt-2 inline-flex rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white">{t.currentPlanBadge}</span>}</div>
        <div className="text-end">{hasIntroPrice?<><div className="text-sm text-white/55 line-through" dir="ltr">{plan.price.toLocaleString('en-US')}</div><div className="text-3xl font-bold tracking-tight sm:text-4xl" dir="ltr">{plan.intro_price!.toLocaleString('en-US')}</div><div className="mt-1 text-xs text-white/65">{t.currency} {t.introPriceNote(cycleLabel,t.introMonthsLabel(plan.intro_months!),plan.price.toLocaleString('en-US'))}</div></>:<><div className="text-4xl font-bold tracking-tight" dir="ltr">{plan.price.toLocaleString('en-US')}</div><div className="mt-1 text-xs text-white/65">{t.currency} {t.regularPriceNote(cycleLabel)}</div></>}</div>
      </div>
      <div className="my-5 h-px bg-white/65 sm:my-7"/>
      <ul className="flex flex-1 flex-col gap-3 text-[13px] text-white/90 sm:gap-4 sm:text-sm">
        {currentUsage ? <>
          <li className="flex items-center justify-between gap-3"><span>{pages.billing.currentPlan.propertiesUsage}</span><strong>{plan.max_properties!=null?`${currentUsage.properties} / ${plan.max_properties}`:pages.billing.unlimited}</strong></li>
          <li className="flex items-center justify-between gap-3"><span>{pages.billing.currentPlan.usersUsage}</span><strong dir="ltr">{plan.max_users!=null?`${currentUsage.users} / ${plan.max_users}`:pages.billing.unlimited}</strong></li>
        </> : <>
          <li className="flex items-center justify-between gap-3"><span className="flex items-center gap-2"><CheckIcon className="h-4 w-4"/>{t.propertiesLimitLabel}</span><strong>{plan.max_properties!=null?t.propertiesCount(plan.max_properties.toLocaleString('en-US')):pages.billing.unlimited}</strong></li>
          <li className="flex items-center justify-between gap-3"><span className="flex items-center gap-2"><CheckIcon className="h-4 w-4"/>{t.usersLimitLabel}</span><strong>{plan.max_users!=null?t.usersLabel(plan.max_users):pages.billing.unlimited}</strong></li>
          <li className="flex items-center justify-between gap-3"><span className="flex items-center gap-2"><CheckIcon className="h-4 w-4"/>{t.customDomainLabel}</span><strong>{plan.custom_domain_allowed?t.allowedLabel:t.subdomainLabel}</strong></li>
        </>}
      </ul>
      <p className="mt-5 text-[11px] text-white/55">{t.vatNote}</p>
      <button type="button" disabled={isCurrent||selectDisabled} onClick={onSelect} className="mt-4 flex h-11 w-full sm:mt-5 sm:h-12 items-center justify-center rounded-2xl border border-white/35 bg-white/10 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-60">
        {selecting?t.selectButton:actionLabel??(isCurrent?t.currentPlanBadge:t.selectButton)}
      </button>
    </div>
  </article>;
}
