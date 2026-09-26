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
  const useImage = (variant === 'image' || variant === 'image_search') && Boolean(bannerUrl);
  const cities = showSearch ? await listCities() : [];
  return (
    <section className="relative -mt-20 h-[100svh] min-h-[100svh] w-full overflow-hidden bg-[#171a17] text-white">
      {useVideo && (
        <video
          src={bannerVideoUrl ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover object-center"
          aria-hidden="true"
        />
      )}
      {useImage && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bannerUrl})` }}
        />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,10,9,.54)_0%,rgba(7,10,9,.35)_32%,rgba(7,9,8,.48)_64%,rgba(5,7,6,.76)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_8%,rgba(0,0,0,.18)_100%)]" />
      <div
        className={`relative mx-auto flex min-h-[100svh] w-full max-w-[90rem] flex-col items-center justify-center px-5 pb-10 pt-28 text-center sm:px-8 sm:pb-14 sm:pt-32 lg:px-12 ${showSearch ? 'lg:pb-12 lg:pt-36' : 'lg:pb-20 lg:pt-40'}`}
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
          <h1 className="max-w-[22rem] text-balance text-[clamp(2.35rem,10.5vw,3.25rem)] font-medium leading-[1.3] tracking-[-.035em] text-white drop-shadow-[0_2px_22px_rgba(0,0,0,.28)] sm:max-w-3xl sm:text-6xl sm:leading-[1.2] lg:max-w-5xl lg:text-7xl lg:leading-[1.16] xl:text-[5.25rem]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-6 max-w-[22rem] text-balance text-base font-normal leading-8 text-white/75 drop-shadow-[0_1px_14px_rgba(0,0,0,.3)] sm:mt-7 sm:max-w-2xl sm:text-lg sm:leading-9 lg:max-w-3xl lg:text-xl lg:leading-10">
              {subtitle}
            </p>
          )}
        </div>
        {showSearch && (
          <div className="mt-8 w-full max-w-6xl sm:mt-10 lg:mt-12">
            <LavenderHeroSearch locale={locale} cities={cities} mode={searchMode} />
          </div>
        )}
      </div>
    </section>
  );
}
