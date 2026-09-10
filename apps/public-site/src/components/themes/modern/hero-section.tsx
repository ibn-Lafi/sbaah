import Link from 'next/link';
import type { HeroSectionProps } from '../types';
import { pickLocalized } from '@/lib/i18n/localized-field';

const CTA_LABEL = { ar: 'تصفّح العقارات', en: 'Browse properties' };
const EYEBROW = { ar: 'عقارات مختارة بعناية', en: 'Curated properties' };

/**
 * Modern theme's Hero — split layout (text/CTA one side, a large image or
 * brand-colored panel the other), unlike Classic's single centered-over-banner
 * layout. Stacks to one column below `md` (mobile/tablet) per the mandatory
 * responsive requirement — image panel moves above the text on small screens.
 */
export function HeroSection({ locale, config, bannerUrl, tenantName }: HeroSectionProps) {
  const title = pickLocalized(locale, config.title_ar || tenantName, config.title_en ?? null) || tenantName;
  const subtitle = pickLocalized(locale, config.subtitle_ar ?? '', config.subtitle_en ?? null);
  const propertiesHref = locale === 'ar' ? '/properties' : '/en/properties';

  return (
    <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-6 py-14 md:grid-cols-2 md:gap-12 md:py-20">
      <div className="order-2 flex flex-col items-start gap-4 md:order-1">
        <span className="rounded-full bg-tenant-primary/10 px-4 py-1 text-xs font-semibold text-tenant-primary">
          {EYEBROW[locale]}
        </span>
        <h1 className="text-3xl font-extrabold leading-tight text-black md:text-5xl">{title}</h1>
        {subtitle && <p className="max-w-md text-lg text-black/60">{subtitle}</p>}
        <Link
          href={propertiesHref}
          className="mt-2 rounded-full bg-tenant-primary px-8 py-3 font-semibold text-white hover:opacity-90"
        >
          {CTA_LABEL[locale]}
        </Link>
      </div>
      <div className="order-1 aspect-[4/3] w-full overflow-hidden rounded-3xl md:order-2" style={{ backgroundColor: 'var(--tenant-primary, #68458a)' }}>
        {bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bannerUrl} alt={title} className="h-full w-full object-cover" />
        )}
      </div>
    </section>
  );
}
