import type { MetadataRoute } from 'next';

/**
 * Makes `dashboard` installable (PRODUCT_SPEC section 2: "قابلة للإضافة
 * للشاشة الرئيسية"). Static — one tenant-agnostic app, unlike public-site
 * which serves a different tenant per Host header (see that app's own
 * manifest.ts for why it stays static too, deliberately not per-tenant).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'سبعة — لوحة التحكم',
    short_name: 'سبعة',
    description: 'لوحة تحكم سبعة لإدارة العقارات والعملاء المحتملين',
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
