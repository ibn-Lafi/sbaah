import type { Locale } from '@/lib/i18n/locales';
import { MARKETING_CONTENT } from '@/lib/marketing/content';
import { Reveal } from './reveal';

export function FinalCta({ locale }: { locale: Locale }) {
  const t = MARKETING_CONTENT[locale].finalCta;
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL;

  return (
    <section className="px-6 py-16 sm:py-24">
      <Reveal className="rounded-card relative mx-auto max-w-4xl overflow-hidden bg-brand px-6 py-14 text-center sm:px-12 sm:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -end-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl"
        />
        <div className="relative flex flex-col items-center gap-4">
          <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">{t.title}</h2>
          <p className="max-w-xl text-lg text-white/85">{t.subtitle}</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            {dashboardUrl && (
              <a
                href={`${dashboardUrl}/register`}
                className="rounded-control text-brand inline-flex h-[52px] items-center justify-center bg-white px-8 text-base font-semibold transition-opacity hover:opacity-90"
              >
                {t.primaryCta}
              </a>
            )}
            {dashboardUrl && (
              <a
                href={`${dashboardUrl}/login`}
                className="rounded-control inline-flex h-[52px] items-center justify-center border border-white/40 px-8 text-base font-semibold text-white transition-colors hover:bg-white/10"
              >
                {t.secondaryCta}
              </a>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
