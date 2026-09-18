import type { Locale } from '@/lib/i18n/locales';
import { MARKETING_CONTENT } from '@/lib/marketing/content';
import { HeroVideo } from './hero-video';

const partnerLogos = [
  { name: 'Saudi Real Estate Arbitration Center', src: 'https://raw.githubusercontent.com/ibn-Lafi/sbaah/claude/real-estate-saas-platform-sp7ua9/%D8%B4%D8%B9%D8%A7%D8%B1%20%D8%A7%D9%84%D9%85%D8%B1%D9%83%D8%B2%20%D8%A7%D9%84%D8%B3%D8%B9%D9%88%D8%AF%D9%8A%20%D9%84%D9%84%D8%AA%D8%AD%D9%83%D9%8A%D9%85%20%D8%A7%D9%84%D8%B9%D9%82%D8%A7%D8%B1%20%D8%A8%D8%AF%D9%82%D8%A9%20%D8%B9%D8%A7%D9%84%D9%8A%D8%A9%20svg%20-%20png.svg' },
  { name: 'Real Estate General Authority', src: 'https://raw.githubusercontent.com/ibn-Lafi/sbaah/claude/real-estate-saas-platform-sp7ua9/%D8%B4%D8%B9%D8%A7%D8%B1%20%D8%A7%D9%84%D9%87%D9%8A%D9%8A%D9%94%D8%A9%20%D8%A7%D9%84%D8%B9%D8%A7%D9%85%D8%A9%20%D9%84%D9%84%D8%B9%D9%82%D8%A7%D8%B1%20%D8%A7%D9%84%D8%AC%D8%AF%D9%8A%D8%AF%20-%20Real%20Estate%20General%20Authority%20Logo%20-%20PNG%20-%20SVG.svg' },
  { name: 'Public Investment Fund', src: 'https://raw.githubusercontent.com/ibn-Lafi/sbaah/claude/real-estate-saas-platform-sp7ua9/%D8%B4%D8%B9%D8%A7%D8%B1%20%D8%B5%D9%86%D8%AF%D9%88%D9%82%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D8%AB%D9%85%D8%A7%D8%B1%D8%A7%D8%AA%20%D8%A7%D9%84%D8%B9%D8%A7%D9%85%D8%A9%20%20%D8%A7%D9%84%D8%AC%D8%AF%D9%8A%D8%AF%20%D8%A8%D8%AF%D9%82%D8%A9%20%D8%B9%D8%A7%D9%84%D9%8A%D8%A9%20-%20PNG%20-%20SVG%20PIF%20Logo.svg' },
  { name: 'Real Estate Development Fund', src: 'https://raw.githubusercontent.com/ibn-Lafi/sbaah/claude/real-estate-saas-platform-sp7ua9/%D8%B4%D8%B9%D8%A7%D8%B1%20%D8%B5%D9%86%D8%AF%D9%88%D9%82%20%D8%A7%D9%84%D8%AA%D9%86%D9%85%D9%8A%D8%A9%20%D8%A7%D9%84%D8%B9%D9%82%D8%A7%D8%B1%D9%8A%D8%A9%20-%20SVG.svg' },
  { name: 'ROSHN Group', src: 'https://raw.githubusercontent.com/ibn-Lafi/sbaah/claude/real-estate-saas-platform-sp7ua9/%D8%B4%D8%B9%D8%A7%D8%B1%20%D9%85%D8%AC%D9%85%D9%88%D8%B9%D8%A9%20%D8%B1%D9%88%D8%B4%D9%86%20%D8%A7%D9%84%D8%AC%D8%AF%D9%8A%D8%AF%20%D8%A8%D8%AF%D9%82%D8%A9%20%D8%B9%D8%A7%D9%84%D9%8A%D8%A9%20PNG%20-%20SVG.svg' },
  { name: 'Ejar', src: 'https://raw.githubusercontent.com/ibn-Lafi/sbaah/claude/real-estate-saas-platform-sp7ua9/%D8%B4%D8%B9%D8%A7%D8%B1%20%D9%85%D9%86%D8%B5%D8%A9%20%D8%A7%D9%95%D9%8A%D8%AC%D8%A7%D8%B1%20-%20SVG.svg' },
  { name: 'Ministry of Communications and Information Technology', src: 'https://raw.githubusercontent.com/ibn-Lafi/sbaah/claude/real-estate-saas-platform-sp7ua9/%D8%B4%D8%B9%D8%A7%D8%B1%20%D9%88%D8%B2%D8%A7%D8%B1%D8%A9%20%D8%A7%D9%84%D8%A7%D8%AA%D8%B5%D8%A7%D9%84%D8%A7%D8%AA%20%D9%88%D8%AA%D9%82%D9%86%D9%8A%D8%A9%20%D8%A7%D9%84%D9%85%D8%B9%D9%84%D9%88%D9%85%D8%A7%D8%AA%20-%20PNG%20-%20SVG.svg' },
  { name: 'Real Estate Registry', src: 'https://raw.githubusercontent.com/ibn-Lafi/sbaah/claude/real-estate-saas-platform-sp7ua9/%D9%86%D8%B3%D8%AE%D8%A9%20%D9%85%D9%86%20%D8%B4%D8%B9%D8%A7%D8%B1%20%D8%AE%D8%B7%D9%8A%20%D8%A8%D8%A7%D9%84%D9%88%D9%86%20%D8%A7%D9%84%D8%A7%D8%AE%D8%B6%D8%B1%20%D8%A7%D9%84%D8%BA%D8%A7%D9%85%D9%82%20%D9%88%20%D8%A7%D9%84%D8%A7%D8%A8%D9%8A%D8%B6%20%20-%203.svg' },
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
    <section className="relative -mt-20 flex min-h-[760px] flex-col items-center justify-center overflow-hidden bg-surface-card px-6 pb-52 pt-40 text-center sm:min-h-[800px] sm:pb-56 md:min-h-[860px]">
      <HeroVideo src="/marketing/hero-motion.mp4" className="absolute inset-x-0 top-0 z-0 h-[82%] w-full object-cover sm:h-[83%]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[62%] bg-gradient-to-b from-black/60 via-black/30 to-transparent" />

      {/* White page background starts solid at the video's lower edge and dissolves upward. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-[18%] z-[3] h-[34%] sm:bottom-[17%]"
        style={{background:'linear-gradient(to top,var(--color-surface-card) 0%,var(--color-surface-card) 8%,color-mix(in srgb,var(--color-surface-card) 98%,transparent) 16%,color-mix(in srgb,var(--color-surface-card) 92%,transparent) 27%,color-mix(in srgb,var(--color-surface-card) 80%,transparent) 39%,color-mix(in srgb,var(--color-surface-card) 62%,transparent) 52%,color-mix(in srgb,var(--color-surface-card) 42%,transparent) 65%,color-mix(in srgb,var(--color-surface-card) 23%,transparent) 77%,color-mix(in srgb,var(--color-surface-card) 9%,transparent) 88%,transparent 100%)'}}
      />

      <div className="relative z-10 mx-auto -mt-28 flex max-w-3xl flex-col items-center gap-6 sm:-mt-32">
        <h1 className="font-display text-4xl leading-[1.15] font-semibold text-white sm:text-5xl md:text-6xl">{t.title}</h1>
        <p className="max-w-xl text-lg text-white/85">{t.subtitle}</p>
      </div>

      <div className="absolute inset-x-0 bottom-5 z-[5] sm:bottom-7">
        <div className="mx-auto max-w-5xl px-5">
          <div className="flex items-center justify-center text-center">
            <h2 className="hero-trusted-gold text-xl font-bold sm:text-2xl">{ar?'موثوق من':'Trusted by'}</h2>
          </div>
        </div>
        <div className="relative mt-3 overflow-hidden">
          <div className="hero-partners-marquee flex w-max" dir="ltr"><LogoSet copy={1}/><LogoSet copy={2}/><LogoSet copy={3}/><LogoSet copy={4}/></div>
        </div>
      </div>
      <style>{`.hero-trusted-gold{color:#d4af37;background:linear-gradient(110deg,#8a6508 0%,#c99718 18%,#fff2a8 38%,#d4af37 52%,#fff8c9 64%,#b8860b 82%,#f0cf5a 100%);background-size:220% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;text-shadow:0 1px 1px rgba(93,63,0,.18);animation:trustedGoldShine 3.8s ease-in-out infinite}@keyframes trustedGoldShine{0%,100%{background-position:100% 50%}50%{background-position:0 50%}}@keyframes heroPartnersMarquee{from{transform:translate3d(0,0,0)}to{transform:translate3d(-25%,0,0)}}.hero-partners-marquee{animation:heroPartnersMarquee 15s linear infinite;will-change:transform;transform:translate3d(0,0,0)}.hero-partners-set{flex:none}@media(max-width:639px){.hero-partners-marquee{position:relative;left:100vw;animation:heroPartnersMarqueeMobile 18s linear infinite}@keyframes heroPartnersMarqueeMobile{from{transform:translate3d(0,0,0)}to{transform:translate3d(calc(-25% - 100vw),0,0)}}}@media (prefers-reduced-motion:reduce){.hero-partners-marquee{animation-duration:30s}}`}</style>
    </section>
  );
}
