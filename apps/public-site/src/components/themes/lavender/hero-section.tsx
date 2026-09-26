import { listCities } from '@/lib/api/reference-data';
import type { HeroSectionProps } from '../types';
import { LavenderHeroSearch } from './hero-search';
import { resolveHeroSearchMode } from '@sbaah/shared';

export async function HeroSection({
  locale,
  config,
  bannerUrl,
  bannerVideoUrl,
  tenantName,
}: HeroSectionProps) {
  const title = config.title_ar ?? tenantName;
  const subtitle = config.subtitle_ar ?? '';
  const variant = config.variant ?? 'image_search';
  const searchMode = resolveHeroSearchMode(config);
  const showSearch = searchMode !== 'none';
  const useVideo = (variant === 'video' || variant === 'video_search') && Boolean(bannerVideoUrl);
  const useImage = !useVideo && Boolean(bannerUrl);
  const cities = showSearch ? await listCities() : [];
  return (
    <section className="relative -mt-20 min-h-[82svh] overflow-hidden bg-[#171a17] text-white sm:min-h-[88svh]">
      {useVideo && (
        <video
          src={bannerVideoUrl ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        />
      )}
      {useImage && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bannerUrl})` }}
        />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,15,11,.48)_0%,rgba(10,15,11,.12)_42%,rgba(10,15,11,.86)_100%)]" />
      <div className="bg-gradient-to-e absolute inset-y-0 start-0 w-2/3 from-transparent to-black/20" />
      <div className="relative mx-auto flex min-h-[82svh] w-full max-w-7xl flex-col justify-end px-5 pb-8 pt-36 sm:min-h-[88svh] sm:px-6 sm:pb-12 lg:pb-14">
        <div className="grid items-end gap-8 border-t border-white/35 pt-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,.65fr)] lg:gap-16">
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[.24em] text-white/65">
              {locale === 'ar'
                ? 'تطوير · تسويق · وساطة عقارية'
                : 'Development · Marketing · Brokerage'}
            </p>
            <h1 className="max-w-5xl text-balance text-4xl font-medium leading-[1.08] tracking-[-.025em] sm:text-6xl lg:text-7xl xl:text-[5.25rem]">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="max-w-xl text-sm leading-7 text-white/75 sm:text-base sm:leading-8 lg:pb-1">
              {subtitle}
            </p>
          )}
        </div>
        {showSearch && (
          <div className="mt-8 w-full lg:mt-10">
            <LavenderHeroSearch locale={locale} cities={cities} mode={searchMode} />
          </div>
        )}
      </div>
    </section>
  );
}
