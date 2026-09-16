import type { Locale } from '@/lib/i18n/locales';
import { MARKETING_CONTENT } from '@/lib/marketing/content';
import { Reveal } from './reveal';

export function HowItWorks({ locale }: { locale: Locale }) {
  const t = MARKETING_CONTENT[locale].howItWorks;

  return (
    <section id="how-it-works" className="border-t border-border-subtle bg-surface-subtle-2 px-6 py-16 sm:py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-semibold text-text-primary sm:text-4xl">{t.title}</h2>
        <p className="mt-3 text-lg text-text-secondary">{t.subtitle}</p>
      </Reveal>

      <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-3">
        {t.steps.map((step, index) => (
          <Reveal key={step.title} delayMs={index * 100}>
            <div className="rounded-card h-full border border-border-subtle bg-surface-card p-6">
              <span className="font-display bg-brand-surface flex h-12 w-12 items-center justify-center rounded-full text-xl font-semibold text-brand">
                {step.number}
              </span>
              <h3 className="mt-4 font-semibold text-text-primary">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{step.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
