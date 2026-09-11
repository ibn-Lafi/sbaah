import type { Plan } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import { apiGet } from '@/lib/api/client';
import { MARKETING_CONTENT } from '@/lib/marketing/content';

/** Real, admin-configurable plans (PRODUCT_SPEC section 2) — never hardcoded here, same endpoint dashboard's own upgrade UI reads. */
async function getActivePlans(): Promise<Plan[]> {
  const { plans } = await apiGet<{ plans: Plan[] }>('/public/plans');
  return plans;
}

/** سبعة's own marketing homepage content — rendered by `[locale]/page.tsx` when the request's Host is the bare platform root domain (see `[locale]/layout.tsx` for the matching chrome branch). No tenant involved at all. */
export async function MarketingHome({ locale }: { locale: Locale }) {
  const t = MARKETING_CONTENT[locale];
  const plans = await getActivePlans();
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL;

  return (
    <div>
      <section className="flex flex-col items-center gap-5 px-6 py-20 text-center">
        <span className="rounded-full bg-[#68458A]/10 px-4 py-1 text-sm font-medium text-[#68458A]">{t.hero.eyebrow}</span>
        <h1 className="max-w-3xl text-3xl font-bold md:text-5xl">{t.hero.title}</h1>
        <p className="max-w-xl text-lg text-black/70">{t.hero.subtitle}</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          {dashboardUrl && (
            <a href={`${dashboardUrl}/register`} className="rounded-lg bg-[#68458A] px-7 py-3 font-semibold text-white hover:opacity-90">
              {t.hero.primaryCta}
            </a>
          )}
          <a href="#features" className="rounded-lg border border-black/15 px-7 py-3 font-semibold hover:border-[#68458A] hover:text-[#68458A]">
            {t.hero.secondaryCta}
          </a>
        </div>
      </section>

      <section id="features" className="border-t border-black/10 px-6 py-16">
        <h2 className="mb-10 text-center text-2xl font-bold md:text-3xl">{t.features.title}</h2>
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {t.features.items.map((item) => (
            <div key={item.title} className="rounded-xl border border-black/10 p-6">
              <h3 className="mb-2 font-semibold text-[#68458A]">{item.title}</h3>
              <p className="text-sm text-black/70">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {plans.length > 0 && (
        <section id="pricing" className="border-t border-black/10 bg-black/[0.02] px-6 py-16">
          <h2 className="mb-2 text-center text-2xl font-bold md:text-3xl">{t.pricing.title}</h2>
          <p className="mx-auto mb-10 max-w-lg text-center text-black/70">{t.pricing.subtitle}</p>
          <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className="w-full max-w-sm rounded-xl border border-black/10 bg-white p-8">
                <h3 className="text-lg font-semibold">{locale === 'ar' ? plan.name_ar : plan.name_en}</h3>
                <p className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold" dir="ltr">
                    {plan.price.toLocaleString('en-US')}
                  </span>
                  <span className="text-sm text-black/60">{t.pricing.perMonth}</span>
                </p>
                <ul className="mt-6 flex flex-col gap-2 text-sm text-black/70">
                  <li className="flex items-center justify-between">
                    <span>{t.pricing.propertiesLimit}</span>
                    <span className="font-medium text-black" dir={plan.max_properties != null ? 'ltr' : undefined}>
                      {plan.max_properties != null ? plan.max_properties.toLocaleString('en-US') : t.pricing.unlimited}
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>{t.pricing.usersLimit}</span>
                    <span className="font-medium text-black" dir={plan.max_users != null ? 'ltr' : undefined}>
                      {plan.max_users != null ? plan.max_users.toLocaleString('en-US') : t.pricing.unlimited}
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>{plan.custom_domain_allowed ? t.pricing.customDomainYes : t.pricing.customDomainNo}</span>
                    <span className="font-medium text-black">{plan.custom_domain_allowed ? '✓' : '—'}</span>
                  </li>
                </ul>
                {dashboardUrl && (
                  <a
                    href={`${dashboardUrl}/register`}
                    className="mt-6 block rounded-lg bg-[#68458A] px-4 py-3 text-center font-semibold text-white hover:opacity-90"
                  >
                    {t.pricing.cta}
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
