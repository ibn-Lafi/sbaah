import type { Locale } from '@/lib/i18n/locales';
import { MARKETING_CONTENT } from '@/lib/marketing/content';
import { HeroVideo } from './hero-video';

const partnerLogos = [
  { name: 'ROSHN Group', src: '/marketing/partners/roshn.svg' },
  { name: 'Saudi Real Estate Arbitration Center', src: '/marketing/partners/arbitration.svg' },
  { name: 'Real Estate Development Fund', src: '/marketing/partners/redf.svg' },
];

export function Hero({ locale }: { locale: Locale }) {
  const t = MARKETING_CONTENT[locale].hero;
  const ar = locale === 'ar';
  const LogoSet = ({ copy }: { copy: number }) => (
    <div className="hero-partners-set flex shrink-0 items-center" aria-hidden={copy > 1}>
      {partnerLogos.map((partner, index) => (
        <div key={`${copy}-${index}`} className="flex h-16 w-32 shrink-0 items-center justify-center px-2 sm:h-20 sm:w-44 sm:px-4">
          <img
            src={partner.src}
            alt={copy === 1 ? partner.name : ''}
            title={partner.name}
            className={`block h-auto w-auto object-contain ${partner.name === 'Real Estate Development Fund' ? 'max-h-full max-w-[112%] scale-110 sm:scale-105' : 'max-h-[88%] max-w-full'}`}
            loading="eager"
          />
        </div>
      ))}
    </div>
  );

  return (
    <section className="relative -mt-20 flex min-h-[760px] flex-col items-center justify-center overflow-hidden bg-white px-6 pb-52 pt-40 text-center sm:min-h-[800px] sm:pb-56 md:min-h-[860px]">
      <HeroVideo src="/marketing/hero-motion.mp4" className="absolute inset-x-0 top-0 z-0 h-[82%] w-full object-cover sm:h-[83%]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[62%] bg-gradient-to-b from-black/60 via-black/30 to-transparent" />

      {/* White page background starts solid at the video's lower edge and dissolves upward. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-[18%] z-[3] h-[34%] sm:bottom-[17%]"
        style={{background:'linear-gradient(to top,#ffffff 0%,#ffffff 8%,rgba(255,255,255,.98) 16%,rgba(255,255,255,.92) 27%,rgba(255,255,255,.80) 39%,rgba(255,255,255,.62) 52%,rgba(255,255,255,.42) 65%,rgba(255,255,255,.23) 77%,rgba(255,255,255,.09) 88%,rgba(255,255,255,0) 100%)'}}
      />

      <div className="relative z-10 mx-auto -mt-28 flex max-w-3xl flex-col items-center gap-6 sm:-mt-32">
        <span className="rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur">{t.eyebrow}</span>
        <h1 className="font-display text-4xl leading-[1.15] font-semibold text-white sm:text-5xl md:text-6xl">{t.title}</h1>
        <p className="max-w-xl text-lg text-white/85">{t.subtitle}</p>
      </div>

      <div className="absolute inset-x-0 bottom-5 z-[5] sm:bottom-7">
        <div className="mx-auto max-w-5xl px-5">
          <div className="flex items-center justify-center text-center">
            <h2 className="text-text-secondary text-xl font-semibold sm:text-2xl">{ar?'موثوق من':'Trusted by'}</h2>
          </div>
        </div>
        <div className="relative mt-3 overflow-hidden">
          <div className="hero-partners-marquee flex w-max" dir="ltr"><LogoSet copy={1}/><LogoSet copy={2}/><LogoSet copy={3}/><LogoSet copy={4}/></div>
        </div>
      </div>
      <style>{`@keyframes heroPartnersMarquee{from{transform:translate3d(0,0,0)}to{transform:translate3d(-25%,0,0)}}.hero-partners-marquee{animation:heroPartnersMarquee 15s linear infinite;will-change:transform;transform:translate3d(0,0,0)}.hero-partners-set{flex:none}@media (prefers-reduced-motion:reduce){.hero-partners-marquee{animation-duration:30s}}`}</style>
    </section>
  );
}
