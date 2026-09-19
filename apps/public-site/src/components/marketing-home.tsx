import Link from 'next/link';
import type { Locale } from '@/lib/i18n/locales';
import { Hero } from './marketing/hero';
import { Pricing } from './marketing/pricing';
import { BusinessSuite } from './marketing/business-suite';
import { Testimonials } from './marketing/testimonials';
import { Faq } from './marketing/faq';

const CTA_BANNER_SRC =
  'https://raw.githubusercontent.com/ibn-Lafi/sbaah/claude/real-estate-saas-platform-sp7ua9/94C5E88E-C4C6-4C9A-B942-B3D8FD5D58F8.jpeg';

function CtaBanner({ locale }: { locale: Locale }) {
  return (
    <section className="w-full bg-surface-card py-8 sm:py-10">
      <div className="w-full overflow-hidden">
        <div className="w-full">
          <img
            src={CTA_BANNER_SRC}
            alt=""
            className="block h-auto w-full"
            loading="lazy"
          />
        </div>
      </div>
      <div className="mx-auto mt-5 flex w-full max-w-3xl items-center justify-center gap-2 px-4 sm:gap-3">
        <a href="https://wa.me/966542400331" target="_blank" rel="noopener noreferrer" className="border-brand text-brand inline-flex h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-2 text-[11px] font-semibold transition-colors hover:bg-brand/5 sm:flex-none sm:px-5 sm:text-sm"><svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 flex-none" aria-hidden="true"><path d="M12 2a9.7 9.7 0 0 0-8.4 14.55L2.2 21.8l5.38-1.4A9.8 9.8 0 1 0 12 2Zm0 17.8a8 8 0 0 1-4.08-1.12l-.29-.17-3.19.83.85-3.1-.19-.31A8 8 0 1 1 12 19.8Zm4.4-5.98c-.24-.12-1.43-.7-1.65-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2a7.3 7.3 0 0 1-1.34-1.67c-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.51.1.46-.07 1.43-.59 1.63-1.15.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z"/></svg>{locale === 'ar' ? 'واتس اب' : 'WhatsApp'}</a>
        <Link href={`/${locale}/support`} className="bg-brand inline-flex h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2 text-[11px] font-semibold text-white transition-colors hover:bg-brand/90 sm:flex-none sm:px-5 sm:text-sm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 flex-none" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-5 4v-4.5A2.5 2.5 0 0 1 4 13.5Z"/><path d="M8 8h8M8 12h5"/></svg>{locale === 'ar' ? 'مركز الدعم' : 'Support Center'}</Link>
        <a href="mailto:info@sbaah.com" className="border-brand text-brand inline-flex h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-2 text-[11px] font-semibold transition-colors hover:bg-brand/5 sm:flex-none sm:px-5 sm:text-sm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 flex-none" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</a>
      </div>
    </section>
  );
}

export function MarketingHome({locale}:{locale:Locale}) {
  return <div><Hero locale={locale}/><BusinessSuite locale={locale}/><Testimonials locale={locale}/><Pricing locale={locale}/><CtaBanner locale={locale}/><Faq locale={locale}/></div>;
}
