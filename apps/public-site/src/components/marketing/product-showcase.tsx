import type { Locale } from '@/lib/i18n/locales';
import { MARKETING_CONTENT } from '@/lib/marketing/content';
import { Reveal } from './reveal';
import { ChartIcon, CrmIcon, TeamIcon, WebsiteIcon } from './icons';

const SIDEBAR_ICONS = [ChartIcon, WebsiteIcon, CrmIcon, WebsiteIcon, TeamIcon];
/** ألوان الشارات بترتيب صفوف leadRows (جديد/تم التواصل/مؤهل) — مطابقة حرفيًا لخريطة الشارات في docs/DASHBOARD_DESIGN_SYSTEM.md قسم 4. */
const LEAD_STATUS_STYLES = ['bg-brand-surface text-brand', 'bg-[#fdf2e3] text-[#8a5200]', 'bg-success-surface text-success'];

/**
 * لا لقطة شاشة حقيقية للوحة التحكم هنا — رسم توضيحي مبسّط بنفس رموز
 * تصميم الداشبورد (الألوان، الاستدارة، الشارات) يلمّح لشكلها الفعلي دون
 * نسخها حرفيًا (docs/DASHBOARD_DESIGN_SYSTEM.md قسم 4: خريطة ألوان
 * الشارات نفسها مستخدمة أدناه: جديد=brand، تم التواصل=warning،
 * مؤهل=success).
 */
export function ProductShowcase({ locale }: { locale: Locale }) {
  const t = MARKETING_CONTENT[locale].productShowcase;

  return (
    <section className="px-6 py-16 sm:py-24">
      <Reveal className="mx-auto max-w-3xl text-center">
        <span className="text-sm font-semibold text-brand">{t.eyebrow}</span>
        <h2 className="font-display mt-3 text-3xl font-semibold text-text-primary sm:text-4xl">{t.title}</h2>
        <p className="mt-3 text-lg text-text-secondary">{t.subtitle}</p>
      </Reveal>

      <Reveal delayMs={150} className="mx-auto mt-12 max-w-4xl">
        <div className="rounded-card overflow-hidden border border-border-default bg-surface-card shadow-[0_20px_60px_-15px_rgba(31,29,34,.25)]">
          {/* شريط المتصفح الزخرفي */}
          <div className="flex items-center gap-2 border-b border-border-subtle bg-surface-subtle-2 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            <span className="ms-3 flex-1 truncate rounded-full bg-surface-card px-3 py-1 text-center text-xs text-text-placeholder" dir="ltr">
              yourname.sbaah.app
            </span>
          </div>

          <div className="flex">
            {/* شريط جانبي زخرفي — مبسّط، مخفي بعرض الجوال */}
            <div className="hidden w-40 flex-none flex-col gap-1 border-e border-border-subtle bg-surface-subtle p-3 sm:flex">
              {t.labels.sidebar.map((label, index) => {
                const Icon = SIDEBAR_ICONS[index % SIDEBAR_ICONS.length]!;
                return (
                  <div
                    key={label}
                    className={`flex items-center gap-2 rounded-control px-3 py-2 text-xs font-medium ${
                      index === 0 ? 'bg-brand-surface text-brand' : 'text-text-tertiary'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 flex-none" />
                    <span className="truncate">{label}</span>
                  </div>
                );
              })}
            </div>

            {/* منطقة المحتوى الزخرفية */}
            <div className="flex-1 p-4 sm:p-6">
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {t.labels.statCards.map((card) => (
                  <div key={card.label} className="rounded-input border border-border-subtle bg-surface-page p-3 sm:p-4">
                    <p className="font-display text-lg font-semibold text-text-primary sm:text-2xl" dir="ltr">
                      {card.value}
                    </p>
                    <p className="mt-1 truncate text-[11px] text-text-secondary sm:text-xs">{card.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:mt-4">
                {t.labels.leadRows.map((row, index) => (
                  <div
                    key={row.name}
                    className="flex items-center justify-between gap-2 rounded-input border border-border-subtle bg-surface-page px-3 py-2.5"
                  >
                    <span className="truncate text-xs font-medium text-text-primary sm:text-sm">{row.name}</span>
                    <span
                      className={`flex-none rounded-full px-2.5 py-1 text-[10px] font-medium sm:text-xs ${LEAD_STATUS_STYLES[index % LEAD_STATUS_STYLES.length]}`}
                    >
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
