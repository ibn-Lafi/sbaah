import type { Locale } from '@/lib/i18n/locales';
import { Hero } from './marketing/hero';
import { HowItWorks } from './marketing/how-it-works';
import { ProductShowcase } from './marketing/product-showcase';
import { FeatureGrid } from './marketing/feature-grid';
import { Comparison } from './marketing/comparison';
import { Pricing } from './marketing/pricing';
import { Faq } from './marketing/faq';
import { FinalCta } from './marketing/final-cta';

/** سبعة's own marketing homepage content — rendered by `[locale]/page.tsx` when the request's Host is the bare platform root domain (see `[locale]/layout.tsx` for the matching chrome branch). No tenant involved at all. */
export function MarketingHome({ locale }: { locale: Locale }) {
  return (
    <div>
      <Hero locale={locale} />
      <HowItWorks locale={locale} />
      <ProductShowcase locale={locale} />
      <FeatureGrid locale={locale} />
      <Comparison locale={locale} />
      <Pricing locale={locale} />
      <Faq locale={locale} />
      <FinalCta locale={locale} />
    </div>
  );
}
