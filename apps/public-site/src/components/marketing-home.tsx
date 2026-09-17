import type { Locale } from '@/lib/i18n/locales';
import { Hero } from './marketing/hero';
import { HowItWorks } from './marketing/how-it-works';
import { ProductShowcase } from './marketing/product-showcase';
import { FeatureGrid } from './marketing/feature-grid';
import { Pricing } from './marketing/pricing';
import { Faq } from './marketing/faq';
import { FinalCta } from './marketing/final-cta';

function ProblemSection({ locale }: { locale: Locale }) {
  const ar = locale === 'ar';
  const items = ar
    ? [['موقعك', 'اعرض عقاراتك ومشاريعك بهويتك.'], ['عملاؤك', 'بيانات وطلبات مرتبة وواضحة.'], ['متابعتك', 'كل فرصة في مسار واحد.']]
    : [['Your website', 'Show properties and projects under your brand.'], ['Your clients', 'Organized client data and requests.'], ['Your follow-up', 'Every opportunity in one clear flow.']];

  return (
    <section className="bg-white px-5 py-14 sm:px-6 sm:py-18">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-2xl">
          <span className="text-brand text-xs font-bold sm:text-sm">{ar ? 'بدل الأدوات المتفرقة' : 'Instead of scattered tools'}</span>
          <h2 className="text-text-primary mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{ar ? 'كل شغلك العقاري في مكان واحد' : 'Your real-estate work, in one place'}</h2>
          <p className="text-text-secondary mt-3 max-w-xl text-sm leading-7 sm:text-base">{ar ? 'موقعك، عقاراتك، العملاء والطلبات؛ مرتبطة معًا داخل سبعة.' : 'Your website, properties, clients and requests — connected inside Sbaah.'}</p>
        </div>
        <div className="mt-9 grid gap-6 border-t border-black/8 pt-7 sm:grid-cols-3 sm:gap-8">
          {items.map(([title, body], index) => (
            <div key={title} className="relative ps-9 sm:ps-0">
              <span className="text-brand absolute start-0 top-0 text-xs font-bold sm:static sm:mb-3 sm:block">0{index + 1}</span>
              <h3 className="text-text-primary text-base font-bold">{title}</h3>
              <p className="text-text-secondary mt-1 text-sm leading-6">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WebsiteSection({ locale }: { locale: Locale }) {
  const ar = locale === 'ar';
  const bullets = ar ? ['ثيمات قابلة للتخصيص', 'عربي وإنجليزي', 'دومينك الخاص', 'متوافق مع الجوال'] : ['Customizable themes', 'Arabic & English', 'Your own domain', 'Mobile ready'];

  return (
    <section className="bg-neutral-50 px-5 py-14 sm:px-6 sm:py-18">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-2xl">
          <span className="text-brand text-xs font-bold sm:text-sm">{ar ? 'موقعك العقاري' : 'Your website'}</span>
          <h2 className="text-text-primary mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{ar ? 'موقع احترافي باسمك وهويتك' : 'A professional website under your brand'}</h2>
          <p className="text-text-secondary mt-3 max-w-xl text-sm leading-7 sm:text-base">{ar ? 'اختر الثيم، أضف عقاراتك وانشر موقعك. بدون بناء تقني من الصفر.' : 'Choose a theme, add your properties and publish. No building from scratch.'}</p>
        </div>

        <div className="relative mt-8 overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#eee9f3] via-white to-[#f6f3f8] px-4 pb-0 pt-6 sm:px-8 sm:pt-9">
          <div className="mx-auto max-w-4xl rounded-t-2xl border border-black/5 bg-white p-3 shadow-[0_24px_70px_-35px_rgba(72,42,94,.35)] sm:p-4">
            <div className="mb-3 flex gap-1.5"><span className="h-2 w-2 rounded-full bg-neutral-300"/><span className="h-2 w-2 rounded-full bg-neutral-300"/><span className="h-2 w-2 rounded-full bg-neutral-300"/></div>
            <div className="relative aspect-[16/8] overflow-hidden rounded-xl bg-gradient-to-br from-[#182a36] via-[#244759] to-[#54788a] p-5 text-white">
              <div className="h-2.5 w-14 rounded-full bg-white/80"/><div className="mt-8 w-2/3 sm:mt-12"><div className="h-4 rounded bg-white/90"/><div className="mt-2 h-2.5 w-4/5 rounded bg-white/45"/><div className="mt-4 h-7 w-20 rounded-lg bg-white"/></div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 border-b border-black/8 pb-7">
          {bullets.map(item => <div key={item} className="flex items-center gap-2 text-sm font-medium"><span className="bg-brand h-1.5 w-1.5 rounded-full"/>{item}</div>)}
        </div>
      </div>
    </section>
  );
}

function AudienceSection({ locale }: { locale: Locale }) {
  const ar = locale === 'ar';
  const audiences = ar ? [['مطور عقاري', 'اعرض مشاريعك وتابع الفرص.'], ['مسوّق عقاري', 'نظّم مخزونك وعملاءك.'], ['وسيط عقاري', 'ابنِ حضورك وأدر طلباتك.']] : [['Developer', 'Show projects and track opportunities.'], ['Marketer', 'Organize inventory and clients.'], ['Broker', 'Build your presence and manage requests.']];
  return (
    <section className="bg-white px-5 py-14 sm:px-6 sm:py-18">
      <div className="mx-auto max-w-5xl">
        <span className="text-brand text-xs font-bold sm:text-sm">{ar ? 'مصممة للعقار' : 'Built for real estate'}</span>
        <h2 className="text-text-primary mt-2 text-2xl font-bold sm:text-3xl">{ar ? 'سبعة تناسب طريقة عملك' : 'Sbaah fits your workflow'}</h2>
        <div className="mt-8 grid border-y border-black/8 sm:grid-cols-3">
          {audiences.map(([title, body], index) => <div key={title} className={`py-6 ${index > 0 ? 'border-t border-black/8 sm:border-s sm:border-t-0 sm:px-7' : 'sm:pe-7'}`}><h3 className="text-base font-bold">{title}</h3><p className="text-text-secondary mt-1 text-sm leading-6">{body}</p></div>)}
        </div>
      </div>
    </section>
  );
}

const ecosystemNames = [{ar:'الهيئة العامة للعقار',en:'Real Estate General Authority',short:'REGA'},{ar:'فال',en:'FAL',short:'فال'},{ar:'السجل العقاري',en:'Real Estate Registry',short:'RER'},{ar:'إيجار',en:'Ejar',short:'إيجار'},{ar:'صندوق الاستثمارات العامة',en:'Public Investment Fund',short:'PIF'},{ar:'وزارة الاتصالات وتقنية المعلومات',en:'Ministry of Communications and Information Technology',short:'MCIT'}];
function EcosystemSection({locale}:{locale:Locale}) {const ar=locale==='ar';const Set=({copy}:{copy:number})=><div className="flex shrink-0 items-center gap-8 pe-8" aria-hidden={copy===2}>{ecosystemNames.map((item,index)=><div key={`${copy}-${index}`} className="flex h-12 shrink-0 items-center gap-2.5"><div className="text-brand text-[10px] font-bold">{item.short}</div><span className="text-start text-[11px] font-semibold">{ar?item.ar:item.en}</span></div>)}</div>;return <section className="overflow-hidden border-y border-brand/10 bg-[#faf9fb] py-6"><div className="px-5 text-center"><p className="text-brand text-xs font-bold">{ar?'ضمن المنظومة العقارية السعودية':'Saudi real-estate ecosystem'}</p></div><div className="relative mt-4 overflow-hidden"><div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#faf9fb] to-transparent"/><div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#faf9fb] to-transparent"/><div className="sbaah-ecosystem-marquee flex w-max" dir="ltr"><Set copy={1}/><Set copy={2}/></div></div><style>{`@keyframes sbaahEcosystemMarquee{from{transform:translate3d(0,0,0)}to{transform:translate3d(-50%,0,0)}}.sbaah-ecosystem-marquee{animation:sbaahEcosystemMarquee 32s linear infinite;will-change:transform}`}</style></section>}

export function MarketingHome({locale}:{locale:Locale}) {return <div><Hero locale={locale}/><ProblemSection locale={locale}/><ProductShowcase locale={locale}/><WebsiteSection locale={locale}/><FeatureGrid locale={locale}/><HowItWorks locale={locale}/><AudienceSection locale={locale}/><EcosystemSection locale={locale}/><Pricing locale={locale}/><Faq locale={locale}/><FinalCta locale={locale}/></div>}
