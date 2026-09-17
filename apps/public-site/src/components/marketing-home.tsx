import type { Locale } from '@/lib/i18n/locales';
import { Hero } from './marketing/hero';
import { HowItWorks } from './marketing/how-it-works';
import { ProductShowcase } from './marketing/product-showcase';
import { FeatureGrid } from './marketing/feature-grid';
import { Comparison } from './marketing/comparison';
import { Pricing } from './marketing/pricing';
import { Faq } from './marketing/faq';
import { FinalCta } from './marketing/final-cta';

function ProblemSection({ locale }: { locale: Locale }) {
  const ar = locale === 'ar';
  const items = ar ? [['موقعك العقاري','اعرض عقاراتك ومشاريعك بهويتك وفي مكان واحد.'],['العملاء والطلبات','نظّم بيانات العملاء واهتماماتهم بدل تشتتها بين المحادثات والملفات.'],['المتابعة والتواصل','تابع كل فرصة بوضوح من أول استفسار وحتى إتمام الصفقة.']] : [['Your real-estate website','Showcase properties and projects under your own brand.'],['Clients and requests','Keep client data and interests organized instead of scattered.'],['Follow-up and communication','Track every opportunity clearly from inquiry to closing.']];
  return <section className="bg-white px-5 py-20 sm:px-6 lg:py-28"><div className="mx-auto max-w-6xl"><div className="mx-auto max-w-3xl text-center"><span className="text-brand text-sm font-semibold">{ar?'لماذا سبعة؟':'Why Sbaah?'}</span><h2 className="text-text-primary mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{ar?'شغلك العقاري موزّع بين أكثر من مكان؟':'Is your real-estate work scattered across different tools?'}</h2><p className="text-text-secondary mt-5 text-base leading-8 sm:text-lg">{ar?'موقع في جهة، بيانات العملاء في ملفات، واستفسارات في واتساب. سبعة تجمع الأدوات الأساسية لعملك العقاري في نظام واحد أبسط وأوضح.':'A website in one place, client data in files, and inquiries in WhatsApp. Sbaah brings the essentials together in one clear workspace.'}</p></div><div className="mt-12 grid gap-4 md:grid-cols-3">{items.map(([title,body],index)=><article key={title} className="rounded-3xl border border-black/5 bg-neutral-50 p-6 sm:p-7"><div className="text-brand mb-8 flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-sm font-bold">0{index+1}</div><h3 className="text-text-primary text-lg font-bold">{title}</h3><p className="text-text-secondary mt-2 text-sm leading-7">{body}</p></article>)}</div></div></section>;
}

