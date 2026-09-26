import type {
  FeaturedPropertiesSectionConfig,
  LatestPropertiesSectionConfig,
  ProjectsShowcaseSectionConfig,
  PropertiesByCitySectionConfig,
} from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import { listPublicProperties } from '@/lib/api/public-properties';
import { getPublicProject, listPublicProjects } from '@/lib/api/public-projects';
import { listCities } from '@/lib/api/reference-data';
import { pickLocalized } from '@/lib/i18n/localized-field';
import { localizedPath } from '@/lib/routing/public-url';
import { LavenderHeading, LavenderSection } from './primitives';
import { LavenderProperty, LavenderProject } from './cards';

const copy = {
  ar: {
    featured: 'العقارات المميزة',
    latest: 'أحدث العقارات',
    projects: 'المشاريع العقارية',
    cities: 'اكتشف حسب المدينة',
    all: 'عرض الكل',
  },
  en: {
    featured: 'Featured properties',
    latest: 'Latest properties',
    projects: 'Real estate projects',
    cities: 'Explore by city',
    all: 'View all',
  },
} as const;
const More = ({ locale, href, dark = false }: { locale: Locale; href: string; dark?: boolean }) => (
  <a
    href={localizedPath(locale, href)}
    className={`focus-visible:ring-tenant-primary hidden border-b pb-1 text-sm font-semibold outline-none focus-visible:ring-2 sm:block ${dark ? 'border-white/60 text-white' : 'border-black/40 text-black'}`}
  >
    {copy[locale].all}
  </a>
);
const cols = (value?: 2 | 3 | 4) =>
  value === 2 ? 'lg:grid-cols-2' : value === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3';
const align = (value?: 'start' | 'center') =>
  value === 'center' ? 'text-center items-center' : '';
const tone = (value?: 'default' | 'soft') => (value === 'soft' ? 'bg-[#f4f1ea]' : 'bg-white');

