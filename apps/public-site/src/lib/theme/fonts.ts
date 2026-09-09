import { IBM_Plex_Sans_Arabic, Cairo, Tajawal, Almarai } from 'next/font/google';
import type { SupportedWebsiteFont } from '@sbaah/shared';

/**
 * `next/font/google` requires a statically-known font at build time, so
 * all four fonts a tenant can pick in the site editor (task 28/42,
 * `SUPPORTED_WEBSITE_FONTS`) are loaded here up front; the tenant's own
 * `website.font_family` then just picks which one's `.className` gets
 * applied to `<body>` at render time — no per-request font fetch.
 */
const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({ subsets: ['arabic'], weight: ['400', '500', '600', '700'] });
const cairo = Cairo({ subsets: ['arabic'], weight: ['400', '500', '600', '700'] });
const tajawal = Tajawal({ subsets: ['arabic'], weight: ['400', '500', '700'] });
const almarai = Almarai({ subsets: ['arabic'], weight: ['400', '700'] });

const FONT_BY_NAME: Record<SupportedWebsiteFont, { className: string }> = {
  'IBM Plex Sans Arabic': ibmPlexSansArabic,
  Cairo: cairo,
  Tajawal: tajawal,
  Almarai: almarai,
};

/** Falls back to Tajawal, matching `websites.font_family`'s own DB default (migration 0002). */
export function resolveWebsiteFont(fontFamily: string) {
  return FONT_BY_NAME[fontFamily as SupportedWebsiteFont] ?? tajawal;
}
