import type { Plan } from '@sbaah/shared';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/lib/i18n/locale-context';

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/** Rounds to the nearest whole month saved by paying `annual.price` once instead of `monthly.price` × 12 — 0 when annual isn't actually cheaper. */
function annualSavingsMonths(monthly: Plan, annual: Plan): number {
  if (monthly.price <= 0) return 0;
  const saved = monthly.price * 12 - annual.price;
  if (saved <= 0) return 0;
  return Math.round(saved / monthly.price);
}

interface PlanCardProps {
  plan: Plan;
  /** Same tier's monthly-cycle row — only needed to compute the "وفّر شهرين" badge when `plan.billing_cycle === 'annual'`. */
  monthlyEquivalent?: Plan;
  /** The tenant's already-active paid plan (/billing/plans only) — shows the "باقتك الحالية" badge and disables the button. */
  isCurrent: boolean;
  /**
   * Purely visual highlight, independent of `isCurrent` — registration
   * uses this for its radio-style "which card is picked right now"
   * state, since there's no tenant/current-plan yet at that point. Does
   * not affect the button's label or disabled state.
   */
  selected?: boolean;
  onSelect: () => void;
  selecting: boolean;
  selectDisabled: boolean;
  /**
   * Show `plan.intro_price`/`intro_months` if present. Defaults to false
   * because intro pricing is only ever valid for a brand-new account
   * (checkout/route.ts gates it on `tenants.created_at`) — registration
   * (the account doesn't exist yet, so it's always within its own intro
   * window) explicitly opts in; /billing/plans (an existing tenant,
   * usually past the window) intentionally doesn't, to avoid advertising
   * a price the checkout endpoint would then correctly refuse to honor.
   */
  showIntroPricing?: boolean;
}

/** One pricing card — used by both /billing/plans and registration step 6, so the plan-selection experience looks identical everywhere it appears. */
export function PlanCard({
  plan,
  monthlyEquivalent,
  isCurrent,
  selected = false,
  onSelect,
  selecting,
  selectDisabled,
  showIntroPricing = false,
}: PlanCardProps) {
  const { locale, pages } = useLocale();
  const t = pages.billing.planCard;
  const cycleLabel = t.cycleLabel(plan.billing_cycle);
  const savingsMonths =
    plan.billing_cycle === 'annual' && monthlyEquivalent ? annualSavingsMonths(monthlyEquivalent, plan) : 0;
  const hasIntroPrice = showIntroPricing && plan.intro_price != null && plan.intro_months != null;

  return (
    <Card
      className={`flex flex-col gap-4 p-6 ${isCurrent || selected ? 'border-2 border-brand' : 'border border-border-default'}`}
    >
      <div className="flex min-h-[22px] items-center justify-between">
        {savingsMonths > 0 && (
          <span className="rounded-full bg-success-surface px-3 py-1 text-xs font-semibold text-success">
            {t.savingsLabel(savingsMonths)}
          </span>
        )}
        {isCurrent && (
          <span className="rounded-full bg-brand-surface px-3 py-1 text-xs font-semibold text-brand">
            {t.currentPlanBadge}
          </span>
        )}
      </div>

      <div>
        <h3 className="text-lg font-bold text-text-primary">{locale === 'en' ? plan.name_en : plan.name_ar}</h3>
        {plan.description_ar && <p className="mt-1 text-sm text-text-secondary">{plan.description_ar}</p>}
      </div>

      <div>
        {hasIntroPrice ? (
          <>
            <p className="flex items-baseline gap-1.5" dir="ltr">
              <span className="text-3xl font-bold text-text-primary">{plan.intro_price!.toLocaleString('en-US')}</span>
              <span className="text-sm text-text-secondary">{t.currency}</span>
            </p>
            <p className="text-xs text-text-secondary">
              {t.introPriceNote(cycleLabel, t.introMonthsLabel(plan.intro_months!), plan.price.toLocaleString('en-US'))}
            </p>
          </>
        ) : (
          <>
            <p className="flex items-baseline gap-1.5" dir="ltr">
              <span className="text-3xl font-bold text-text-primary">{plan.price.toLocaleString('en-US')}</span>
              <span className="text-sm text-text-secondary">{t.currency}</span>
            </p>
            <p className="text-xs text-text-secondary">{t.regularPriceNote(cycleLabel)}</p>
          </>
        )}
        <p className="mt-1 text-[11px] text-text-placeholder">{t.vatNote}</p>
      </div>

      <div className="h-px bg-border-subtle" />

      <ul className="flex flex-col gap-2.5 text-sm">
        <li className="flex items-center justify-between">
          <span className="text-text-secondary">{t.propertiesLimitLabel}</span>
          <span className="font-medium text-text-primary">
            {plan.max_properties != null
              ? t.propertiesCount(plan.max_properties.toLocaleString('en-US'))
              : pages.billing.unlimited}
          </span>
        </li>
        <li className="flex items-center justify-between">
          <span className="text-text-secondary">{t.usersLimitLabel}</span>
          <span className="font-medium text-text-primary">
            {plan.max_users != null ? t.usersLabel(plan.max_users) : pages.billing.unlimited}
          </span>
        </li>
        <li className="flex items-center justify-between">
          <span className="text-text-secondary">{t.customDomainLabel}</span>
          {plan.custom_domain_allowed ? (
            <span className="flex items-center gap-1 font-medium text-success">
              <CheckIcon className="h-4 w-4" />
              {t.allowedLabel}
            </span>
          ) : (
            <span className="font-medium text-text-primary">{t.subdomainLabel}</span>
          )}
        </li>
      </ul>

      <Button
        type="button"
        variant={isCurrent ? 'secondary' : 'primary'}
        disabled={isCurrent || selectDisabled}
        loading={selecting}
        onClick={onSelect}
        className="w-full"
      >
        {isCurrent ? t.currentPlanBadge : t.selectButton}
      </Button>
    </Card>
  );
}
