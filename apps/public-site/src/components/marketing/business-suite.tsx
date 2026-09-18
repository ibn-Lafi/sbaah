import Link from 'next/link';
import type { Locale } from '@/lib/i18n/locales';

const BUSINESS_IMAGE =
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=90';

const items = {
  ar: [
    ['موقعك العقاري', 'بهويتك ونطاقك'],
    ['إدارة العملاء', 'CRM لمتابعة عملائك'],
    ['إدارة العقارات', 'عقاراتك ومشاريعك'],
    ['متابعة التأجير', 'العقود والاستحقاقات'],
  ],
  en: [
    ['Real-estate website', 'Your brand and domain'],
    ['Client management', 'CRM for client follow-up'],
    ['Property management', 'Properties and projects'],
    ['Rental follow-up', 'Contracts and dues'],
  ],
} as const;

const icons = [
  <path key="site" d="M3 10.5 12 3l9 7.5M5.5 9v11h13V9M9 20v-6h6v6" />,
  <path key="crm" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
  <path key="property" d="M4 21h16M6 21V7l6-4 6 4v14M9 10h1M14 10h1M9 14h1M14 14h1M10 21v-4h4v4" />,
  <path key="rent" d="M6 2v4M18 2v4M3 9h18M5 4h14a2 2 0 0 1 2-2ZM8 13h3M8 17h6" />,
];

export function BusinessSuite({ locale }: { locale: Locale }) {
  const ar = locale === 'ar';
  const flow = ar ? ['موقعك العقاري', 'إدارة العملاء', 'إدارة العقارات', 'متابعة التأجير', 'إتمام'] : ['Website', 'Clients', 'Properties', 'Rentals', 'Done'];

  return (
    <section className="relative overflow-hidden bg-surface-card pb-12 pt-14 sm:pb-16 sm:pt-20">
      <div className="relative z-20 mx-auto max-w-6xl px-5 text-center sm:px-6">
        <p className="text-brand text-sm font-semibold">{ar ? 'منصة واحدة لأعمالك العقارية' : 'One platform for your real-estate business'}</p>
        <h2 className="font-display mx-auto mt-3 max-w-3xl text-3xl font-semibold leading-tight text-text-primary sm:text-4xl lg:text-5xl">
          {ar ? 'كل أعمالك العقارية في مكان واحد' : 'Your real-estate business, all in one place'}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-text-secondary sm:text-lg">
          {ar ? 'موقعك، عقاراتك، عملاؤك وتأجيرك. كلها تُدار من سبعة.' : 'Your website, properties, clients and rentals — all managed with Sbaah.'}
        </p>

        <div className="mx-auto mt-9 grid max-w-5xl grid-cols-2 border-y border-border-subtle md:grid-cols-4 md:border-y-0">
          {items[locale].map(([title, body], index) => (
            <div key={title} className={`flex min-h-32 flex-col items-center justify-center px-3 py-5 ${index < 2 ? 'border-b md:border-b-0' : ''} ${index % 2 === 0 ? (ar ? 'border-l' : 'border-r') : ''} md:border-b-0 md:border-border-subtle ${index !== items[locale].length - 1 ? (ar ? 'md:border-l' : 'md:border-r') : 'md:border-0'} border-border-subtle`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="text-brand h-7 w-7" aria-hidden="true">{icons[index]}</svg>
              <h3 className="mt-3 text-sm font-semibold text-text-primary sm:text-base">{title}</h3>
              <p className="mt-1 text-xs text-text-secondary sm:text-sm">{body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative -mt-5 min-h-[520px] w-full sm:min-h-[650px] lg:min-h-[720px]">
        <img src={BUSINESS_IMAGE} alt={ar ? 'عقار سكني حديث' : 'Modern residential property'} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-44 sm:h-56" style={{background:'linear-gradient(to bottom,var(--color-surface-card) 0%,color-mix(in srgb,var(--color-surface-card) 94%,transparent) 22%,color-mix(in srgb,var(--color-surface-card) 68%,transparent) 52%,transparent 100%)'}} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-52 sm:h-64" style={{background:'linear-gradient(to top,var(--color-surface-card) 0%,color-mix(in srgb,var(--color-surface-card) 96%,transparent) 18%,color-mix(in srgb,var(--color-surface-card) 72%,transparent) 50%,transparent 100%)'}} />

        <div className="absolute inset-x-0 top-[38%] z-20 mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-2 px-4 sm:top-[42%] sm:gap-4">
          {flow.map((label, index) => (
            <div key={label} className={`rounded-full border px-3 py-2 text-xs font-semibold shadow-md backdrop-blur-md sm:px-5 sm:py-2.5 sm:text-sm ${index === flow.length - 1 ? 'border-brand bg-brand text-white' : 'border-white/80 bg-white/90 text-gray-900'}`}>
              {label}
            </div>
          ))}
        </div>

        <div className="absolute inset-x-0 bottom-10 z-20 flex flex-col items-center px-5 sm:bottom-14">
          <Link href={`/${locale}/register`} className="bg-brand inline-flex h-11 min-w-40 items-center justify-center rounded-xl px-7 text-sm font-semibold text-white transition-opacity hover:opacity-90">
            {ar ? 'ابدأ الآن' : 'Get started'}
          </Link>
          <p className="mt-3 text-xs font-medium text-text-secondary sm:text-sm">{ar ? 'خطوتك الأولى نحو إدارة عقارية أكثر احترافية' : 'Your first step toward more professional real-estate management'}</p>
        </div>
      </div>
    </section>
  );
}
