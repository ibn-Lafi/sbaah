import type { FeaturedPropertiesSectionConfig, LatestPropertiesSectionConfig, ProjectsShowcaseSectionConfig, PropertiesByCitySectionConfig } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import Link from 'next/link';
import { listPublicProperties } from '@/lib/api/public-properties';
import { listPublicProjects } from '@/lib/api/public-projects';
import { listCities } from '@/lib/api/reference-data';
import { PropertyCard } from '@/components/properties/property-card';
import { ProjectCard } from '@/components/properties/project-card';
import { pickLocalized } from '@/lib/i18n/localized-field';
import { localizedPath } from '@/lib/routing/public-url';
import { ClassicEmptyState, ClassicSection, ClassicSectionHeading, classicColumnsClass, classicToneClass } from './primitives';

const copy = {
  ar: {
    featured: 'العقارات المميزة',
    latest: 'أحدث العقارات',
    projects: 'المشاريع العقارية',
    cities: 'العقارات حسب المدينة',
    propertiesEmpty: 'لا توجد عقارات منشورة حاليًا.',
    projectsEmpty: 'لا توجد مشاريع منشورة حاليًا.',
    citiesEmpty: 'لا توجد مدن مرتبطة بالعقارات المنشورة حاليًا.',
    allProperties: 'عرض كل العقارات',
    allProjects: 'عرض كل المشاريع',
  },
  en: {
    featured: 'Featured properties',
    latest: 'Latest properties',
    projects: 'Real estate projects',
    cities: 'Properties by city',
    propertiesEmpty: 'No published properties yet.',
    projectsEmpty: 'No published projects yet.',
    citiesEmpty: 'No cities are currently associated with published properties.',
    allProperties: 'View all properties',
    allProjects: 'View all projects',
  },
} as const;

function SectionLink({ href, children }: { href: string; children: string }) {
  return <Link href={href} className="shrink-0 text-sm font-semibold text-tenant-primary transition-opacity hover:opacity-70">{children}</Link>;
}

export async function FeaturedPropertiesSection({ locale, config }: { locale: Locale; config: FeaturedPropertiesSectionConfig }) {
  const [result, cities] = await Promise.all([listPublicProperties({page_size:100}), listCities()]);
  const selectedIds = new Set(config.property_ids ?? []);
  const items = (selectedIds.size ? result.properties.filter((property) => selectedIds.has(property.asset_id)) : result.properties).slice(0, 6);
  const citiesById = new Map(cities.map((city) => [city.id, city]));
  return (
    <ClassicSection className={classicToneClass(config.tone)}>
      <ClassicSectionHeading title={config.title_ar || copy[locale].featured} align={config.heading_align} action={<SectionLink href={localizedPath(locale, '/properties')}>{copy[locale].allProperties}</SectionLink>} />
      {items.length ? <div className={`grid gap-5 ${classicColumnsClass(config.columns)}`}>{items.map((property) => <PropertyCard key={property.id} property={property} city={property.city_id ? citiesById.get(property.city_id) : undefined} locale={locale} />)}</div> : <ClassicEmptyState>{copy[locale].propertiesEmpty}</ClassicEmptyState>}
    </ClassicSection>
  );
}

export async function LatestPropertiesSection({ locale, config }: { locale: Locale; config: LatestPropertiesSectionConfig }) {
  const [result, cities] = await Promise.all([listPublicProperties({page_size:12}), listCities()]);
  const citiesById = new Map(cities.map((city) => [city.id, city]));
  const items = result.properties.slice(0, Math.min(Math.max(config.limit ?? 6, 1), 12));
  return (
    <ClassicSection className={classicToneClass(config.tone ?? 'soft')}>
      <ClassicSectionHeading title={config.title_ar || copy[locale].latest} align={config.heading_align} action={<SectionLink href={localizedPath(locale, '/properties')}>{copy[locale].allProperties}</SectionLink>} />
      {items.length ? <div className={`grid gap-5 ${classicColumnsClass(config.columns)}`}>{items.map((property) => <PropertyCard key={property.id} property={property} city={property.city_id ? citiesById.get(property.city_id) : undefined} locale={locale} />)}</div> : <ClassicEmptyState>{copy[locale].propertiesEmpty}</ClassicEmptyState>}
    </ClassicSection>
  );
}

export async function ProjectsShowcaseSection({ locale, config }: { locale: Locale; config: ProjectsShowcaseSectionConfig }) {
  const [result, cities] = await Promise.all([listPublicProjects(), listCities()]);
  const citiesById = new Map(cities.map((city) => [city.id, city]));
  const items = result.projects.slice(0, Math.min(Math.max(config.limit ?? 6, 1), 12));
  return (
    <ClassicSection className={classicToneClass(config.tone)}>
      <ClassicSectionHeading title={config.title_ar || copy[locale].projects} align={config.heading_align} action={<SectionLink href={localizedPath(locale, '/projects')}>{copy[locale].allProjects}</SectionLink>} />
      {items.length ? <div className={`grid gap-5 ${classicColumnsClass(config.columns)}`}>{items.map((project) => <ProjectCard key={project.id} project={project} city={citiesById.get(project.city_id)} locale={locale} />)}</div> : <ClassicEmptyState>{copy[locale].projectsEmpty}</ClassicEmptyState>}
    </ClassicSection>
  );
}

export async function PropertiesByCitySection({ locale, config }: { locale: Locale; config: PropertiesByCitySectionConfig }) {
  const [cities, propertyResult] = await Promise.all([listCities(), listPublicProperties({page_size:100})]);
  const inventoryCityIds = new Set(propertyResult.properties.map((property) => property.city_id));
  const configuredIds = new Set(config.city_ids ?? []);
  const selected = cities
    .filter((city) => inventoryCityIds.has(city.id))
    .filter((city) => configuredIds.size === 0 || configuredIds.has(city.id))
    .slice(0, 8);

  return (
    <ClassicSection className={classicToneClass(config.tone ?? 'soft')}>
      <ClassicSectionHeading title={config.title_ar || copy[locale].cities} align={config.heading_align} />
      {selected.length ? (
        <div className={`grid grid-cols-2 gap-3 ${classicColumnsClass(config.columns ?? 4)}`}>
          {selected.map((city) => (
            <Link
              key={city.id}
              href={`${localizedPath(locale, '/properties')}?city_id=${city.id}`}
              className="group flex min-h-28 items-end rounded-2xl border border-black/10 bg-white p-5 transition hover:-translate-y-0.5 hover:border-tenant-secondary hover:shadow-sm"
            >
              <span className="font-semibold text-black transition-colors group-hover:text-tenant-primary">{pickLocalized(locale, city.name_ar, city.name_en)}</span>
            </Link>
          ))}
        </div>
      ) : <ClassicEmptyState>{copy[locale].citiesEmpty}</ClassicEmptyState>}
    </ClassicSection>
  );
}
