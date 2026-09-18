import type { MetadataRoute } from 'next';
import { isMarketingHost } from '@/lib/tenant/get-host';
import { getTenantSite } from '@/lib/tenant/get-tenant-site';
import { listPublicProperties } from '@/lib/api/public-properties';
import { listPublicProjects } from '@/lib/api/public-projects';
import { canonicalTenantOrigin, getPublicOrigin, localizedPath } from '@/lib/routing/public-url';

const PAGE_SIZE_FALLBACK = 20;

async function allPropertyIds(): Promise<string[]> {
  const ids: string[] = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while (ids.length < total) {
    const result = await listPublicProperties({ page });
    total = result.total;
    ids.push(...result.properties.map((property) => property.id));
    if (result.properties.length === 0 || result.page_size <= 0) break;
    page += 1;
    if (page > Math.ceil(total / (result.page_size || PAGE_SIZE_FALLBACK)) + 1) break;
  }

  return ids;
}

async function allProjectIds(): Promise<string[]> {
  const ids: string[] = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while (ids.length < total) {
    const result = await listPublicProjects(page);
    total = result.total;
    ids.push(...result.projects.map((project) => project.id));
    if (result.projects.length === 0 || result.page_size <= 0) break;
    page += 1;
    if (page > Math.ceil(total / (result.page_size || PAGE_SIZE_FALLBACK)) + 1) break;
  }

  return ids;
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

  const [propertyIds, projectIds] = await Promise.all([allPropertyIds(), allProjectIds()]);
  const paths = [
    '/',
    '/properties',
    '/projects',
    ...propertyIds.map((id) => `/properties/${id}`),
    ...projectIds.map((id) => `/projects/${id}`),
  ];

  const localized = paths.flatMap((path) => localizedEntries(canonicalOrigin, path));
  const customPages = site.custom_pages.map((page) => ({
    url: `${canonicalOrigin}/pages/${page.slug}`,
    changeFrequency: 'weekly' as const,
  }));
  return [...localized, ...customPages];
}
