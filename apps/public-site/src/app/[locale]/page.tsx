import { isLocale, DEFAULT_LOCALE } from '@/lib/i18n/locales';
import { getTenantSite } from '@/lib/tenant/get-tenant-site';
import { isMarketingHost } from '@/lib/tenant/get-host';
import { MarketingHome } from '@/components/marketing-home';
import { getThemeComponents } from '@/components/themes/registry';
import { listCities } from '@/lib/api/reference-data';
import { BrokerMarketerForm } from '@/components/broker-marketer/broker-marketer-form';

/**
 * Renders `website_sections` in order (task 35/42) — replaces the
 * placeholder "قريبًا"/"Coming soon" that stood in since the app was
 * first scaffolded (task 32/42). `footer`-type sections render nothing
 * here: the mandatory سبعة badge lives unconditionally in the layout's
 * own `<footer>` (never toggleable), and `footer` currently has no
 * other editable content (see SectionConfigEditor, dashboard).
 *
 * Which components render each `section.type` depends on the tenant's
 * theme (متجر الثيمات) — `getThemeComponents` resolves `site.website.theme_key`
 * to a component set via the registry; see components/themes/registry.ts
 * and docs/THEMES.md.
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  // سبعة's own marketing homepage (not a tenant site) — the bare
  // platform root domain never goes through tenant resolution at all;
  // see `[locale]/layout.tsx` for the matching chrome branch.
  if (await isMarketingHost()) {
    return <MarketingHome locale={locale} />;
  }

  const site = await getTenantSite();
  if (!site) return null; // layout.tsx already calls notFound() in this case

  const tenantName = locale === 'ar' ? site.tenant.name_ar : site.tenant.name_en;
  const { HeroSection, PropertyGridSection, TextSection, ContactSection } = getThemeComponents(site.website.theme_key);
  const hasBrokerMarketerForm = site.sections.some((s) => s.type === 'broker_marketer_form');
  const cities = hasBrokerMarketerForm ? await listCities() : [];

  return (
    <div>
      {site.sections.map((section) => {
        switch (section.type) {
          case 'hero':
            return (
              <HeroSection
                key={section.id}
                locale={locale}
                config={section.config}
                bannerUrl={site.website.banner_image_url}
                tenantName={tenantName}
              />
            );
          case 'property_grid':
            return <PropertyGridSection key={section.id} locale={locale} config={section.config} />;
          case 'about':
          case 'why_us':
            return <TextSection key={section.id} type={section.type} locale={locale} config={section.config} />;
          case 'contact':
            return (
              <ContactSection
                key={section.id}
                locale={locale}
                config={section.config}
                whatsappPhone={site.whatsapp_phone}
                tenantId={site.tenant.id}
              />
            );
          case 'broker_marketer_form':
            return <BrokerMarketerForm key={section.id} locale={locale} tenantId={site.tenant.id} cities={cities} />;
          case 'footer':
          default:
            return null;
        }
      })}
    </div>
  );
}
