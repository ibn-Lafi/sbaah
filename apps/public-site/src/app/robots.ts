import type { MetadataRoute } from 'next';
import { isMarketingHost } from '@/lib/tenant/get-host';
import { getTenantSite } from '@/lib/tenant/get-tenant-site';
import { canonicalTenantOrigin, getPublicOrigin } from '@/lib/routing/public-url';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const requestOrigin = await getPublicOrigin();
  if (!requestOrigin) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  const origin = await isMarketingHost()
    ? requestOrigin
    : canonicalTenantOrigin(requestOrigin, (await getTenantSite())?.tenant.custom_domain ?? null);

  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
