import type { MetadataRoute } from 'next';

/**
 * PRODUCT_SPEC section 2: public-site should be installable too. Deliberately
 * static and سبعة-branded rather than per-tenant (a customer's own logo/name/
 * colors) — a real per-tenant manifest needs Host-based branding resolved at
 * request time (`getTenantSiteResult()`, already used in `[locale]/layout.tsx`)
 * AND icon files generated from each tenant's uploaded logo, which is a
 * genuinely separate image-processing feature, not part of this task's scope
 * ("PWA: manifest, أيقونات, Service Worker"). One static platform-level
 * manifest still makes the marketing homepage (sbaah.com) itself installable,
 * which is the concrete PRODUCT_SPEC requirement; tenant sites inherit it
 * (installable as "سبعة" until per-tenant branding ships later).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'سبعة',
    short_name: 'سبعة',
    description: 'منصة سبعة لإنشاء موقع عقاري احترافي في دقائق',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#68458A',
    lang: 'ar',
    dir: 'rtl',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
