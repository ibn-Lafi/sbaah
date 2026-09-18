import type { MetadataRoute } from 'next';
import { getPublicOrigin } from '@/lib/routing/public-url';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await getPublicOrigin();
  if (!origin) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
