import type { Locale } from '@/lib/i18n/locales';
import { MARKETING_CONTENT } from '@/lib/marketing/content';
import { Reveal } from './reveal';

export function HowItWorks({ locale }: { locale: Locale }) {
  const t = MARKETING_CONTENT[locale].howItWorks;

  return (
    <section id="how-it-works" className="bg-surface-subtle-2 px-5 py-14 sm:px-6 sm:py-18">
      <Reveal className="mx-auto max-w-5xl">
        <h2 className="font-display max-w-2xl text-2xl font-semibold text-text-primary sm:text-3xl">{t.title}</h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-text-secondary sm:text-base">{t.subtitle}</p>
      </Reveal>

      <div className="mx-auto mt-9 max-w-5xl border-t border-border-subtle">
        {t.steps.map((step, index) => (
          <Reveal key={step.title} delayMs={index * 80}>
            <div className="grid gap-2 border-b border-border-subtle py-6 sm:grid-cols-[80px_1fr_1.4fr] sm:items-center sm:gap-6">
              <span className="font-display text-sm font-semibold text-brand">0{index + 1}</span>
              <h3 className="text-base font-semibold text-text-primary">{step.title}</h3>
              <p className="text-sm leading-6 text-text-secondary">{step.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
