import type { Locale } from '@/lib/i18n/locales';

const testimonials = {
  ar: [
    { type: 'فرد', role: 'مسوق عقاري', name: 'عميل سبعة', quote: 'أضف رأي العميل الموثّق هنا.', kind: 'person' },
    { type: 'شركة', role: 'مطور عقاري', name: 'شركة عقارية', quote: 'أضف رأي الشركة الموثّق هنا.', kind: 'company' },
    { type: 'فرد', role: 'وسيط عقاري', name: 'عميل سبعة', quote: 'أضف رأي العميل الموثّق هنا.', kind: 'person' },
    { type: 'شركة', role: 'مسوق عقاري', name: 'شركة عقارية', quote: 'أضف رأي الشركة الموثّق هنا.', kind: 'company' },
    { type: 'فرد', role: 'مطور عقاري', name: 'عميل سبعة', quote: 'أضف رأي العميل الموثّق هنا.', kind: 'person' },
    { type: 'شركة', role: 'وسيط عقاري', name: 'شركة عقارية', quote: 'أضف رأي الشركة الموثّق هنا.', kind: 'company' },
  ],
  en: [
    { type: 'Individual', role: 'Real-estate marketer', name: 'Sbaah customer', quote: 'Add the verified customer testimonial here.', kind: 'person' },
    { type: 'Company', role: 'Real-estate developer', name: 'Real-estate company', quote: 'Add the verified company testimonial here.', kind: 'company' },
    { type: 'Individual', role: 'Real-estate broker', name: 'Sbaah customer', quote: 'Add the verified customer testimonial here.', kind: 'person' },
    { type: 'Company', role: 'Real-estate marketer', name: 'Real-estate company', quote: 'Add the verified company testimonial here.', kind: 'company' },
    { type: 'Individual', role: 'Real-estate developer', name: 'Sbaah customer', quote: 'Add the verified customer testimonial here.', kind: 'person' },
    { type: 'Company', role: 'Real-estate broker', name: 'Real-estate company', quote: 'Add the verified company testimonial here.', kind: 'company' },
  ],
} as const;

function CustomerMark({ kind }: { kind: 'person' | 'company' }) {
  return (
    <div className="bg-brand/10 text-brand flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" aria-hidden="true">
      {kind === 'person' ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.5-4 2.8-6 7-6s6.5 2 7 6"/></svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6"><path d="M4 21h16M6 21V6h12v15M9 9h2m2 0h2M9 13h2m2 0h2M10 21v-4h4v4"/></svg>
      )}
    </div>
  );
}

export function Testimonials({ locale }: { locale: Locale }) {
  const ar = locale === 'ar';
  return (
    <section className="bg-surface-card px-5 py-14 sm:px-6 sm:py-20" aria-labelledby="testimonials-title">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-brand text-sm font-semibold">{ar ? 'تجارب من القطاع العقاري' : 'Experiences from real estate'}</p>
          <h2 id="testimonials-title" className="font-display mt-3 text-3xl font-semibold text-text-primary sm:text-4xl">
            {ar ? 'آراء عملاء سبعة' : 'What Sbaah customers say'}
          </h2>
          <p className="mt-3 text-sm text-text-secondary sm:text-base">
            {ar ? 'مساحة لعرض تجارب موثّقة من الأفراد والشركات من المسوقين والمطورين والوسطاء العقاريين.' : 'A place for verified experiences from individual and company marketers, developers and brokers.'}
          </p>
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials[locale].map((item, index) => (
            <article key={index} className="flex min-h-56 flex-col rounded-3xl border border-border-subtle bg-surface-card p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <CustomerMark kind={item.kind} />
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-text-primary sm:text-base">{item.name}</h3>
                  <p className="mt-0.5 text-xs text-text-secondary">{item.role} · {item.type}</p>
                </div>
              </div>
              <div className="text-brand mt-5 text-3xl font-semibold leading-none" aria-hidden="true">“</div>
              <p className="mt-2 flex-1 text-sm leading-7 text-text-secondary sm:text-[15px]">{item.quote}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
