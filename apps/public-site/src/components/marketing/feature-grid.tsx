import type { Locale } from '@/lib/i18n/locales';
import { MARKETING_CONTENT } from '@/lib/marketing/content';
import { Reveal } from './reveal';
import { ChartIcon, CrmIcon, DomainIcon, TeamIcon, WebsiteIcon, WhatsappIcon } from './icons';

const FEATURE_ICONS = [WebsiteIcon, DomainIcon, WhatsappIcon, CrmIcon, TeamIcon, ChartIcon];

export function FeatureGrid({ locale }: { locale: Locale }) {
  const t = MARKETING_CONTENT[locale].features;

  return (
    <section id="features" className="px-5 py-14 sm:px-6 sm:py-18">
      <Reveal className="mx-auto max-w-5xl">
        <h2 className="font-display max-w-2xl text-2xl font-semibold text-text-primary sm:text-3xl">{t.title}</h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-text-secondary sm:text-base">{t.subtitle}</p>
      </Reveal>

      <div className="mx-auto mt-9 grid max-w-5xl border-t border-border-subtle sm:grid-cols-2 lg:grid-cols-3">
        {t.items.map((item, index) => {
          const Icon = FEATURE_ICONS[index % FEATURE_ICONS.length]!;
          return (
            <Reveal key={item.title} delayMs={index * 60}>
              <div className="group flex h-full gap-4 border-b border-border-subtle py-6 sm:pe-6 lg:min-h-36">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-surface text-brand">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-text-primary">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-text-secondary">{item.body}</p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
