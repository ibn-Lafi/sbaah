import Link from 'next/link';
import type { Locale } from '@/lib/i18n/locales';
import { Hero } from './marketing/hero';
import { Pricing } from './marketing/pricing';
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
        <a href="https://wa.me/966542400331" target="_blank" rel="noopener noreferrer" className="border-brand text-brand inline-flex h-9 flex-1 items-center justify-center whitespace-nowrap rounded-xl border px-2 text-[11px] font-semibold transition-colors hover:bg-brand/5 sm:flex-none sm:px-5 sm:text-sm">{locale === 'ar' ? 'الواتس اب' : 'WhatsApp'}</a>
        <Link href={`/${locale}/support`} className="border-brand text-brand inline-flex h-9 flex-1 items-center justify-center whitespace-nowrap rounded-xl border px-2 text-[11px] font-semibold transition-colors hover:bg-brand/5 sm:flex-none sm:px-5 sm:text-sm">{locale === 'ar' ? 'مركز الدعم' : 'Support Center'}</Link>
        <a href="mailto:info@sbaah.com" className="bg-brand inline-flex h-9 flex-1 items-center justify-center whitespace-nowrap rounded-xl px-2 text-[11px] font-semibold text-white transition-colors hover:bg-brand/90 sm:flex-none sm:px-5 sm:text-sm">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</a>
      </div>
    </section>
  );
}

export function MarketingHome({locale}:{locale:Locale}) {
  return <div><Hero locale={locale}/><Pricing locale={locale}/><CtaBanner locale={locale}/><Faq locale={locale}/></div>;
}
