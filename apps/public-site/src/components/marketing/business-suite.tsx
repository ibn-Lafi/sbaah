import type { Locale } from '@/lib/i18n/locales';

const BUSINESS_IMAGE =
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=90';

const items = {
  ar: [
    ['موقعك الإلكتروني', 'بهويتك ونطاقك'],
    ['إدارة العملاء', 'CRM لمتابعة عملائك'],
    ['إدارة العقارات', 'عقاراتك ومشاريعك'],
    ['سبعة AI', 'مساعد ذكي ينجز معك'],
  ],
  en: [
    ['Your website', 'Your brand and domain'],
    ['Client management', 'CRM for client follow-up'],
    ['Property management', 'Properties and projects'],
    ['Sbaah AI', 'A smart assistant that gets work done with you'],
  ],
} as const;

const icons = [
  <path key="site" d="M3 10.5 12 3l9 7.5M5.5 9v11h13V9M9 20v-6h6v6" />,
  <path key="crm" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
  <path key="property" d="M4 21h16M6 21V7l6-4 6 4v14M9 10h1M14 10h1M9 14h1M14 14h1M10 21v-4h4v4" />,
  <path key="ai" d="M12 3l1.25 3.25L16.5 7.5l-3.25 1.25L12 12l-1.25-3.25L7.5 7.5l3.25-1.25L12 3ZM18.5 12l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2ZM6 13l1 2.5 2.5 1-2.5 1L6 20l-1-2.5-2.5-1 2.5-1L6 13Z" />,
];

export function BusinessSuite({ locale }: { locale: Locale }) {
  const ar = locale === 'ar';
  return (
    <section className="relative overflow-hidden bg-surface-card pb-12 pt-14 sm:pb-16 sm:pt-20">
      <div className="relative z-20 mx-auto max-w-6xl px-5 text-center sm:px-6">
        <p className="text-brand text-sm font-semibold">{ar ? 'منصة واحدة لأعمالك العقارية' : 'One platform for your real-estate business'}</p>
        <h2 className="font-display mx-auto mt-3 max-w-3xl text-2xl font-semibold leading-tight text-text-primary sm:text-4xl lg:text-5xl">
          {ar ? 'كل أعمالك العقارية في مكان واحد' : 'Your real-estate business, all in one place'}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-text-secondary sm:text-lg">
          {ar ? 'موقعك، عقاراتك، عملاؤك وتأجيرك. كلها تُدار من سبعة.' : 'Your website, properties, clients and rentals — all managed with Sbaah.'}
        </p>

        <div className="mx-auto mt-9 grid max-w-xl grid-cols-2">
          {items[locale].map(([title, body], index) => (
            <div
              key={title}
              className={`flex min-h-36 flex-col items-center justify-center px-5 py-6 ${index % 2 === 0 ? (ar ? 'border-l' : 'border-r') : ''} ${index < 2 ? 'border-b' : ''} border-border-subtle sm:min-h-40`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="text-brand h-8 w-8" aria-hidden="true">{icons[index]}</svg>
              <h3 className="mt-4 text-base font-bold leading-7 text-text-primary sm:text-lg">{title}</h3>
              <p className="mt-1 max-w-40 text-sm leading-6 text-text-secondary">{body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-0 min-h-[520px] w-full sm:min-h-[650px] lg:min-h-[720px]">
        <img src={BUSINESS_IMAGE} alt={ar ? 'عقار سكني حديث' : 'Modern residential property'} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-44 sm:h-56" style={{background:'linear-gradient(to bottom,var(--color-surface-card) 0%,color-mix(in srgb,var(--color-surface-card) 94%,transparent) 22%,color-mix(in srgb,var(--color-surface-card) 68%,transparent) 52%,transparent 100%)'}} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-52 sm:h-64" style={{background:'linear-gradient(to top,var(--color-surface-card) 0%,color-mix(in srgb,var(--color-surface-card) 96%,transparent) 18%,color-mix(in srgb,var(--color-surface-card) 72%,transparent) 50%,transparent 100%)'}} />

      </div>
    </section>
  );
}
