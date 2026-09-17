import type { Locale } from '@/lib/i18n/locales';
import { Hero } from './marketing/hero';
import { Pricing } from './marketing/pricing';
import { Faq } from './marketing/faq';

const CTA_BANNER_SRC =
  'https://raw.githubusercontent.com/ibn-Lafi/sbaah/claude/real-estate-saas-platform-sp7ua9/7505A414-B2A1-4E3B-921F-A76C348F7E88.png';

function CtaBanner() {
  return (
    <section className="bg-white py-8 sm:py-10">
      <div className="mx-auto w-full max-w-7xl overflow-hidden sm:px-6">
        <div className="relative aspect-[16/7] w-full overflow-hidden sm:rounded-[1.75rem] md:aspect-[16/5]">
          <img
            src={CTA_BANNER_SRC}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}

export function MarketingHome({locale}:{locale:Locale}) {
  return <div><Hero locale={locale}/><Pricing locale={locale}/><CtaBanner/><Faq locale={locale}/></div>;
}
