import type { MetadataRoute } from 'next';
import { isMarketingHost } from '@/lib/tenant/get-host';
import { getTenantSite } from '@/lib/tenant/get-tenant-site';
import { listPublicProperties } from '@/lib/api/public-properties';
import { listPublicProjects } from '@/lib/api/public-projects';
import { canonicalTenantOrigin, getPublicOrigin, localizedPath } from '@/lib/routing/public-url';

const PAGE_SIZE_FALLBACK = 20;

async function allPropertySlugs(): Promise<string[]> {
  const slugs: string[] = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while (slugs.length < total) {
    const result = await listPublicProperties({ page });
    total = result.total;
    slugs.push(...result.properties.map((property) => property.slug).filter((slug): slug is string => Boolean(slug)));
    if (result.properties.length === 0 || result.page_size <= 0) break;
    page += 1;
    if (page > Math.ceil(total / (result.page_size || PAGE_SIZE_FALLBACK)) + 1) break;
  }

  return slugs;
}

async function allProjectSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while (slugs.length < total) {
    const result = await listPublicProjects(page);
    total = result.total;
    slugs.push(...result.projects.map((project) => project.slug));
    if (result.projects.length === 0 || result.page_size <= 0) break;
    page += 1;
    if (page > Math.ceil(total / (result.page_size || PAGE_SIZE_FALLBACK)) + 1) break;
  }

  return slugs;
}

function localizedEntries(origin: string, pathname: string): MetadataRoute.Sitemap {
  return (['ar', 'en'] as const).map((locale) => ({
    url: `${origin}${localizedPath(locale, pathname)}`,
    changeFrequency: pathname === '/' ? 'daily' : 'weekly',
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await getPublicOrigin();
  if (!origin) return [];

  if (await isMarketingHost()) {
    return localizedEntries(origin, '/');
  }

  const site = await getTenantSite();
  if (!site) return [];
  const canonicalOrigin = canonicalTenantOrigin(origin, site.tenant.custom_domain);

  const [propertySlugs, projectSlugs] = await Promise.all([allPropertySlugs(), allProjectSlugs()]);
  const paths = [
    '/',
    '/properties',
    '/projects',
    ...propertySlugs.map((slug) => `/properties/${slug}`),
    ...projectSlugs.map((slug) => `/projects/${slug}`),
  ];

  const localized = paths.flatMap((path) => localizedEntries(canonicalOrigin, path));
  const customPages = site.custom_pages.map((page) => ({
    url: `${canonicalOrigin}/pages/${page.slug}`,
    changeFrequency: 'weekly' as const,
  }));
  return [...localized, ...customPages];
}
