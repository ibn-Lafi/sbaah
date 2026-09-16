import type { Locale } from '@/lib/i18n/locales';
import { MARKETING_CONTENT } from '@/lib/marketing/content';
import { CheckIcon } from './icons';

/**
 * فيديو خلفية حقيقي (نفس نمط `themes/classic/hero-section.tsx` — video
 * حقيقي لا CSS background-image، autoPlay+muted+loop+playsInline لتشغيله
 * تلقائيًا على الجوال/Safari iOS). القسم يُسحب للأعلى خلف الهيدر العائم
 * الشفاف (`-mt-20`، مطابق لارتفاع الهيدر في marketing-chrome.tsx — نفس
 * الرقمين يجب أن يبقيا متطابقين). الفيديو نفسه يتلاشى قرب الحافة السفلية
 * (`mask-image` متدرّج) بدل أن ينتهي بقصّة حادة، فيمتزج تدريجيًا بخلفية
 * الصفحة العادية التي تبدأ بعده (ProductShowcase) بدل خط فاصل واضح.
 */
export function Hero({ locale }: { locale: Locale }) {
  const t = MARKETING_CONTENT[locale].hero;
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL;

  return (
    <section className="relative -mt-20 flex min-h-[560px] flex-col items-center justify-center gap-6 overflow-hidden px-6 pb-24 pt-40 text-center sm:min-h-[640px] sm:pb-28 md:min-h-[720px]">
      <video
        src="/marketing/hero-motion.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          maskImage: 'linear-gradient(to bottom, black 65%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 65%, transparent 100%)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-transparent" />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6">
        <span className="rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur">{t.eyebrow}</span>

        <h1 className="font-display text-4xl leading-[1.15] font-semibold text-white sm:text-5xl md:text-6xl">{t.title}</h1>

        <p className="max-w-xl text-lg text-white/85">{t.subtitle}</p>

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
            className="rounded-control inline-flex h-[52px] items-center justify-center border border-white/40 px-8 text-base font-semibold text-white transition-colors hover:border-white hover:bg-white/10"
          >
            {t.secondaryCta}
          </a>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {t.trustChips.map((chip) => (
            <span key={chip} className="flex items-center gap-1.5 text-sm text-white/80">
              <CheckIcon className="h-4 w-4 flex-none text-white" />
              {chip}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
