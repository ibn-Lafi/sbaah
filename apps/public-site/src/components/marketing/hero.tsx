import type { Locale } from '@/lib/i18n/locales';
import { MARKETING_CONTENT } from '@/lib/marketing/content';
import { CheckIcon } from './icons';

/**
 * لا صور فوتوغرافية هنا (لا مصدر صور مرخّص فعليًا متاح لهذه الجلسة) —
 * الخلفية زخرفية بالكامل (تدرّجات لونية من هوية سبعة نفسها + شكل شبكي
 * خفيف يلمّح لخريطة/عقارات بلا تمثيل حرفي)، لا صورة مُستخرجة من الإنترنت
 * بلا ترخيص واضح.
 */
export function Hero({ locale }: { locale: Locale }) {
  const t = MARKETING_CONTENT[locale].hero;
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL;

  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-20 text-center sm:pb-28 sm:pt-28">
      {/* الحاوية الخارجية تتولى التوسيط الثابت (transform: translateX)، والداخلية الحركة (transform: translate/scale) — فصل الاثنين لأن كليهما يضبط نفس خاصية CSS ولو اجتمعا في عنصر واحد لألغى أحدهما الآخر. */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-32 start-1/2 h-[36rem] w-[36rem] -translate-x-1/2">
        <div className="motion-safe:animate-drift-slow h-full w-full rounded-full bg-brand/15 blur-3xl" />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 end-[-6rem] h-[28rem] w-[28rem]">
        <div className="motion-safe:animate-drift-slow h-full w-full rounded-full bg-brand/10 blur-3xl [animation-delay:2s]" />
      </div>

      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6">
        <span className="rounded-full bg-brand-surface px-4 py-1.5 text-sm font-medium text-brand">{t.eyebrow}</span>

        <h1 className="font-display text-4xl leading-[1.15] font-semibold text-text-primary sm:text-5xl md:text-6xl">
          {t.title}
        </h1>

        <p className="max-w-xl text-lg text-text-secondary">{t.subtitle}</p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          {dashboardUrl && (
            <a
              href={`${dashboardUrl}/register`}
              className="rounded-control inline-flex h-[52px] items-center justify-center bg-brand px-8 text-base font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              {t.primaryCta}
            </a>
          )}
          <a
            href="#how-it-works"
            className="rounded-control border-border-default text-text-primary hover:border-brand hover:text-brand inline-flex h-[52px] items-center justify-center border px-8 text-base font-semibold transition-colors"
          >
            {t.secondaryCta}
          </a>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {t.trustChips.map((chip) => (
            <span key={chip} className="flex items-center gap-1.5 text-sm text-text-secondary">
              <CheckIcon className="h-4 w-4 flex-none text-brand" />
              {chip}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
