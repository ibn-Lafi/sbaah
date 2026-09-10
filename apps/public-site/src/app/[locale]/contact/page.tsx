import { isLocale, DEFAULT_LOCALE } from '@/lib/i18n/locales';
import { getTenantSitePage } from '@/lib/tenant/get-tenant-site';
import { getThemeComponents } from '@/components/themes/registry';
import { renderThemedSection } from '@/lib/website/render-section';

/** "تواصل معنا" page (متجر الثيمات follow-up, migration 0024) — every section here is themed (no data-driven anchor). */
export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  const site = await getTenantSitePage('contact');
  if (!site) return null;

  const tenantName = locale === 'ar' ? site.tenant.name_ar : site.tenant.name_en;
  const theme = getThemeComponents(site.website.theme_key);
  const ctx = { locale, bannerUrl: site.website.banner_image_url, tenantName, whatsappPhone: site.whatsapp_phone, tenantId: site.tenant.id };

  return <div>{site.sections.map((s) => renderThemedSection(s, theme, ctx))}</div>;
}
