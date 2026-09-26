import { isLocale, DEFAULT_LOCALE } from '@/lib/i18n/locales';
import { getTenantSitePage } from '@/lib/tenant/get-tenant-site';
import { resolveTheme } from '@/components/themes/registry';
import { LavenderProject } from '@/components/themes/lavender/cards';
import { renderThemedSection } from '@/lib/website/render-section';
import { listPublicProjects } from '@/lib/api/public-projects';
import { listCities } from '@/lib/api/reference-data';
import { ProjectCard } from '@/components/properties/project-card';
import { LavenderProjectFilters } from '@/components/themes/lavender/project-filters';

const PAGE_LABELS = {
  ar: {
    eyebrow: 'محفظة المشاريع',
    title: 'المشاريع العقارية',
    subtitle: 'استكشف مشاريعنا واطّلع على تفاصيل كل مشروع ونماذجه ووحداته المتاحة.',
    noResults: 'لا توجد مشاريع مطابقة للمدينة المختارة',
    count: 'مشروع',
  },
  en: {
    eyebrow: 'Project portfolio',
    title: 'Real estate projects',
    subtitle: 'Explore our developments, project models and currently available units.',
    noResults: 'No projects match the selected city',
    count: 'projects',
  },
};

/**
 * "المشاريع" page (متجر الثيمات follow-up, migration 0024) — same anchor
 * pattern as /properties: `project_grid`-type section marks where the
 * (unthemed) listing renders among this page's themed sections.
 */
export default async function ProjectsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const rawSearchParams = await searchParams;
  const cityId = Array.isArray(rawSearchParams.city_id)
    ? rawSearchParams.city_id[0]
    : rawSearchParams.city_id;
  const t = PAGE_LABELS[locale];

  const [site, cities, listResult] = await Promise.all([
    getTenantSitePage('projects'),
    listCities(),
    listPublicProjects(1, 50),
  ]);
  if (!site) return null;

  const citiesById = new Map(cities.map((city) => [city.id, city]));
  const projects = cityId
    ? listResult.projects.filter((project) => project.city_id === cityId)
    : listResult.projects;
  const tenantName = locale === 'ar' ? site.tenant.name_ar : site.tenant.name_en;
  const resolvedTheme = resolveTheme(site.website.theme_key);
  const theme = resolvedTheme.components;
  const isLavender = resolvedTheme.key === 'lavender';
  const ctx = {
    locale,
    bannerUrl: site.website.banner_image_url,
    bannerVideoUrl: site.website.banner_video_url,
    tenantName,
    whatsappPhone: site.whatsapp_phone,
    tenantId: site.tenant.id,
    themeKey: resolvedTheme.key,
  };

  const gridSection = site.sections.find((s) => s.type === 'project_grid');
  const before = site.sections.filter(
    (s) => s.type !== 'project_grid' && (!gridSection || s.order_index < gridSection.order_index),
  );
  const after = site.sections.filter(
    (s) => s.type !== 'project_grid' && gridSection && s.order_index > gridSection.order_index,
  );
  const hasPageHero = before.some((section) => section.type === 'hero');

  return (
    <div>
      {before.map((s) => renderThemedSection(s, theme, ctx))}

      {isLavender && !hasPageHero && (
        <section
          className={`bg-[#171713] px-5 pb-14 pt-16 text-white sm:px-6 sm:pb-20 sm:pt-24 ${before.length === 0 ? '-mt-24 pt-36 sm:pt-40' : ''}`}
        >
          <div className="mx-auto max-w-7xl border-t border-white/25 pt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-white/50">
              {t.eyebrow}
            </p>
            <div className="mt-5 grid gap-6 lg:grid-cols-[1.3fr_.7fr] lg:items-end">
              <h1 className="max-w-4xl text-4xl font-medium leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
                {t.title}
              </h1>
              <p className="max-w-xl text-sm leading-7 text-white/60 sm:text-base">{t.subtitle}</p>
            </div>
          </div>
        </section>
      )}

      {gridSection && (
        <div
          className={
            isLavender ? 'bg-[#f4f1ea] px-5 py-14 sm:px-6 sm:py-20' : 'mx-auto max-w-6xl px-6 py-8'
          }
        >
          <div className={isLavender ? 'mx-auto max-w-7xl' : ''}>
            {isLavender ? (
              <div className="mb-10">
                <div className="mb-7 flex items-end justify-between gap-5">
                  <h2 className="text-2xl font-medium sm:text-4xl">{t.title}</h2>
                  <span className="whitespace-nowrap text-xs text-black/45">
                    {projects.length} {t.count}
                  </span>
                </div>
                <LavenderProjectFilters locale={locale} cities={cities} cityId={cityId} />
              </div>
            ) : (
              <h1 className="mb-6 text-2xl font-bold">{t.title}</h1>
            )}
            {projects.length === 0 ? (
              <div
                className={
                  isLavender
                    ? 'border-y border-black/15 py-16 text-center text-sm text-black/55'
                    : 'text-black/60'
                }
              >
                {t.noResults}
              </div>
            ) : (
              <div
                className={
                  isLavender
                    ? 'grid gap-x-5 gap-y-8 sm:grid-cols-2'
                    : 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'
                }
              >
                {projects.map((project) =>
                  isLavender ? (
                    <LavenderProject
                      key={project.id}
                      project={project}
                      city={citiesById.get(project.city_id)}
                      locale={locale}
                    />
                  ) : (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      city={citiesById.get(project.city_id)}
                      locale={locale}
                    />
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {after.map((s) => renderThemedSection(s, theme, ctx))}
    </div>
  );
}
