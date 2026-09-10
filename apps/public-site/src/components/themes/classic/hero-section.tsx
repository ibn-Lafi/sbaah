import Link from 'next/link';
import type { Locale } from '@/lib/i18n/locales';
import { pickLocalized } from '@/lib/i18n/localized-field';
import type { HeroSectionProps } from '../types';

const CTA_LABEL: Record<Locale, string> = { ar: 'تصفّح العقارات', en: 'Browse properties' };

/** No `config.title_*` fallback text baked in (unlike property_grid/about's fallback titles) — a hero with no authored title just falls back to the tenant's own name, always meaningful with zero editor input. */
export function HeroSection({ locale, config, bannerUrl, tenantName }: HeroSectionProps) {
  const title = pickLocalized(locale, config.title_ar || tenantName, config.title_en ?? null) || tenantName;
  const subtitle = pickLocalized(locale, config.subtitle_ar ?? '', config.subtitle_en ?? null);
  const propertiesHref = locale === 'ar' ? '/properties' : '/en/properties';

  return (
    <section
      className="relative flex min-h-[380px] flex-col items-center justify-center gap-4 px-6 py-16 text-center text-white"
      style={bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    >
      {bannerUrl && <div className="absolute inset-0 bg-black/40" />}
      <div className="relative flex flex-col items-center gap-4">
        <h1 className={`text-3xl font-bold md:text-4xl ${bannerUrl ? 'text-white' : 'text-tenant-primary'}`}>{title}</h1>
        {subtitle && <p className={`max-w-xl text-lg ${bannerUrl ? 'text-white/90' : 'text-black/70'}`}>{subtitle}</p>}
        <Link href={propertiesHref} className="rounded-lg bg-tenant-primary px-6 py-3 font-semibold text-white hover:opacity-90">
          {CTA_LABEL[locale]}
        </Link>
      </div>
    </section>
  );
}
