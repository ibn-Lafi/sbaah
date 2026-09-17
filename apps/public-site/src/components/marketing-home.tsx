import Image from 'next/image';
import type { Locale } from '@/lib/i18n/locales';
import { Hero } from './marketing/hero';
import { HowItWorks } from './marketing/how-it-works';
import { ProductShowcase } from './marketing/product-showcase';
import { FeatureGrid } from './marketing/feature-grid';
import { Pricing } from './marketing/pricing';
import { Faq } from './marketing/faq';
import { FinalCta } from './marketing/final-cta';

const REALISTIC = {
  professional: '/marketing/realistic/01-real-estate-professional.png',
  website: '/marketing/realistic/02-real-estate-scene.png',
  audience: '/marketing/realistic/03-real-estate-scene.png',
};

function ProblemSection({ locale }: { locale: Locale }) {
  const ar = locale === 'ar';
  const items = ar ? [['إدارة الفرص والطلبات', 'متابعة واضحة من مكان واحد.'], ['إدارة العملاء والعقارات', 'بياناتك مرتبة وسهلة الوصول.'], ['التقارير والتحليلات', 'صورة أوضح لأداء أعمالك.']] : [['Opportunities & requests', 'Clear follow-up in one place.'], ['Clients & properties', 'Organized and easy to access.'], ['Reports & analytics', 'A clearer view of your business.']];
  return <section className="bg-white px-4 py-10 sm:px-6 sm:py-14"><div className="mx-auto grid max-w-5xl items-stretch gap-5 md:grid-cols-2 md:gap-8">
    <div className="order-2 flex flex-col justify-center md:order-1"><span className="text-brand text-[11px] font-bold sm:text-xs">{ar ? 'إدارة أسهل — نتائج أكبر' : 'Simpler management — bigger results'}</span><h2 className="text-text-primary mt-2 text-xl font-bold tracking-tight sm:text-3xl">{ar ? 'منصة متكاملة لنمو أعمالك' : 'An integrated platform for growth'}</h2><p className="text-text-secondary mt-2 text-xs leading-6 sm:text-sm">{ar ? 'كل ما تحتاجه لإدارة عقاراتك وعملائك ومتابعة أعمالك في منصة واحدة سهلة الاستخدام.' : 'Everything you need to manage properties, clients and follow-up in one easy platform.'}</p><div className="mt-4 space-y-2.5">{items.map(([title,body])=><div key={title} className="flex items-start gap-2.5"><span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand/10 text-[10px] font-bold text-brand">✓</span><div><h3 className="text-xs font-bold sm:text-sm">{title}</h3><p className="text-text-secondary mt-0.5 text-[11px] leading-5 sm:text-xs">{body}</p></div></div>)}</div></div>
    <div className="order-1 relative aspect-[1.38/1] overflow-hidden rounded-[1.5rem] md:order-2 md:aspect-[1.18/1]"><Image src={REALISTIC.professional} alt={ar?'محترف عقاري يستخدم سبعة':'Real-estate professional using Sbaah'} fill sizes="(max-width:767px) 100vw, 50vw" className="object-cover" priority={false}/></div>
  </div></section>;
}

function WebsiteSection({ locale }: { locale: Locale }) {
  const ar=locale==='ar'; const bullets=ar?['تصاميم عصرية قابلة للتخصيص','متوافق مع الجوال ومحركات البحث','دعم العربية والإنجليزية','ربط دومين خاص بك']:['Modern customizable designs','Mobile and search friendly','Arabic & English','Connect your own domain'];
  return <section className="bg-[#faf9fb] px-4 py-10 sm:px-6 sm:py-14"><div className="mx-auto grid max-w-5xl items-center gap-5 md:grid-cols-2 md:gap-8">
    <div className="order-2 md:order-1"><span className="text-brand text-[11px] font-bold sm:text-xs">{ar?'موقع عقاري خاص بك':'Your own real-estate website'}</span><h2 className="text-text-primary mt-2 text-xl font-bold tracking-tight sm:text-3xl">{ar?'بشكل احترافي وسريع':'Professional and fast'}</h2><p className="text-text-secondary mt-2 text-xs leading-6 sm:text-sm">{ar?'أنشئ موقعك العقاري في دقائق باختيار تصميم يناسب هويتك، مع إمكانية ربط نطاقك الخاص.':'Launch your property website in minutes with a design that matches your brand.'}</p><div className="mt-4 space-y-2">{bullets.map(item=><div key={item} className="flex items-center gap-2 text-xs font-medium sm:text-sm"><span className="flex h-5 w-5 items-center justify-center rounded-md bg-brand/10 text-[10px] text-brand">✓</span>{item}</div>)}</div></div>
    <div className="order-1 relative aspect-[1.48/1] overflow-hidden rounded-[1.5rem] bg-white shadow-sm md:order-2 md:aspect-[1.3/1]"><Image src={REALISTIC.website} alt={ar?'عرض موقع عقاري احترافي':'Professional real-estate website'} fill sizes="(max-width:767px) 100vw, 50vw" className="object-cover"/></div>
  </div></section>;
}

function AudienceSection({locale}:{locale:Locale}) {
  const ar=locale==='ar';
  const audiences=ar?[['المكاتب العقارية','إدارة متكاملة لعملك'],['المسوقون العقاريون','إدارة العملاء والعروض'],['الوسطاء العقاريون','تنظيم الفرص والمتابعة'],['المطورون العقاريون','إدارة مشاريعهم ومبيعاتهم']]:[['Real-estate offices','Integrated business management'],['Property marketers','Manage clients and listings'],['Real-estate brokers','Organize opportunities'],['Property developers','Manage projects and sales']];
  return <section className="bg-white px-4 py-10 sm:px-6 sm:py-14"><div className="mx-auto max-w-5xl"><div className="mx-auto max-w-2xl text-center"><span className="text-brand text-[11px] font-bold sm:text-xs">{ar?'لجميع العاملين في القطاع العقاري':'For real-estate professionals'}</span><h2 className="text-text-primary mt-2 text-xl font-bold sm:text-3xl">{ar?'مناسب لاحتياجك':'Built around your needs'}</h2><p className="text-text-secondary mt-2 text-xs leading-6 sm:text-sm">{ar?'سواء كنت مطورًا أو وسيطًا أو مسوقًا أو مكتبًا عقاريًا، سبعة تساعدك على النمو.':'Whether you are a developer, broker, marketer or office, Sbaah helps you grow.'}</p></div>
    <div className="mt-6 grid grid-cols-4 gap-2 sm:gap-4">{audiences.map(([title,body],index)=><article key={title} className="overflow-hidden rounded-xl border border-black/7 bg-white shadow-sm"><div className="relative aspect-[.9/1] sm:aspect-[1.25/1]"><Image src={REALISTIC.audience} alt={title} fill sizes="(max-width:640px) 25vw, 240px" className="object-cover" style={{objectPosition:["15% center","40% center","65% center","88% center"][index]}}/></div><div className="p-2 text-center sm:p-3"><h3 className="text-[9px] font-bold leading-4 sm:text-sm">{title}</h3><p className="text-text-secondary mt-0.5 hidden text-[10px] leading-4 sm:block sm:text-xs">{body}</p></div></article>)}</div>
  </div></section>;
}

const ecosystemNames=[{ar:'الهيئة العامة للعقار',en:'Real Estate General Authority',short:'REGA'},{ar:'فال',en:'FAL',short:'فال'},{ar:'السجل العقاري',en:'Real Estate Registry',short:'RER'},{ar:'إيجار',en:'Ejar',short:'إيجار'},{ar:'صندوق الاستثمارات العامة',en:'Public Investment Fund',short:'PIF'},{ar:'وزارة الاتصالات وتقنية المعلومات',en:'Ministry of Communications and Information Technology',short:'MCIT'}];
function EcosystemSection({locale}:{locale:Locale}) {const ar=locale==='ar';const Set=({copy}:{copy:number})=><div className="flex shrink-0 items-center gap-8 pe-8" aria-hidden={copy===2}>{ecosystemNames.map((item,index)=><div key={`${copy}-${index}`} className="flex h-12 shrink-0 items-center gap-2.5"><div className="text-brand text-[10px] font-bold">{item.short}</div><span className="text-start text-[11px] font-semibold">{ar?item.ar:item.en}</span></div>)}</div>;return <section className="overflow-hidden border-y border-brand/10 bg-[#faf9fb] py-6"><div className="px-5 text-center"><p className="text-brand text-xs font-bold">{ar?'ضمن المنظومة العقارية السعودية':'Saudi real-estate ecosystem'}</p></div><div className="relative mt-4 overflow-hidden"><div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#faf9fb] to-transparent"/><div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#faf9fb] to-transparent"/><div className="sbaah-ecosystem-marquee flex w-max" dir="ltr"><Set copy={1}/><Set copy={2}/></div></div><style>{`@keyframes sbaahEcosystemMarquee{from{transform:translate3d(0,0,0)}to{transform:translate3d(-50%,0,0)}}.sbaah-ecosystem-marquee{animation:sbaahEcosystemMarquee 32s linear infinite;will-change:transform}`}</style></section>}

export function MarketingHome({locale}:{locale:Locale}) {return <div><Hero locale={locale}/><ProblemSection locale={locale}/><ProductShowcase locale={locale}/><WebsiteSection locale={locale}/><FeatureGrid locale={locale}/><HowItWorks locale={locale}/><AudienceSection locale={locale}/><EcosystemSection locale={locale}/><Pricing locale={locale}/><Faq locale={locale}/><FinalCta locale={locale}/></div>}
