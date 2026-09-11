import { pickLocalized } from '@/lib/i18n/localized-field';
import { listCities } from '@/lib/api/reference-data';
import type { HeroSectionProps } from '../types';
import { PropertySearchBar } from '@/components/properties/property-search-bar';

/**
 * No `config.title_*` fallback text baked in (unlike property_grid/about's
 * fallback titles) — a hero with no authored title just falls back to the
 * tenant's own name, always meaningful with zero editor input.
 *
 * Async (fetches `cities` for the search bar's location select) — the
 * shared `ThemeSectionComponents` type already accommodates this
 * (`SectionComponent<P>` allows a `Promise<ReactNode>`-returning
 * function), and every render-section call site uses `<theme.HeroSection
 * ... />` as JSX, which Next's App Router (React Server Components)
 * renders correctly whether the component is sync or async.
 *
 * `bannerUrl` case pulls itself up (`-mt-20`, matching header.tsx's
 * reserved `h-20` spacer exactly) so the image sits directly behind the
 * fixed, transparent-at-top header — the "photo behind the header" look
 * from the founder's reference image. Extra top padding (`pt-36` instead
 * of `pt-16`) keeps the title clear of the floating header once it's
 * pulled up. No banner means no reason to reclaim that space — the
 * header's own spacer already keeps this section's normal position.
 */
export async function HeroSection({ locale, config, bannerUrl, tenantName }: HeroSectionProps) {
  const title = pickLocalized(locale, config.title_ar || tenantName, config.title_en ?? null) || tenantName;
  const subtitle = pickLocalized(locale, config.subtitle_ar ?? '', config.subtitle_en ?? null);
  const cities = await listCities();

  return (
    <section
      className={`relative flex min-h-[420px] flex-col items-center justify-center gap-6 px-6 pb-20 text-center text-white ${bannerUrl ? '-mt-20 pt-36' : 'pt-16'}`}
      style={bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    >
      {bannerUrl && <div className="absolute inset-0 bg-black/40" />}
      <div className="relative flex flex-col items-center gap-4">
        <h1 className={`text-3xl font-bold md:text-4xl ${bannerUrl ? 'text-white' : 'text-tenant-primary'}`}>{title}</h1>
        {subtitle && <p className={`max-w-xl text-lg ${bannerUrl ? 'text-white/90' : 'text-black/70'}`}>{subtitle}</p>}
      </div>
      <div className="relative w-full max-w-4xl">
        <PropertySearchBar locale={locale} cities={cities} />
      </div>
    </section>
  );
}
