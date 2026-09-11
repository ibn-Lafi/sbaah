import type { HeroSectionProps } from '../types';
import { pickLocalized } from '@/lib/i18n/localized-field';
import { listCities } from '@/lib/api/reference-data';
import { PropertySearchBar } from '@/components/properties/property-search-bar';

const EYEBROW = { ar: 'عقارات مختارة بعناية', en: 'Curated properties' };

/**
 * Modern theme's Hero — split layout (text one side, a large image or
 * brand-colored panel the other) with the search bar spanning full width
 * below, unlike Classic's single centered-over-banner layout with the
 * search bar directly under the title. Stacks to one column below `md`
 * (mobile/tablet) per the mandatory responsive requirement — image panel
 * moves above the text on small screens.
 *
 * Async (fetches `cities` for the search bar) — see classic/hero-section's
 * own comment for why this is safe against the shared theme contract.
 */
export async function HeroSection({ locale, config, bannerUrl, tenantName }: HeroSectionProps) {
  const title = pickLocalized(locale, config.title_ar || tenantName, config.title_en ?? null) || tenantName;
  const subtitle = pickLocalized(locale, config.subtitle_ar ?? '', config.subtitle_en ?? null);
  const cities = await listCities();

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-14 md:py-20">
      <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12">
        <div className="order-2 flex flex-col items-start gap-4 md:order-1">
          <span className="rounded-full bg-tenant-primary/10 px-4 py-1 text-xs font-semibold text-tenant-primary">
            {EYEBROW[locale]}
          </span>
          <h1 className="text-3xl font-extrabold leading-tight text-black md:text-5xl">{title}</h1>
          {subtitle && <p className="max-w-md text-lg text-black/60">{subtitle}</p>}
        </div>
        <div className="order-1 aspect-[4/3] w-full overflow-hidden rounded-3xl md:order-2" style={{ backgroundColor: 'var(--tenant-primary, #68458a)' }}>
          {bannerUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerUrl} alt={title} className="h-full w-full object-cover" />
          )}
        </div>
      </div>
      <PropertySearchBar locale={locale} cities={cities} />
    </section>
  );
}
