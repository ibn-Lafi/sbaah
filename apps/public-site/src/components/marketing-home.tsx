import type { Locale } from '@/lib/i18n/locales';
import { Hero } from './marketing/hero';
import { Pricing } from './marketing/pricing';
import { Faq } from './marketing/faq';

const CTA_BANNER_SRC =
  'https://raw.githubusercontent.com/ibn-Lafi/sbaah/claude/real-estate-saas-platform-sp7ua9/94C5E88E-C4C6-4C9A-B942-B3D8FD5D58F8.jpeg';

function CtaBanner() {
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
    </section>
  );
}

export function MarketingHome({locale}:{locale:Locale}) {
  return <div><Hero locale={locale}/><Pricing locale={locale}/><CtaBanner/><Faq locale={locale}/></div>;
}
