import Link from 'next/link';
import type { Locale } from '@/lib/i18n/locales';

const BUSINESS_IMAGE =
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=88';

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
  <path key="crm" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
  <path key="property" d="M4 21h16M6 21V7l6-4 6 4v14M9 10h1M14 10h1M9 14h1M14 14h1M10 21v-4h4v4" />,
  <path key="rent" d="M6 2v4M18 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2ZM8 13h3M8 17h6" />,
];

export function BusinessSuite({ locale }: { locale: Locale }) {
  const ar = locale === 'ar';
  return (
    <section className="overflow-hidden bg-surface-card py-14 sm:py-20">
      <div className="mx-auto grid w-full max-w-7xl items-stretch gap-8 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
        <div className="flex flex-col justify-center py-2">
          <p className="text-brand text-sm font-semibold">{ar ? 'منصة واحدة لأعمالك العقارية' : 'One platform for your real-estate business'}</p>
          <h2 className="font-display mt-3 max-w-xl text-3xl font-semibold leading-tight text-text-primary sm:text-4xl lg:text-5xl">
            {ar ? 'كل أعمالك العقارية في مكان واحد' : 'Your real-estate business, all in one place'}
          </h2>
          <p className="mt-4 max-w-lg text-base leading-7 text-text-secondary sm:text-lg">
            {ar ? 'موقعك، عقاراتك، عملاؤك وتأجيرك. كلها تُدار من سبعة.' : 'Your website, properties, clients and rentals — all managed with Sbaah.'}
          </p>

          <div className="mt-8 grid grid-cols-2 border-y border-border-subtle">
            {items[locale].map(([title, body], index) => (
              <div key={title} className={`min-h-32 py-5 ${index % 2 === 0 ? (ar ? 'pl-4 border-l' : 'pr-4 border-r') : (ar ? 'pr-4' : 'pl-4')} ${index < 2 ? 'border-b' : ''} border-border-subtle`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="text-brand h-6 w-6" aria-hidden="true">{icons[index]}</svg>
                <h3 className="mt-3 text-sm font-semibold text-text-primary sm:text-base">{title}</h3>
                <p className="mt-1 text-xs leading-5 text-text-secondary sm:text-sm">{body}</p>
              </div>
            ))}
          </div>

          <Link href={`/${locale}/register`} className="bg-brand mt-7 inline-flex h-11 w-fit items-center justify-center rounded-xl px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90">
            {ar ? 'ابدأ الآن' : 'Get started'}
          </Link>
        </div>

        <div className="relative min-h-[470px] overflow-hidden rounded-[28px] sm:min-h-[580px] lg:min-h-[650px]">
          <img src={BUSINESS_IMAGE} alt={ar ? 'عقار سكني حديث' : 'Modern residential property'} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          <div className="pointer-events-none absolute inset-y-0 start-0 w-2/5 bg-gradient-to-r from-surface-card/90 to-transparent rtl:bg-gradient-to-l" />
          <div className="absolute inset-x-4 bottom-5 flex flex-wrap items-center justify-center gap-2 sm:inset-x-7 sm:bottom-7">
            {(ar ? ['عقار', 'عميل', 'متابعة', 'تأجير', 'إتمام'] : ['Property', 'Client', 'Follow-up', 'Rental', 'Done']).map((label, index) => (
              <div key={label} className={`rounded-full border px-3 py-2 text-xs font-semibold shadow-sm backdrop-blur-md sm:px-4 sm:text-sm ${index === 4 ? 'border-brand bg-brand text-white' : 'border-white/70 bg-white/90 text-gray-900'}`}>{label}</div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
