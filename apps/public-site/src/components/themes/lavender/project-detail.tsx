import type { Locale } from '@/lib/i18n/locales';
import type { PublicProjectDetailResponse } from '@/lib/api/public-projects';
import { pickLocalized } from '@/lib/i18n/localized-field';
import { localizedPath } from '@/lib/routing/public-url';
import { getListingTypeLabel, getPropertyTypeLabel } from '@/lib/property/labels';
import { LavenderProjectMediaGallery } from './project-media-gallery';

const labels: Record<string, { ar: string; en: string }> = {
  bedrooms: { ar: 'غرف النوم', en: 'Bedrooms' },
  bathrooms: { ar: 'دورات المياه', en: 'Bathrooms' },
  area_sqm: { ar: 'المساحة', en: 'Area' },
  base_price: { ar: 'السعر يبدأ من', en: 'Starting price' },
  floors: { ar: 'الأدوار', en: 'Floors' },
  parking: { ar: 'مواقف السيارات', en: 'Parking' },
};
const specLabel = (key: string, locale: Locale) =>
  labels[key]?.[locale] ?? key.replaceAll('_', ' ');

export function LavenderProjectDetail({
  locale,
  data,
}: {
  locale: Locale;
  data: PublicProjectDetailResponse;
}) {
  const project = data.project;
  const title = pickLocalized(locale, project.name_ar, project.name_en);
  const description = pickLocalized(
    locale,
    project.description_ar ?? '',
    project.description_en ?? null,
  );
  const images = data.media.filter((media) => media.media_type === 'image');
  const primary = images.find((media) => media.is_primary) ?? images[0];
  const by = (category: string) => images.filter((media) => media.category === category);
  const gallery = images.filter((media) =>
    ['general', 'exterior', 'interior'].includes(media.category),
  );
  const mediaGalleryGroups = [
    {
      key: 'gallery' as const,
      label: locale === 'ar' ? 'معرض الصور' : 'Photo gallery',
      items: gallery.map((media, index) => ({
        id: media.id,
        url: media.url,
        alt: pickLocalized(locale, media.alt_ar ?? `${title} ${index + 1}`, media.alt_en),
      })),
    },
    {
      key: 'master_plan' as const,
      label: locale === 'ar' ? 'مخطط المشروع' : 'Master plan',
      items: by('master_plan').map((media, index) => ({
        id: media.id,
        url: media.url,
        alt: pickLocalized(
          locale,
          media.alt_ar ?? `${locale === 'ar' ? 'مخطط المشروع' : 'Master plan'} ${index + 1}`,
          media.alt_en,
        ),
      })),
    },
    {
      key: 'construction' as const,
      label: locale === 'ar' ? 'أعمال الإنشاء' : 'Construction',
      items: by('construction').map((media, index) => ({
        id: media.id,
        url: media.url,
        alt: pickLocalized(
          locale,
          media.alt_ar ?? `${locale === 'ar' ? 'أعمال الإنشاء' : 'Construction'} ${index + 1}`,
          media.alt_en,
        ),
      })),
    },
  ];
  const mediaSections = [
    ['master_plan', locale === 'ar' ? 'مخطط المشروع' : 'Master plan'],
    ['unit_plans', locale === 'ar' ? 'مخططات الوحدات' : 'Unit plans'],
    ['amenities', locale === 'ar' ? 'المرافق والخدمات' : 'Amenities'],
    ['location', locale === 'ar' ? 'الموقع والمحيط' : 'Location'],
    ['construction', locale === 'ar' ? 'مراحل الإنشاء' : 'Construction progress'],
  ] as const;
  const money = (value: number) =>
    new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', { maximumFractionDigits: 0 }).format(
      value,
    );
  const videos = data.media.filter((media) => media.media_type === 'video');
  const projectProperties = data.properties ?? [];
  const nav = [
    ['about', locale === 'ar' ? 'عن المشروع' : 'About'],
    ...(projectProperties.length
      ? [['project-properties', locale === 'ar' ? 'عقارات المشروع' : 'Project properties']]
      : []),
    ...(data.unit_types.length ? [['models', locale === 'ar' ? 'النماذج' : 'Models']] : []),
    ...mediaSections.filter(([key]) => by(key).length).map(([key, label]) => [key, label]),
    ...(!projectProperties.length && data.units.length
      ? [['units', locale === 'ar' ? 'الوحدات' : 'Units']]
      : []),
    ...(videos.length ? [['project-video', locale === 'ar' ? 'الفيديو' : 'Video']] : []),
  ] as string[][];
  return (
    <main className="bg-[#f4f1ea] text-[#171713]">
      <section className="relative min-h-[68svh] overflow-hidden bg-[#171713] text-white sm:min-h-[78vh]">
        {primary && (
          <img
            src={primary.url}
            alt={title}
            loading="eager"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/30" />
        <div className="relative mx-auto flex min-h-[68svh] max-w-7xl items-end px-5 pb-9 pt-28 sm:min-h-[78vh] sm:px-6 sm:pb-14">
          <div className="w-full max-w-4xl border-t border-white/40 pt-6">
            <p className="mb-4 text-xs font-semibold tracking-[.14em] text-white/80">
              {locale === 'ar' ? 'مشروع عقاري' : 'REAL ESTATE PROJECT'}
            </p>
            <h1 className="text-4xl font-semibold leading-[1.08] sm:text-6xl lg:text-7xl">
              {title}
            </h1>
            <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/80">
              {typeof project.completion_percentage === 'number' && (
                <div>
                  <dt className="inline">{locale === 'ar' ? 'الإنجاز' : 'Progress'} </dt>
                  <dd className="inline font-bold text-white">{project.completion_percentage}%</dd>
                </div>
              )}
              {project.planned_units_count != null && (
                <div>
                  <dt className="inline">{locale === 'ar' ? 'الوحدات' : 'Units'} </dt>
                  <dd className="inline font-bold text-white">
                    {String(project.planned_units_count)}
                  </dd>
                </div>
              )}
              <div>
                <dt className="inline">{locale === 'ar' ? 'النماذج' : 'Models'} </dt>
                <dd className="inline font-bold text-white">{data.unit_types.length}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
      <nav
        aria-label={locale === 'ar' ? 'أقسام المشروع' : 'Project sections'}
        className="sticky top-24 z-20 overflow-x-auto border-b border-black/15 bg-[#f4f1ea]/95 px-5 backdrop-blur sm:px-6"
      >
        <div className="mx-auto flex min-w-max max-w-7xl gap-7 py-4 text-xs font-semibold">
          {nav.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="hover:text-tenant-primary focus-visible:ring-tenant-primary outline-none focus-visible:ring-2"
            >
              {label}
            </a>
          ))}
        </div>
      </nav>
      <section id="about" className="scroll-mt-40 px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.65fr_1.35fr] lg:gap-16">
          <div>
            <p className="text-tenant-primary mb-4 text-xs font-semibold">
              {locale === 'ar' ? 'نظرة عامة' : 'OVERVIEW'}
            </p>
            <h2 className="text-3xl font-semibold sm:text-5xl">
              {locale === 'ar' ? 'عن المشروع' : 'About the project'}
            </h2>
          </div>
          <div>
            {description && (
              <p className="max-w-3xl whitespace-pre-line text-base leading-8 text-black/70 sm:text-lg sm:leading-9">
                {description}
              </p>
            )}
            <dl className="mt-8 grid grid-cols-2 border border-black/15 sm:grid-cols-3">
              {typeof project.completion_percentage === 'number' && (
                <div className="border-b border-e border-black/15 p-5">
                  <dt className="text-xs font-medium text-black/60">
                    {locale === 'ar' ? 'نسبة الإنجاز' : 'Progress'}
                  </dt>
                  <dd className="mt-2 text-2xl font-bold">{project.completion_percentage}%</dd>
                </div>
              )}
              {project.planned_units_count != null && (
                <div className="border-b border-e border-black/15 p-5">
                  <dt className="text-xs font-medium text-black/60">
                    {locale === 'ar' ? 'عدد الوحدات' : 'Units'}
                  </dt>
                  <dd className="mt-2 text-2xl font-bold">{String(project.planned_units_count)}</dd>
                </div>
              )}
              <div className="border-b border-black/15 p-5">
                <dt className="text-xs font-medium text-black/60">
                  {locale === 'ar' ? 'نماذج المشروع' : 'Models'}
                </dt>
                <dd className="mt-2 text-2xl font-bold">{data.unit_types.length}</dd>
              </div>
              {project.expected_completion_date && (
                <div className="col-span-2 p-5 sm:col-span-3">
                  <dt className="text-xs font-medium text-black/60">
                    {locale === 'ar' ? 'التسليم المتوقع' : 'Expected completion'}
                  </dt>
                  <dd className="mt-2 text-lg font-bold">
                    {String(project.expected_completion_date)}
                  </dd>
                </div>
              )}
            </dl>
            <a
              href="#inquiry"
              className="bg-tenant-primary focus-visible:ring-tenant-primary mt-8 inline-flex min-h-12 items-center px-7 text-sm font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              {locale === 'ar' ? 'سجل اهتمامك بالمشروع' : 'Register your interest'}
              <span aria-hidden="true" className="ms-3">
                {locale === 'ar' ? '←' : '→'}
              </span>
            </a>
          </div>
        </div>
      </section>
      <LavenderProjectMediaGallery
        locale={locale}
        groups={mediaGalleryGroups}
      />
      {projectProperties.length > 0 && (
        <section
          id="project-properties"
          className="scroll-mt-40 bg-[#171713] px-5 py-14 text-white sm:px-6 sm:py-20"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-end justify-between border-b border-white/25 pb-5">
              <div>
                <p className="mb-3 text-xs font-semibold text-white/65">
                  {locale === 'ar' ? 'المخطط العقاري' : 'PROJECT INVENTORY'}
                </p>
                <h2 className="text-3xl font-semibold sm:text-5xl">
                  {locale === 'ar' ? 'عقارات المشروع' : 'Project properties'}
                </h2>
              </div>
              <span className="text-sm text-white/70">{projectProperties.length}</span>
            </div>
            <div className="grid gap-8 lg:grid-cols-2">
              {projectProperties.map((property) => {
                const propertyName = pickLocalized(locale, property.name_ar, property.name_en);
                const cover =
                  property.media?.find(
                    (media) => media.is_primary && media.media_type === 'image',
                  ) ?? property.media?.find((media) => media.media_type === 'image');
                return (
                  <article key={property.id} className="border border-white/20 bg-white/[.03]">
                    <a
                      href={
                        property.slug && property.listing_id
                          ? localizedPath(locale, `/properties/${property.slug}`)
                          : undefined
                      }
                      className="focus-visible:ring-tenant-primary group block outline-none focus-visible:ring-2"
                    >
                      {cover ? (
                        <img
                          src={cover.url}
                          alt={propertyName}
                          loading="lazy"
                          className="aspect-[16/9] w-full object-cover transition duration-500 group-hover:scale-[1.01]"
                        />
                      ) : (
                        <div className="aspect-[16/9] bg-[linear-gradient(135deg,rgba(255,255,255,.08),rgba(255,255,255,.02))]" />
                      )}
                      <div className="p-5 sm:p-6">
                        <p className="text-xs text-white/65">
                          {getPropertyTypeLabel(locale, property.asset_type)}
                        </p>
                        <div className="mt-2 flex items-start justify-between gap-5">
                          <h3 className="text-2xl font-semibold">{propertyName}</h3>
                          {property.price != null && (
                            <strong className="whitespace-nowrap text-sm">
                              {money(property.price)} {locale === 'ar' ? 'ر.س' : 'SAR'}
                            </strong>
                          )}
                        </div>
                        {property.area_sqm && (
                          <p className="mt-3 text-sm text-white/70">{property.area_sqm} م²</p>
                        )}
                      </div>
                    </a>
                    {property.units.length > 0 && (
                      <div className="border-t border-white/20 px-5 py-2 sm:px-6">
                        <p className="py-3 text-xs font-semibold text-white/60">
                          {locale === 'ar'
                            ? `الوحدات (${property.units.length})`
                            : `Units (${property.units.length})`}
                        </p>
                        <div className="divide-y divide-white/15">
                          {property.units.map((unit) => (
                            <a
                              key={unit.id}
                              href={localizedPath(locale, '/properties/' + (unit.slug ?? unit.id))}
                              className="hover:text-tenant-primary focus-visible:ring-tenant-primary grid grid-cols-[1fr_auto] items-center gap-4 py-4 text-sm outline-none focus-visible:ring-2"
                            >
                              <span>
                                {locale === 'en' && unit.name_en
                                  ? unit.name_en
                                  : unit.name_ar || unit.unit_number || unit.listing_number}
                              </span>
                              <span className="text-white/75">
                                {unit.price != null
                                  ? `${money(unit.price)} ${locale === 'ar' ? 'ر.س' : 'SAR'}`
                                  : ''}{' '}
                                <span aria-hidden="true">{locale === 'ar' ? '←' : '→'}</span>
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}
      {data.unit_types.length > 0 && (
        <section id="models" className="scroll-mt-40 bg-white px-5 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-end justify-between border-b border-black/20 pb-5">
              <div>
                <p className="text-tenant-primary mb-3 text-xs font-semibold">
                  {locale === 'ar' ? 'خيارات السكن' : 'LIVING OPTIONS'}
                </p>
                <h2 className="text-3xl font-semibold sm:text-5xl">
                  {locale === 'ar' ? 'نماذج المشروع' : 'Project models'}
                </h2>
              </div>
              <span className="text-sm font-semibold text-black/60">{data.unit_types.length}</span>
            </div>
            <div className="divide-y divide-black/15">
              {data.unit_types.map((type, index) => {
                const facts = [
                  ['area_sqm', type.area_sqm],
                  ['bedrooms', type.bedrooms],
                  ['bathrooms', type.bathrooms],
                  ['base_price', type.base_price],
                  ...Object.entries(type.specifications ?? {}),
                ]
                  .filter(([, value]) => value !== null && value !== undefined && value !== '')
                  .slice(0, 6);
                return (
                  <article
                    key={type.id}
                    className="py-7 sm:grid sm:grid-cols-[3rem_.7fr_1.3fr] sm:gap-6"
                  >
                    <span className="text-tenant-primary mb-3 text-xs font-semibold sm:mb-0">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 className="mb-5 text-2xl font-semibold sm:mb-0">
                      {pickLocalized(locale, type.name_ar, type.name_en)}
                    </h3>
                    <dl className="grid grid-cols-2 gap-x-5 gap-y-3 text-xs">
                      {facts.map(([key, value]) => (
                        <div key={String(key)} className="border-b border-black/15 pb-3">
                          <dt className="text-black/60">{specLabel(String(key), locale)}</dt>
                          <dd className="mt-1 font-bold">
                            {key === 'base_price' && typeof value === 'number'
                              ? `${money(value)} ${locale === 'ar' ? 'ر.س' : 'SAR'}`
                              : key === 'area_sqm'
                                ? `${String(value)} م²`
                                : String(value)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}
      {mediaSections.map(([key, label]) => {
        const items = by(key);
        if (!items.length) return null;
        return (
          <section id={key} key={key} className="scroll-mt-40 px-5 py-14 sm:px-6 sm:py-20">
            <div className="mx-auto max-w-7xl">
              <div className="mb-7 flex items-end justify-between border-b border-black/20 pb-5">
                <h2 className="text-3xl font-semibold sm:text-5xl">{label}</h2>
                <span className="text-sm font-semibold text-black/60">{items.length}</span>
              </div>
              <div
                className={
                  key === 'master_plan' ? 'grid gap-2' : 'grid grid-cols-2 gap-1 sm:grid-cols-3'
                }
              >
                {items.map((media, index) => (
                  <img
                    key={media.id}
                    src={media.url}
                    alt={pickLocalized(
                      locale,
                      media.alt_ar ?? `${label} ${index + 1}`,
                      media.alt_en,
                    )}
                    loading="lazy"
                    className={
                      key === 'master_plan'
                        ? 'max-h-[760px] w-full bg-white object-contain'
                        : 'aspect-[4/3] h-full w-full object-cover'
                    }
                  />
                ))}
              </div>
            </div>
          </section>
        );
      })}
      {!projectProperties.length && data.units.length > 0 && (
        <section
          id="units"
          className="scroll-mt-40 bg-[#171713] px-5 py-14 text-white sm:px-6 sm:py-20"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-7 flex items-end justify-between border-b border-white/25 pb-5">
              <h2 className="text-3xl font-semibold sm:text-5xl">
                {locale === 'ar' ? 'الوحدات المتاحة' : 'Available units'}
              </h2>
              <span className="text-sm text-white/70">{data.units.length}</span>
            </div>
            <div className="divide-y divide-white/20">
              {data.units.map((unit) => (
                <a
                  key={unit.id}
                  href={localizedPath(locale, '/properties/' + (unit.slug ?? unit.id))}
                  className="focus-visible:ring-tenant-primary grid min-h-20 grid-cols-[1fr_auto] items-center gap-4 outline-none focus-visible:ring-2 sm:grid-cols-[1fr_.5fr_.5fr_auto]"
                >
                  <div>
                    <strong className="block text-sm sm:text-base">
                      {locale === 'en' && unit.name_en
                        ? unit.name_en
                        : unit.name_ar || unit.unit_number || unit.listing_number}
                    </strong>
                    {unit.area_sqm && (
                      <span className="mt-1 block text-xs text-white/70 sm:hidden">
                        {unit.area_sqm} م²
                      </span>
                    )}
                  </div>
                  <span className="hidden text-sm text-white/75 sm:block">
                    {unit.area_sqm ? `${unit.area_sqm} م²` : ''}
                  </span>
                  <span className="hidden text-sm text-white/75 sm:block">
                    {getListingTypeLabel(locale, unit.listing_type)}
                  </span>
                  <span className="whitespace-nowrap text-sm font-bold">
                    {unit.price != null
                      ? `${money(unit.price)} ${locale === 'ar' ? 'ر.س' : 'SAR'}`
                      : ''}{' '}
                    <span aria-hidden="true">{locale === 'ar' ? '←' : '→'}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
      {videos.length > 0 && (
        <section
          id="project-video"
          className="scroll-mt-40 bg-black px-5 py-14 text-white sm:px-6 sm:py-20"
        >
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-7 text-3xl font-semibold sm:text-5xl">
              {locale === 'ar' ? 'فيديو المشروع' : 'Project video'}
            </h2>
            <video
              src={videos[0]!.url}
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full"
            />
          </div>
        </section>
      )}
    </main>
  );
}
