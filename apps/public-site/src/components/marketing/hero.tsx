import type { Locale } from '@/lib/i18n/locales';
import { MARKETING_CONTENT } from '@/lib/marketing/content';
import { HeroVideo } from './hero-video';

const partnerLogoBase = 'https://raw.githubusercontent.com/ibn-Lafi/sbaah/acb83df10149cec7ec79ff779a99819a40ec3e17/';
const partnerLogos = [
  {name:'إيجار',file:'شعار منصة إيجار - SVG.svg'},
  {name:'الهيئة العامة للعقار',file:'شعار الهيئة العامة للعقار الجديد - Real Estate General Authority Logo - PNG - SVG.svg'},
  {name:'صندوق الاستثمارات العامة',file:'شعار صندوق الاستثمارات العامة  الجديد بدقة عالية - PNG - SVG PIF Logo.svg'},
  {name:'صندوق التنمية العقارية',file:'شعار صندوق التنمية العقارية - SVG.svg'},
  {name:'روشن',file:'شعار مجموعة روشن الجديد بدقة عالية PNG - SVG.svg'},
  {name:'المركز السعودي للتحكيم العقاري',file:'شعار المركز السعودي للتحكيم العقار بدقة عالية svg - png.svg'},
].map(partner=>({...partner,src:`${partnerLogoBase}${encodeURIComponent(partner.file)}`}));

export function Hero({ locale }: { locale: Locale }) {
  const t = MARKETING_CONTENT[locale].hero;
  const ar = locale === 'ar';
  const LogoSet=({copy}:{copy:number})=><div className="hero-partners-set flex shrink-0 items-center gap-6 sm:gap-12" aria-hidden={copy>1}>{partnerLogos.map((partner,index)=><div key={`${copy}-${index}`} className="flex h-12 w-20 shrink-0 items-center justify-center sm:h-16 sm:w-32"><img src={partner.src} alt={copy===1?partner.name:''} className="block max-h-full max-w-full object-contain" loading="eager"/></div>)}</div>;

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
          <div className="flex items-center justify-end gap-2 text-end">
            <span className="text-brand text-lg font-medium">←</span>
            <h2 className="text-text-secondary text-base font-semibold sm:text-lg">{ar?'شركاء النجاح':'Success partners'}</h2>
          </div>
        </div>
        <div className="relative mt-3 overflow-hidden">
          <div className="hero-partners-marquee flex w-max gap-6 sm:gap-12" dir="ltr"><LogoSet copy={1}/><LogoSet copy={2}/><LogoSet copy={3}/><LogoSet copy={4}/></div>
        </div>
      </div>
      <style>{`@keyframes heroPartnersMarquee{from{transform:translate3d(0,0,0)}to{transform:translate3d(calc(-25% - 1.125rem),0,0)}}@media (min-width:640px){@keyframes heroPartnersMarquee{from{transform:translate3d(0,0,0)}to{transform:translate3d(calc(-25% - 2.25rem),0,0)}}}.hero-partners-marquee{animation:heroPartnersMarquee 22s linear infinite;will-change:transform;transform:translate3d(0,0,0)}.hero-partners-set{flex:none}@media (prefers-reduced-motion:reduce){.hero-partners-marquee{animation-duration:44s}}`}</style>
    </section>
  );
}
