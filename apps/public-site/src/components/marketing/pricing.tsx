import type { Plan } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import { apiGet } from '@/lib/api/client';
import { MARKETING_CONTENT } from '@/lib/marketing/content';
import { Reveal } from './reveal';
import { PricingCards } from './pricing-cards';

/** Real, admin-configurable plans (PRODUCT_SPEC section 2) — never hardcoded here, same endpoint dashboard's own upgrade UI reads. Each tier has one row per billing cycle (monthly/annual) — grouping + the cycle toggle live in PricingCards. */
async function getActivePlans(): Promise<Plan[]> {
  const { plans } = await apiGet<{ plans: Plan[] }>('/public/plans');
  return plans;
}

export async function Pricing({ locale }: { locale: Locale }) {
  const t = MARKETING_CONTENT[locale].pricing;
  const plans = await getActivePlans();
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL;
  if (plans.length === 0) return null;

  return (
    <section id="pricing" className="bg-surface-card px-6 py-16 sm:py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-2xl font-semibold text-text-primary sm:text-4xl">{t.title}</h2>
        <p className="mt-3 text-lg text-text-secondary">{t.subtitle}</p>
      </Reveal>

      <Reveal delayMs={150}>
        <PricingCards plans={plans} locale={locale} dashboardUrl={dashboardUrl} />
      </Reveal>
    </section>
  );
}
