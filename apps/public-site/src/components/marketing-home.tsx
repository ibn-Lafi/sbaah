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
  const items = ar
    ? [
        ['موقعك العقاري', 'اعرض عقاراتك ومشاريعك بهويتك وفي مكان واحد.'],
        ['العملاء والطلبات', 'نظّم بيانات العملاء واهتماماتهم بدل تشتتها بين المحادثات والملفات.'],
        ['المتابعة والتواصل', 'تابع كل فرصة بوضوح من أول استفسار وحتى إتمام الصفقة.'],
      ]
    : [
        ['Your real-estate website', 'Showcase properties and projects under your own brand.'],
        ['Clients and requests', 'Keep client data and interests organized instead of scattered.'],
        ['Follow-up and communication', 'Track every opportunity clearly from inquiry to closing.'],
      ];

  return (
    <section className="bg-white px-5 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-brand text-sm font-semibold">{ar ? 'لماذا سبعة؟' : 'Why Sbaah?'}</span>
          <h2 className="text-text-primary mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {ar ? 'شغلك العقاري موزّع بين أكثر من مكان؟' : 'Is your real-estate work scattered across different tools?'}
          </h2>
          <p className="text-text-secondary mt-5 text-base leading-8 sm:text-lg">
            {ar
              ? 'موقع في جهة، بيانات العملاء في ملفات، واستفسارات في واتساب. سبعة تجمع الأدوات الأساسية لعملك العقاري في نظام واحد أبسط وأوضح.'
              : 'A website in one place, client data in files, and inquiries in WhatsApp. Sbaah brings the essentials together in one clear workspace.'}
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {items.map(([title, body], index) => (
            <article key={title} className="rounded-3xl border border-black/5 bg-neutral-50 p-6 sm:p-7">
              <div className="text-brand mb-8 flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-sm font-bold">0{index + 1}</div>
              <h3 className="text-text-primary text-lg font-bold">{title}</h3>
              <p className="text-text-secondary mt-2 text-sm leading-7">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function WebsiteSection({ locale }: { locale: Locale }) {
  const ar = locale === 'ar';
  const bullets = ar
    ? ['ثيمات قابلة للتخصيص', 'عربي وإنجليزي', 'نطاق فرعي أو دومين مخصص', 'متوافق مع الجوال']
    : ['Customizable themes', 'Arabic & English', 'Subdomain or custom domain', 'Mobile ready'];

  return (
    <section className="bg-neutral-50 px-5 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <span className="text-brand text-sm font-semibold">{ar ? 'موقعك العقاري' : 'Your real-estate website'}</span>
          <h2 className="text-text-primary mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {ar ? 'موقع عقاري باسمك، بدون البدء من الصفر' : 'A real-estate website under your name, without starting from scratch'}
          </h2>
          <p className="text-text-secondary mt-5 text-base leading-8">
            {ar
              ? 'اختر الثيم المناسب، خصّص الهوية والمحتوى، أضف عقاراتك ومشاريعك، وانشر موقعك على نطاق فرعي أو نطاقك الخاص.'
              : 'Choose a theme, customize your brand and content, add properties and projects, then publish on a subdomain or your own domain.'}
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {bullets.map((item) => <div key={item} className="flex items-center gap-2 text-sm font-medium"><span className="bg-brand h-2 w-2 rounded-full" />{item}</div>)}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[2rem] border border-black/5 bg-white p-4 shadow-xl shadow-black/5 sm:p-7">
          <div className="rounded-2xl border border-black/5 bg-neutral-100 p-3">
            <div className="mb-3 flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-neutral-300"/><span className="h-2.5 w-2.5 rounded-full bg-neutral-300"/><span className="h-2.5 w-2.5 rounded-full bg-neutral-300"/></div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-gradient-to-br from-[#0d2030] via-[#19384d] to-[#2f6274] p-5 text-white">
              <div className="h-3 w-16 rounded-full bg-white/80" />
              <div className="mt-14 max-w-[70%]"><div className="h-5 w-full rounded bg-white/90"/><div className="mt-2 h-3 w-4/5 rounded bg-white/50"/><div className="mt-5 h-8 w-24 rounded-lg bg-white"/></div>
              <div className="absolute bottom-4 end-4 grid w-[42%] grid-cols-2 gap-2"><div className="aspect-square rounded-lg bg-white/15"/><div className="aspect-square rounded-lg bg-white/10"/></div>
            </div>
          </div>
          <div className="absolute -bottom-2 end-5 w-[27%] rounded-[1.4rem] border-[5px] border-neutral-900 bg-white p-1 shadow-xl">
            <div className="aspect-[9/16] rounded-[1rem] bg-gradient-to-b from-[#16374a] to-[#e8eef1]" />
          </div>
        </div>
      </div>
    </section>
  );
}

function AudienceSection({ locale }: { locale: Locale }) {
  const ar = locale === 'ar';
  const audiences = ar
    ? [
        ['المطور العقاري', 'اعرض مشاريعك ونظّم العملاء والفرص من لوحة واحدة.'],
        ['المسوّق العقاري', 'ابنِ حضورك الرقمي واعرض مخزونك وتابع العملاء المحتملين.'],
        ['الوسيط العقاري', 'موقع احترافي وعقارات وطلبات عملاء في مكان واحد.'],
      ]
    : [
        ['Real-estate developer', 'Showcase projects and organize clients and opportunities.'],
        ['Real-estate marketer', 'Build your digital presence, inventory and lead workflow.'],
        ['Real-estate broker', 'A professional website, properties and client requests in one place.'],
      ];
  return (
    <section className="bg-white px-5 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <span className="text-brand text-sm font-semibold">{ar ? 'لمن صُممت سبعة؟' : 'Who is Sbaah for?'}</span>
          <h2 className="text-text-primary mt-3 text-3xl font-bold sm:text-4xl">{ar ? 'سبعة مبنية للعمل العقاري' : 'Built for real-estate work'}</h2>
          <p className="text-text-secondary mt-4 leading-8">{ar ? 'سواء كنت تعمل بشكل فردي أو ضمن منشأة، الأدوات تتكيف مع طريقة عملك.' : 'Whether you work independently or within a company, the tools adapt to your workflow.'}</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {audiences.map(([title, body]) => <article key={title} className="rounded-3xl border border-black/5 p-7"><div className="bg-brand/10 mb-8 h-12 w-12 rounded-2xl"/><h3 className="text-lg font-bold">{title}</h3><p className="text-text-secondary mt-2 text-sm leading-7">{body}</p></article>)}
        </div>
      </div>
    </section>
  );
}

function EcosystemSection({ locale }: { locale: Locale }) {
  const ar = locale === 'ar';
  const names = ar
    ? ['الهيئة العامة للعقار', 'فال', 'السجل العقاري', 'إيجار', 'صندوق الاستثمارات العامة', 'وزارة الاتصالات وتقنية المعلومات']
    : ['Real Estate General Authority', 'FAL', 'Real Estate Registry', 'Ejar', 'Public Investment Fund', 'Ministry of Communications and Information Technology'];
  return (
    <section className="border-y border-black/5 bg-neutral-50 px-5 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl text-center">
        <span className="text-brand text-sm font-semibold">{ar ? 'المنظومة العقارية والتقنية' : 'Real-estate & technology ecosystem'}</span>
        <h2 className="text-text-primary mt-3 text-2xl font-bold sm:text-3xl">{ar ? 'نعمل ضمن منظومة سعودية متكاملة' : 'Part of an integrated Saudi ecosystem'}</h2>
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {names.map((name) => <div key={name} className="flex min-h-24 items-center justify-center rounded-2xl border border-black/5 bg-white px-4 text-center text-sm font-semibold text-neutral-700 shadow-sm">{name}</div>)}
        </div>
      </div>
    </section>
  );
}

/** سبعة's own marketing homepage content — isolated from tenant sites. */
export function MarketingHome({ locale }: { locale: Locale }) {
  return (
    <div>
      <Hero locale={locale} />
      <ProblemSection locale={locale} />
      <WebsiteSection locale={locale} />
      <ProductShowcase locale={locale} />
      <FeatureGrid locale={locale} />
      <HowItWorks locale={locale} />
      <AudienceSection locale={locale} />
      <Comparison locale={locale} />
      <EcosystemSection locale={locale} />
      <Pricing locale={locale} />
      <Faq locale={locale} />
      <FinalCta locale={locale} />
    </div>
  );
}
