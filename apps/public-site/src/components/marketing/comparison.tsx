import type { Locale } from '@/lib/i18n/locales';
import { MARKETING_CONTENT } from '@/lib/marketing/content';
import { Reveal } from './reveal';
import { CheckIcon, MinusIcon } from './icons';

export function Comparison({ locale }: { locale: Locale }) {
  const t = MARKETING_CONTENT[locale].comparison;

  return (
    <section className="border-t border-border-subtle px-6 py-16 sm:py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-semibold text-text-primary sm:text-4xl">{t.title}</h2>
        <p className="mt-3 text-lg text-text-secondary">{t.subtitle}</p>
      </Reveal>

      <Reveal delayMs={150} className="mx-auto mt-12 max-w-4xl">
        {/* عرض الجوال/التابلت: بطاقة لكل صف بدل جدول ثلاثي الأعمدة يضيق كثيرًا. */}
        <div className="flex flex-col gap-3 sm:hidden">
          {t.rows.map((row) => (
            <div key={row.label} className="rounded-card border border-border-subtle bg-surface-card p-4">
              <p className="text-sm font-semibold text-text-primary">{row.label}</p>
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex items-start gap-2 text-sm text-text-secondary">
                  <MinusIcon className="mt-0.5 h-4 w-4 flex-none text-text-placeholder" />
                  <span>{row.before}</span>
                </div>
                <div className="flex items-start gap-2 text-sm font-medium text-text-primary">
                  <CheckIcon className="mt-0.5 h-4 w-4 flex-none text-success" />
                  <span>{row.after}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* عرض التابلت/الكمبيوتر: جدول ثلاثي الأعمدة حقيقي. */}
        <div className="hidden overflow-hidden rounded-card border border-border-subtle sm:block">
          <div className="grid grid-cols-[1.2fr_1fr_1fr] bg-surface-subtle-2 text-sm font-semibold text-text-primary">
            <div className="px-5 py-4" />
            <div className="px-5 py-4 text-text-secondary">{t.columnBefore}</div>
            <div className="px-5 py-4 text-brand">{t.columnAfter}</div>
          </div>
          {t.rows.map((row, index) => (
            <div
              key={row.label}
              className={`grid grid-cols-[1.2fr_1fr_1fr] border-t border-border-subtle text-sm ${
                index % 2 === 1 ? 'bg-surface-subtle-2/40' : ''
              }`}
            >
              <div className="px-5 py-4 font-medium text-text-primary">{row.label}</div>
              <div className="flex items-center gap-2 px-5 py-4 text-text-secondary">
                <MinusIcon className="h-4 w-4 flex-none text-text-placeholder" />
                {row.before}
              </div>
              <div className="flex items-center gap-2 px-5 py-4 font-medium text-text-primary">
                <CheckIcon className="h-4 w-4 flex-none text-success" />
                {row.after}
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