export async function LavenderFeaturedProperties({
  locale,
  config,
}: {
  locale: Locale;
  config: FeaturedPropertiesSectionConfig;
}) {
  const [result, cities] = await Promise.all([
    listPublicProperties({ page_size: 50 }),
    listCities(),
  ]);
  const ids = new Set(config.property_ids ?? []);
  const items = (
    ids.size ? result.properties.filter((p) => ids.has(p.asset_id)) : result.properties
  ).slice(0, 5);
  const city = new Map(cities.map((c) => [c.id, c]));
  return (
    <LavenderSection className={tone(config.tone)}>
      <div className={align(config.heading_align)}>
        <LavenderHeading
          eyebrow={locale === 'ar' ? 'مختارات عقارية' : 'Selected portfolio'}
          title={config.title_ar || copy[locale].featured}
          action={<More locale={locale} href="/properties" />}
        />
      </div>
      <div className={`grid gap-x-5 gap-y-10 sm:grid-cols-2 ${cols(config.columns)}`}>
        {items.map((p, i) => (
          <LavenderProperty
            key={p.id}
            property={p}
            city={p.city_id ? city.get(p.city_id) : undefined}
            locale={locale}
            featured={i === 0 && config.columns !== 4}
          />
        ))}
      </div>
    </LavenderSection>
  );
}
export async function LavenderLatestProperties({
  locale,
  config,
}: {
  locale: Locale;
  config: LatestPropertiesSectionConfig;
}) {
  const [result, cities] = await Promise.all([
    listPublicProperties({ page_size: 12 }),
    listCities(),
  ]);
  const city = new Map(cities.map((c) => [c.id, c]));
  const items = result.properties.slice(0, Math.min(Math.max(config.limit ?? 6, 1), 12));
  return (
    <LavenderSection className={tone(config.tone)}>
      <div className={align(config.heading_align)}>
        <LavenderHeading
          eyebrow={locale === 'ar' ? 'أحدث العروض' : 'Latest listings'}
          title={config.title_ar || copy[locale].latest}
          action={<More locale={locale} href="/properties" />}
        />
      </div>
      <div className={`grid gap-x-5 gap-y-10 sm:grid-cols-2 ${cols(config.columns)}`}>
        {items.map((p) => (
          <LavenderProperty
            key={p.id}
            property={p}
            city={p.city_id ? city.get(p.city_id) : undefined}
            locale={locale}
          />
        ))}
      </div>
    </LavenderSection>
  );
}
export async function LavenderProjects({
  locale,
  config,
}: {
  locale: Locale;
  config: ProjectsShowcaseSectionConfig;
}) {
  const [result, cities] = await Promise.all([listPublicProjects(), listCities()]);
  const city = new Map(cities.map((c) => [c.id, c]));
  const base = result.projects.slice(0, Math.min(Math.max(config.limit ?? 5, 1), 12));
  const details = await Promise.all(
    base.map(async (p) => {
      try {
        const d = await getPublicProject(p.slug || p.id);
        return {
          ...p,
          status: String(d.project.status ?? 'published'),
          completion_percentage:
            typeof d.project.completion_percentage === 'number'
              ? d.project.completion_percentage
              : null,
          planned_units_count:
            typeof d.project.planned_units_count === 'number'
              ? d.project.planned_units_count
              : null,
          models_count: d.unit_types.length,
        };
      } catch {
        return p;
      }
    }),
  );
  return (
    <LavenderSection className="bg-[#171713] text-white">
      <div
        className={`mb-10 flex items-end justify-between gap-6 border-b border-white/25 pb-5 sm:mb-14 ${align(config.heading_align)}`}
      >
        <div>
          <p className="mb-3 text-xs font-semibold tracking-[.12em] text-white/70">
            {locale === 'ar' ? 'محفظة المشاريع' : 'PROJECT PORTFOLIO'}
          </p>
          <h2 className="text-3xl font-semibold sm:text-5xl">
            {config.title_ar || copy[locale].projects}
          </h2>
        </div>
        <More locale={locale} href="/projects" dark />
      </div>
      <div className={`grid gap-5 ${cols(config.columns)}`}>
        {details.map((p, i) => (
          <LavenderProject
            key={p.id}
            project={p}
            city={city.get(p.city_id)}
            locale={locale}
            featured={i === 0 && config.columns !== 4}
          />
        ))}
      </div>
    </LavenderSection>
  );
}
export async function LavenderCities({
  locale,
  config,
}: {
  locale: Locale;
  config: PropertiesByCitySectionConfig;
}) {
  const [cities, result] = await Promise.all([
    listCities(),
    listPublicProperties({ page_size: 50 }),
  ]);
  const inventory = new Set(result.properties.map((p) => p.city_id));
  const wanted = new Set(config.city_ids ?? []);
  const items = cities
    .filter((c) => inventory.has(c.id))
    .filter((c) => !wanted.size || wanted.has(c.id))
    .slice(0, 8);
  return (
    <LavenderSection className={tone(config.tone)}>
      <div className={align(config.heading_align)}>
        <LavenderHeading
          eyebrow={locale === 'ar' ? 'نطاق أعمالنا' : 'Our locations'}
          title={config.title_ar || copy[locale].cities}
        />
      </div>
      <div
        className={`grid border-t border-black/20 sm:grid-cols-2 ${config.columns === 4 ? 'lg:grid-cols-4' : config.columns === 3 ? 'lg:grid-cols-3' : ''}`}
      >
        {items.map((city, i) => (
          <a
            key={city.id}
            href={localizedPath(locale, '/properties') + '?city_id=' + city.id}
            className="focus-visible:ring-tenant-primary group grid min-h-24 grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b border-black/20 px-2 outline-none transition hover:bg-black/[.025] focus-visible:ring-2 sm:border-e"
          >
            <span className="text-xs font-medium text-black/50">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="text-xl font-semibold sm:text-2xl">
              {pickLocalized(locale, city.name_ar, city.name_en)}
            </span>
            <span
              aria-hidden="true"
              className="text-xl transition-transform group-hover:-translate-x-1 motion-reduce:transition-none rtl:group-hover:translate-x-1"
            >
              {locale === 'ar' ? '←' : '→'}
            </span>
          </a>
        ))}
      </div>
    </LavenderSection>
  );
}
