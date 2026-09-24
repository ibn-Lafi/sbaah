import { isLocale, DEFAULT_LOCALE } from '@/lib/i18n/locales';
import { getTenantSitePage } from '@/lib/tenant/get-tenant-site';
import { resolveTheme } from '@/components/themes/registry';
import { LavenderProject } from '@/components/themes/lavender/cards';
import { renderThemedSection } from '@/lib/website/render-section';
import { listPublicProjects } from '@/lib/api/public-projects';
import { listCities } from '@/lib/api/reference-data';
import { ProjectCard } from '@/components/properties/project-card';

const PAGE_LABELS = { ar: { title: 'المشاريع', noResults: 'لا توجد مشاريع منشورة بعد' }, en: { title: 'Projects', noResults: 'No published projects yet' } };

/**
 * "المشاريع" page (متجر الثيمات follow-up, migration 0024) — same anchor
 * pattern as /properties: `project_grid`-type section marks where the
 * (unthemed) listing renders among this page's themed sections.
 */
export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const t = PAGE_LABELS[locale];

  const [site, cities, listResult] = await Promise.all([getTenantSitePage('projects'), listCities(), listPublicProjects()]);
  if (!site) return null;

  const citiesById = new Map(cities.map((city) => [city.id, city]));
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
  };

  const gridSection = site.sections.find((s) => s.type === 'project_grid');
  const before = site.sections.filter((s) => s.type !== 'project_grid' && (!gridSection || s.order_index < gridSection.order_index));
  const after = site.sections.filter((s) => s.type !== 'project_grid' && gridSection && s.order_index > gridSection.order_index);

  return (
    <div>
      {before.map((s) => renderThemedSection(s, theme, ctx))}

      {gridSection && (
        <div className={isLavender ? "bg-[#f4f1ea] px-5 py-16 sm:px-6 sm:py-24" : "mx-auto max-w-6xl px-6 py-8"}><div className={isLavender ? "mx-auto max-w-7xl" : ""}>
          <h1 className={isLavender ? "mb-10 border-b border-black/20 pb-6 text-4xl font-medium sm:text-6xl" : "mb-6 text-2xl font-bold"}>{t.title}</h1>
          {listResult.projects.length === 0 ? (
            <p className="text-black/60">{t.noResults}</p>
          ) : (
            <div className={isLavender ? "grid gap-3 lg:grid-cols-2" : "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"}>
              {listResult.projects.map((project,index) => isLavender ? <LavenderProject key={project.id} project={project} city={citiesById.get(project.city_id)} locale={locale} featured={index===0}/> : <ProjectCard key={project.id} project={project} city={citiesById.get(project.city_id)} locale={locale} />)}
            </div>
          )}
        </div></div>
      )}

      {after.map((s) => renderThemedSection(s, theme, ctx))}
    </div>
  );
}
