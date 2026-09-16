import type { Locale } from '@/lib/i18n/locales';
import { MARKETING_CONTENT } from '@/lib/marketing/content';
import { Reveal } from './reveal';
import { ChartIcon, CrmIcon, DomainIcon, TeamIcon, WebsiteIcon, WhatsappIcon } from './icons';

/** بنفس ترتيب content.features.items (سبعة عناصر ثابتة الترتيب، لا بيانات ديناميكية). */
const FEATURE_ICONS = [WebsiteIcon, DomainIcon, WhatsappIcon, CrmIcon, TeamIcon, ChartIcon];

export function FeatureGrid({ locale }: { locale: Locale }) {
  const t = MARKETING_CONTENT[locale].features;

  return (
    <section id="features" className="px-6 py-16 sm:py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-semibold text-text-primary sm:text-4xl">{t.title}</h2>
        <p className="mt-3 text-lg text-text-secondary">{t.subtitle}</p>
      </Reveal>

      <div className="mx-auto mt-12 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {t.items.map((item, index) => {
          const Icon = FEATURE_ICONS[index % FEATURE_ICONS.length]!;
          return (
            <Reveal key={item.title} delayMs={index * 80}>
              <div className="rounded-card h-full border border-border-subtle bg-surface-card p-6 transition-shadow hover:shadow-[0_12px_30px_-10px_rgba(31,29,34,.15)]">
                <div className="bg-brand-surface flex h-11 w-11 items-center justify-center rounded-control text-brand">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-text-primary">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{item.body}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
