import Image from 'next/image';
import type { Locale } from '@/lib/i18n/locales';
import { Hero } from './marketing/hero';
import { HowItWorks } from './marketing/how-it-works';
import { ProductShowcase } from './marketing/product-showcase';
import { FeatureGrid } from './marketing/feature-grid';
import { Pricing } from './marketing/pricing';
import { Faq } from './marketing/faq';

const REALISTIC = {
  professional: '/marketing/realistic/01-real-estate-professional.png',
  website: '/marketing/realistic/02-real-estate-scene.png',
  audience: '/marketing/realistic/03-real-estate-scene.png',
};

function ProblemSection({ locale }: { locale: Locale }) {
  const ar = locale === 'ar';
  const items: [string, string][] = ar ? [['إدارة الفرص والطلبات', 'متابعة واضحة من مكان واحد.'], ['إدارة العملاء والعقارات', 'بياناتك مرتبة وسهلة الوصول.'], ['التقارير والتحليلات', 'صورة أوضح لأداء أعمالك.']] : [['Opportunities & requests', 'Clear follow-up in one place.'], ['Clients & properties', 'Organized and easy to access.'], ['Reports & analytics', 'A clearer view of your business.']];
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
  const audiences: [string, string][] = ar?[['المكاتب العقارية','إدارة متكاملة لعملك'],['المسوقون العقاريون','إدارة العملاء والعروض'],['الوسطاء العقاريون','تنظيم الفرص والمتابعة'],['المطورون العقاريون','إدارة مشاريعهم ومبيعاتهم']]:[['Real-estate offices','Integrated business management'],['Property marketers','Manage clients and listings'],['Real-estate brokers','Organize opportunities'],['Property developers','Manage projects and sales']];
  const audiencePositions: string[] = ['15% center','40% center','65% center','88% center'];
  return <section className="bg-white px-4 py-10 sm:px-6 sm:py-14"><div className="mx-auto max-w-5xl"><div className="mx-auto max-w-2xl text-center"><span className="text-brand text-[11px] font-bold sm:text-xs">{ar?'لجميع العاملين في القطاع العقاري':'For real-estate professionals'}</span><h2 className="text-text-primary mt-2 text-xl font-bold sm:text-3xl">{ar?'مناسب لاحتياجك':'Built around your needs'}</h2><p className="text-text-secondary mt-2 text-xs leading-6 sm:text-sm">{ar?'سواء كنت مطورًا أو وسيطًا أو مسوقًا أو مكتبًا عقاريًا، سبعة تساعدك على النمو.':'Whether you are a developer, broker, marketer or office, Sbaah helps you grow.'}</p></div>
    <div className="mt-6 grid grid-cols-4 gap-2 sm:gap-4">{audiences.map(([title,body],index)=>{const objectPosition: string = audiencePositions[index] || 'center'; return <article key={title} className="overflow-hidden rounded-xl border border-black/7 bg-white shadow-sm"><div className="relative aspect-[.9/1] sm:aspect-[1.25/1]"><Image src={REALISTIC.audience} alt={title} fill sizes="(max-width:640px) 25vw, 240px" className="object-cover" style={{objectPosition}}/></div><div className="p-2 text-center sm:p-3"><h3 className="text-[9px] font-bold leading-4 sm:text-sm">{title}</h3><p className="text-text-secondary mt-0.5 hidden text-[10px] leading-4 sm:block sm:text-xs">{body}</p></div></article>})}</div>
  </div></section>;
}

const partnerLogos = [
  {name:'إيجار',src:'https://raw.githubusercontent.com/ibn-Lafi/sbaah/acb83df10149cec7ec79ff779a99819a40ec3e17/شعار ايجار الجديد بدقة عالية svg - png.svg'},
  {name:'فال',src:'https://raw.githubusercontent.com/ibn-Lafi/sbaah/acb83df10149cec7ec79ff779a99819a40ec3e17/شعار فال للوساطة والتسويق العقاري بدقة عالية svg - png.svg'},
  {name:'الهيئة العامة للعقار',src:'https://raw.githubusercontent.com/ibn-Lafi/sbaah/acb83df10149cec7ec79ff779a99819a40ec3e17/شعار الهيئة العامة للعقار بدقة عالية svg - png.svg'},
  {name:'السجل العقاري',src:'https://raw.githubusercontent.com/ibn-Lafi/sbaah/acb83df10149cec7ec79ff779a99819a40ec3e17/شعار السجل العقاري بدقة عالية svg - png.svg'},
  {name:'المركز السعودي للتحكيم العقاري',src:'https://raw.githubusercontent.com/ibn-Lafi/sbaah/acb83df10149cec7ec79ff779a99819a40ec3e17/شعار المركز السعودي للتحكيم العقار بدقة عالية svg - png.svg'},
  {name:'تقدم',src:'https://raw.githubusercontent.com/ibn-Lafi/sbaah/acb83df10149cec7ec79ff779a99819a40ec3e17/شعار تقدم بدقة عالية svg - png.svg'},
];

function EcosystemSection({locale}:{locale:Locale}) {
  const ar=locale==='ar';
  const LogoSet=({copy}:{copy:number})=><div className="flex shrink-0 items-center gap-14 pe-14 sm:gap-20 sm:pe-20" aria-hidden={copy===2}>{partnerLogos.map((partner,index)=><div key={`${copy}-${index}`} className="flex h-20 w-32 shrink-0 items-center justify-center sm:h-24 sm:w-44"><img src={partner.src} alt={copy===1?partner.name:''} className="max-h-16 max-w-full object-contain sm:max-h-20" loading="lazy"/></div>)}</div>;
  return <section className="overflow-hidden bg-white py-12 sm:py-16"><div className="mx-auto max-w-5xl px-5"><div className="flex items-center justify-end gap-3"><span className="text-brand text-lg font-medium">←</span><h2 className="text-text-secondary text-lg font-semibold sm:text-xl">{ar?'شركاء النجاح':'Success partners'}</h2></div></div><div className="relative mt-8 overflow-hidden sm:mt-10"><div className="partners-marquee flex w-max" dir="ltr"><LogoSet copy={1}/><LogoSet copy={2}/></div></div><style>{`@keyframes partnersMarquee{from{transform:translate3d(0,0,0)}to{transform:translate3d(-50%,0,0)}}.partners-marquee{animation:partnersMarquee 28s linear infinite;will-change:transform}@media (prefers-reduced-motion:reduce){.partners-marquee{animation:none}}`}</style></section>;
}

export function MarketingHome({locale}:{locale:Locale}) {return <div><Hero locale={locale}/><ProblemSection locale={locale}/><ProductShowcase locale={locale}/><WebsiteSection locale={locale}/><FeatureGrid locale={locale}/><HowItWorks locale={locale}/><AudienceSection locale={locale}/><EcosystemSection locale={locale}/><Pricing locale={locale}/><Faq locale={locale}/></div>}
