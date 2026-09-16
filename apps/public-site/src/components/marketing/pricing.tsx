import type { Plan } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import { apiGet } from '@/lib/api/client';
import { MARKETING_CONTENT } from '@/lib/marketing/content';
import { Reveal } from './reveal';
import { CheckIcon } from './icons';

/** Real, admin-configurable plans (PRODUCT_SPEC section 2) — never hardcoded here, same endpoint dashboard's own upgrade UI reads. */
async function getActivePlans(): Promise<Plan[]> {
  const { plans } = await apiGet<{ plans: Plan[] }>('/public/plans');
  return plans;
}

export async function Pricing({ locale }: { locale: Locale }) {
  const t = MARKETING_CONTENT[locale].pricing;
  const plans = await getActivePlans();
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL;
  if (plans.length === 0) return null;

  // شارة "الأكثر اختيارًا" على الخطة الوسطى فقط عند وجود ٣ خطط فأكثر —
  // مجرّد تمييز بصري لا ادّعاء رقمي حقيقي (لا بيانات مبيعات فعلية متاحة هنا).
  const highlightIndex = plans.length >= 3 ? Math.floor(plans.length / 2) : -1;

  return (
    <section id="pricing" className="border-t border-border-subtle px-6 py-16 sm:py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-semibold text-text-primary sm:text-4xl">{t.title}</h2>
        <p className="mt-3 text-lg text-text-secondary">{t.subtitle}</p>
      </Reveal>

      <div className="mx-auto mt-12 flex max-w-4xl flex-wrap justify-center gap-6">
        {plans.map((plan, index) => {
          const highlighted = index === highlightIndex;
          return (
            <Reveal key={plan.id} delayMs={index * 100} className="w-full max-w-sm">
              <div
                className={`rounded-card relative flex h-full flex-col border bg-surface-card p-8 ${
                  highlighted ? 'border-brand shadow-[0_16px_40px_-12px_rgba(104,69,138,.35)]' : 'border-border-subtle'
                }`}
              >
                {highlighted && (
                  <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white absolute -top-3 start-1/2 -translate-x-1/2">
                    {t.mostPopular}
                  </span>
                )}
                <h3 className="text-lg font-semibold text-text-primary">{locale === 'ar' ? plan.name_ar : plan.name_en}</h3>
                <p className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-4xl font-semibold text-text-primary" dir="ltr">
                    {plan.price.toLocaleString('en-US')}
                  </span>
                  <span className="text-sm text-text-secondary">{t.perMonth}</span>
                </p>
                <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm text-text-secondary">
                  <li className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 flex-none text-success" />
                      {t.propertiesLimit}
                    </span>
                    <span className="font-medium text-text-primary" dir={plan.max_properties != null ? 'ltr' : undefined}>
                      {plan.max_properties != null ? plan.max_properties.toLocaleString('en-US') : t.unlimited}
                    </span>
                  </li>
                  <li className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 flex-none text-success" />
                      {t.usersLimit}
                    </span>
                    <span className="font-medium text-text-primary" dir={plan.max_users != null ? 'ltr' : undefined}>
                      {plan.max_users != null ? plan.max_users.toLocaleString('en-US') : t.unlimited}
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 flex-none text-success" />
                    {plan.custom_domain_allowed ? t.customDomainYes : t.customDomainNo}
                  </li>
                </ul>
                {dashboardUrl && (
                  <a
                    href={`${dashboardUrl}/register`}
                    className={`rounded-control mt-6 flex h-[48px] items-center justify-center text-center text-sm font-semibold transition-colors ${
                      highlighted
                        ? 'bg-brand text-white hover:bg-brand-hover'
                        : 'border border-border-default text-text-primary hover:bg-surface-subtle'
                    }`}
                  >
                    {t.cta}
                  </a>
                )}
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
