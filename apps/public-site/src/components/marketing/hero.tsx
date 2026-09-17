import type { Locale } from '@/lib/i18n/locales';
import { MARKETING_CONTENT } from '@/lib/marketing/content';
import { HeroVideo } from './hero-video';

const partnerLogos = [
  {name:'إيجار',src:'https://raw.githubusercontent.com/ibn-Lafi/sbaah/acb83df10149cec7ec79ff779a99819a40ec3e17/شعار ايجار الجديد بدقة عالية svg - png.svg'},
  {name:'فال',src:'https://raw.githubusercontent.com/ibn-Lafi/sbaah/acb83df10149cec7ec79ff779a99819a40ec3e17/شعار فال للوساطة والتسويق العقاري بدقة عالية svg - png.svg'},
  {name:'الهيئة العامة للعقار',src:'https://raw.githubusercontent.com/ibn-Lafi/sbaah/acb83df10149cec7ec79ff779a99819a40ec3e17/شعار الهيئة العامة للعقار بدقة عالية svg - png.svg'},
  {name:'السجل العقاري',src:'https://raw.githubusercontent.com/ibn-Lafi/sbaah/acb83df10149cec7ec79ff779a99819a40ec3e17/شعار السجل العقاري بدقة عالية svg - png.svg'},
  {name:'المركز السعودي للتحكيم العقاري',src:'https://raw.githubusercontent.com/ibn-Lafi/sbaah/acb83df10149cec7ec79ff779a99819a40ec3e17/شعار المركز السعودي للتحكيم العقار بدقة عالية svg - png.svg'},
  {name:'تقدم',src:'https://raw.githubusercontent.com/ibn-Lafi/sbaah/acb83df10149cec7ec79ff779a99819a40ec3e17/شعار تقدم بدقة عالية svg - png.svg'},
];

export function Hero({ locale }: { locale: Locale }) {
  const t = MARKETING_CONTENT[locale].hero;
  const ar = locale === 'ar';
  const LogoSet=({copy}:{copy:number})=><div className="flex shrink-0 items-center gap-8 pe-8 sm:gap-12 sm:pe-12" aria-hidden={copy>1}>{partnerLogos.map((partner,index)=><div key={`${copy}-${index}`} className="flex h-14 w-24 shrink-0 items-center justify-center sm:h-16 sm:w-32"><img src={partner.src} alt={copy===1?partner.name:''} className="block max-h-full max-w-full object-contain" loading="eager"/></div>)}</div>;

  return (
    <section className="relative -mt-20 flex min-h-[760px] flex-col items-center justify-center overflow-hidden bg-white px-6 pb-52 pt-40 text-center sm:min-h-[800px] sm:pb-56 md:min-h-[860px]">
      <HeroVideo src="/marketing/hero-motion.mp4" className="absolute inset-x-0 top-0 z-0 h-[82%] w-full object-cover sm:h-[83%]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[62%] bg-gradient-to-b from-black/60 via-black/30 to-transparent" />

      <div
        className="pointer-events-none absolute inset-x-0 top-[54%] z-[3] h-[34%] dark:hidden"
        style={{background:'linear-gradient(to bottom,rgba(255,255,255,0) 0%,rgba(255,255,255,.015) 10%,rgba(255,255,255,.05) 20%,rgba(255,255,255,.13) 31%,rgba(255,255,255,.27) 43%,rgba(255,255,255,.46) 56%,rgba(255,255,255,.67) 68%,rgba(255,255,255,.84) 79%,rgba(255,255,255,.95) 89%,#fff 100%)'}}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-[54%] z-[3] hidden h-[34%] dark:block"
        style={{background:'linear-gradient(to bottom,rgba(10,10,10,0) 0%,rgba(10,10,10,.015) 10%,rgba(10,10,10,.05) 20%,rgba(10,10,10,.13) 31%,rgba(10,10,10,.27) 43%,rgba(10,10,10,.46) 56%,rgba(10,10,10,.67) 68%,rgba(10,10,10,.84) 79%,rgba(10,10,10,.95) 89%,#0a0a0a 100%)'}}
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
          <div className="hero-partners-marquee flex w-max" dir="ltr"><LogoSet copy={1}/><LogoSet copy={2}/><LogoSet copy={3}/></div>
        </div>
      </div>
      <style>{`@keyframes heroPartnersMarquee{from{transform:translate3d(0,0,0)}to{transform:translate3d(-33.333333%,0,0)}}.hero-partners-marquee{animation:heroPartnersMarquee 36s linear infinite;will-change:transform}.hero-partners-marquee>div{flex:none}@media (prefers-reduced-motion:reduce){.hero-partners-marquee{animation:none}}`}</style>
    </section>
  );
}