function WebsiteSection({ locale }: { locale: Locale }) {
  const ar=locale==='ar'; const bullets=ar?['ثيمات قابلة للتخصيص','عربي وإنجليزي','نطاق فرعي أو دومين مخصص','متوافق مع الجوال']:['Customizable themes','Arabic & English','Subdomain or custom domain','Mobile ready'];
  return <section className="bg-neutral-50 px-5 py-20 sm:px-6 lg:py-28"><div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2"><div><span className="text-brand text-sm font-semibold">{ar?'موقعك العقاري':'Your real-estate website'}</span><h2 className="text-text-primary mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{ar?'موقع عقاري باسمك، بدون البدء من الصفر':'A real-estate website under your name, without starting from scratch'}</h2><p className="text-text-secondary mt-5 text-base leading-8">{ar?'اختر الثيم المناسب، خصّص الهوية والمحتوى، أضف عقاراتك ومشاريعك، وانشر موقعك على نطاق فرعي أو نطاقك الخاص.':'Choose a theme, customize your brand and content, add properties and projects, then publish on a subdomain or your own domain.'}</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{bullets.map(item=><div key={item} className="flex items-center gap-2 text-sm font-medium"><span className="bg-brand h-2 w-2 rounded-full"/>{item}</div>)}</div></div><div className="relative overflow-hidden rounded-[2rem] border border-black/5 bg-white p-4 shadow-xl shadow-black/5 sm:p-7"><div className="rounded-2xl border border-black/5 bg-neutral-100 p-3"><div className="mb-3 flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-neutral-300"/><span className="h-2.5 w-2.5 rounded-full bg-neutral-300"/><span className="h-2.5 w-2.5 rounded-full bg-neutral-300"/></div><div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-gradient-to-br from-[#0d2030] via-[#19384d] to-[#2f6274] p-5 text-white"><div className="h-3 w-16 rounded-full bg-white/80"/><div className="mt-14 max-w-[70%]"><div className="h-5 w-full rounded bg-white/90"/><div className="mt-2 h-3 w-4/5 rounded bg-white/50"/><div className="mt-5 h-8 w-24 rounded-lg bg-white"/></div><div className="absolute bottom-4 end-4 grid w-[42%] grid-cols-2 gap-2"><div className="aspect-square rounded-lg bg-white/15"/><div className="aspect-square rounded-lg bg-white/10"/></div></div></div><div className="absolute -bottom-2 end-5 w-[27%] rounded-[1.4rem] border-[5px] border-neutral-900 bg-white p-1 shadow-xl"><div className="aspect-[9/16] rounded-[1rem] bg-gradient-to-b from-[#16374a] to-[#e8eef1]"/></div></div></div></section>;
}

function AudienceSection({locale}:{locale:Locale}) { const ar=locale==='ar'; const audiences=ar?[['المطور العقاري','اعرض مشاريعك ونظّم العملاء والفرص من لوحة واحدة.'],['المسوّق العقاري','ابنِ حضورك الرقمي واعرض مخزونك وتابع العملاء المحتملين.'],['الوسيط العقاري','موقع احترافي وعقارات وطلبات عملاء في مكان واحد.']]:[['Real-estate developer','Showcase projects and organize clients and opportunities.'],['Real-estate marketer','Build your digital presence, inventory and lead workflow.'],['Real-estate broker','A professional website, properties and client requests in one place.']]; return <section className="bg-white px-5 py-20 sm:px-6 lg:py-28"><div className="mx-auto max-w-6xl"><div className="max-w-2xl"><span className="text-brand text-sm font-semibold">{ar?'لمن صُممت سبعة؟':'Who is Sbaah for?'}</span><h2 className="text-text-primary mt-3 text-3xl font-bold sm:text-4xl">{ar?'سبعة مبنية للعمل العقاري':'Built for real-estate work'}</h2><p className="text-text-secondary mt-4 leading-8">{ar?'سواء كنت تعمل بشكل فردي أو ضمن منشأة، الأدوات تتكيف مع طريقة عملك.':'Whether you work independently or within a company, the tools adapt to your workflow.'}</p></div><div className="mt-10 grid gap-4 md:grid-cols-3">{audiences.map(([title,body])=><article key={title} className="rounded-3xl border border-black/5 p-7"><div className="bg-brand/10 mb-8 h-12 w-12 rounded-2xl"/><h3 className="text-lg font-bold">{title}</h3><p className="text-text-secondary mt-2 text-sm leading-7">{body}</p></article>)}</div></div></section>; }

const ecosystemLogos = [
  { ar:'الهيئة العامة للعقار', en:'Real Estate General Authority', src:'https://rega.gov.sa/media/i5ldldee/image-3.png' },
  { ar:'فال', en:'FAL', src:'https://logo.clearbit.com/rega.gov.sa' },
  { ar:'السجل العقاري', en:'Real Estate Registry', src:'https://logo.clearbit.com/rer.sa' },
  { ar:'إيجار', en:'Ejar', src:'https://logo.clearbit.com/ejar.sa' },
  { ar:'صندوق الاستثمارات العامة', en:'Public Investment Fund', src:'https://logo.clearbit.com/pif.gov.sa' },
  { ar:'وزارة الاتصالات وتقنية المعلومات', en:'Ministry of Communications and Information Technology', src:'https://logo.clearbit.com/mcit.gov.sa' },
];

function EcosystemSection({locale}:{locale:Locale}) {
  const ar=locale==='ar';
  const logos=[...ecosystemLogos,...ecosystemLogos];
  return <section className="overflow-hidden border-y border-black/5 bg-white py-16 sm:py-20">
    <div className="mx-auto max-w-6xl px-5 text-center sm:px-6">
      <span className="text-brand text-sm font-semibold">{ar?'الشركاء':'Partners'}</span>
      <h2 className="text-text-primary mt-3 text-2xl font-bold sm:text-3xl">{ar?'شركاؤنا في المنظومة العقارية والتقنية':'Our real-estate and technology ecosystem partners'}</h2>
    </div>
    <div className="relative mt-10">
      <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-16 bg-gradient-to-e from-transparent to-white sm:w-32"/>
      <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-16 bg-gradient-to-s from-transparent to-white sm:w-32"/>
      <div className="sbaah-logo-marquee flex w-max items-center gap-5 pe-5" dir="ltr">
        {logos.map((logo,index)=><div key={`${logo.en}-${index}`} className="flex h-28 w-52 shrink-0 items-center justify-center rounded-2xl border border-black/[0.06] bg-white px-7 shadow-[0_6px_24px_rgba(0,0,0,0.04)] sm:h-32 sm:w-60">
          {/* eslint-disable-next-line @next/next/no-img-element -- official/brand logo assets are served from their source domains */}
          <img src={logo.src} alt={ar?logo.ar:logo.en} className="max-h-16 max-w-[170px] object-contain sm:max-h-[72px] sm:max-w-[190px]" loading="lazy" />
        </div>)}
      </div>
    </div>
    <style>{`@keyframes sbaahLogoMarquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}.sbaah-logo-marquee{animation:sbaahLogoMarquee 28s linear infinite}.sbaah-logo-marquee:hover{animation-play-state:paused}@media(prefers-reduced-motion:reduce){.sbaah-logo-marquee{animation:none}}`}</style>
  </section>;
}

/** سبعة's own marketing homepage content — isolated from tenant sites. */
export function MarketingHome({locale}:{locale:Locale}) { return <div><Hero locale={locale}/><ProblemSection locale={locale}/><WebsiteSection locale={locale}/><ProductShowcase locale={locale}/><FeatureGrid locale={locale}/><HowItWorks locale={locale}/><AudienceSection locale={locale}/><Comparison locale={locale}/><EcosystemSection locale={locale}/><Pricing locale={locale}/><Faq locale={locale}/><FinalCta locale={locale}/></div>; }
