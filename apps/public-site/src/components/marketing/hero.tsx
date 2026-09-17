import type { Locale } from '@/lib/i18n/locales';
import { MARKETING_CONTENT } from '@/lib/marketing/content';
import { HeroVideo } from './hero-video';

/**
 * فيديو خلفية حقيقي (نفس نمط `themes/classic/hero-section.tsx` — video
 * حقيقي لا CSS background-image، autoPlay+muted+loop+playsInline لتشغيله
 * تلقائيًا على الجوال/Safari iOS). القسم يُسحب للأعلى خلف الهيدر العائم
 * الشفاف (`-mt-20`، مطابق لارتفاع الهيدر في marketing-chrome.tsx — نفس
 * الرقمين يجب أن يبقيا متطابقين). نهاية الفيديو تتلاشى تدريجيًا داخل خلفية
 * الصفحة حتى لا يظهر حد أو فاصل واضح بين الـHero والقسم التالي.
 */
export function Hero({ locale }: { locale: Locale }) {
  const t = MARKETING_CONTENT[locale].hero;
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL;

  return (
    <section className="relative -mt-20 flex min-h-[560px] flex-col items-center justify-center gap-6 overflow-hidden px-6 pb-28 pt-40 text-center sm:min-h-[640px] sm:pb-32 md:min-h-[720px]">
      <HeroVideo
        src="/marketing/hero-motion.mp4"
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          maskImage: 'linear-gradient(to bottom, black 0%, black 58%, rgba(0,0,0,.92) 68%, rgba(0,0,0,.62) 80%, rgba(0,0,0,.22) 92%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 58%, rgba(0,0,0,.92) 68%, rgba(0,0,0,.62) 80%, rgba(0,0,0,.22) 92%, transparent 100%)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[32%] bg-gradient-to-b from-transparent via-background/45 to-background" />

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
      </div>
    </section>
  );
}
