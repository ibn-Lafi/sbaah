import type { Locale } from '@/lib/i18n/locales';
import { MARKETING_CONTENT } from '@/lib/marketing/content';
import { HeroVideo } from './hero-video';

/**
 * Hero video with a long, visible bottom fade into the page background.
 * The fade is layered above the video (not behind the section) so it works
 * consistently on mobile Safari as well as desktop browsers.
 */
export function Hero({ locale }: { locale: Locale }) {
  const t = MARKETING_CONTENT[locale].hero;

  return (
    <section className="relative -mt-20 flex min-h-[600px] flex-col items-center justify-center gap-6 overflow-hidden px-6 pb-40 pt-40 text-center sm:min-h-[680px] sm:pb-44 md:min-h-[760px]">
      <HeroVideo
        src="/marketing/hero-motion.mp4"
        className="absolute inset-0 z-0 h-full w-full object-cover"
      />

      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/60 via-black/30 to-transparent" />

      {/* Long cinematic fade: video remains visible underneath while it gradually
          dissolves into the exact light/dark page background. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[42%] bg-gradient-to-b from-transparent via-white/70 to-white dark:via-neutral-950/70 dark:to-neutral-950 sm:h-[38%]" />

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-6">
        <span className="rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur">{t.eyebrow}</span>

        <h1 className="font-display text-4xl leading-[1.15] font-semibold text-white sm:text-5xl md:text-6xl">{t.title}</h1>

        <p className="max-w-xl text-lg text-white/85">{t.subtitle}</p>
      </div>
    </section>
  );
}
