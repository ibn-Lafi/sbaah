import type { Locale } from '@/lib/i18n/locales';
import { MARKETING_CONTENT } from '@/lib/marketing/content';
import { HeroVideo } from './hero-video';

/**
 * خلفية Hero بالفيديو مع تلاشي سفلي طويل داخل خلفية الصفحة.
 * طبقة التلاشي تتجاوز حدود القسم قليلًا حتى لا يظهر أي خط فاصل على الجوال.
 */
export function Hero({ locale }: { locale: Locale }) {
  const t = MARKETING_CONTENT[locale].hero;
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL;

  return (
    <section className="relative -mt-20 flex min-h-[560px] flex-col items-center justify-center gap-6 px-6 pb-36 pt-40 text-center sm:min-h-[640px] sm:pb-40 md:min-h-[720px]">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <HeroVideo
          src="/marketing/hero-motion.mp4"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-transparent" />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%]"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--background) 8%, transparent) 16%, color-mix(in srgb, var(--background) 30%, transparent) 38%, color-mix(in srgb, var(--background) 66%, transparent) 66%, var(--background) 92%, var(--background) 100%)',
          }}
        />
      </div>

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

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -bottom-20 z-0 h-40 bg-gradient-to-b from-background to-background"
      />
    </section>
  );
}
