import type { Locale } from '@/lib/i18n/locales';
import { Hero } from './marketing/hero';
import { Pricing } from './marketing/pricing';
import { Faq } from './marketing/faq';

export function MarketingHome({locale}:{locale:Locale}) {return <div><Hero locale={locale}/><Pricing locale={locale}/><Faq locale={locale}/></div>}
