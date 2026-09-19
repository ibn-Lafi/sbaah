import { isLocale, DEFAULT_LOCALE } from '@/lib/i18n/locales';
import { getTenantSite } from '@/lib/tenant/get-tenant-site';
import { isMarketingHost } from '@/lib/tenant/get-host';
import { MarketingHome } from '@/components/marketing-home';
import { getThemeComponents } from '@/components/themes/registry';
import { listCities } from '@/lib/api/reference-data';
import { BrokerMarketerForm } from '@/components/broker-marketer/broker-marketer-form';
import { MapSection } from '@/components/map/map-section';
import { FeaturedPropertiesSection, LatestPropertiesSection, ProjectsShowcaseSection, PropertiesByCitySection } from '@/components/themes/classic/data-sections';
import { StatsSection, ServicesSection, FaqSection, CtaSection, PropertyRequestSection, PromoBannerSection, FreeContentSection, GallerySection, VideoSection } from '@/components/themes/classic/content-sections';

/**
 * Renders `website_sections` in order (task 35/42) — replaces the
 * placeholder "قريبًا"/"Coming soon" that stood in since the app was
 * first scaffolded (task 32/42). `footer`-type sections render nothing
 * here: the mandatory سبعة badge lives unconditionally in the layout's
 * own `<footer>` (never toggleable), and `footer` currently has no
 * other editable content (see SectionConfigEditor, dashboard).
 *
 * `contact`-type sections also render nothing here (founder's explicit
 * call — the footer already carries the phone/WhatsApp/address block,
 * so a second one on the home page was redundant): a `contact` row may
 * still exist in this tenant's `website_sections` data (seeded before
 * this change), but the home page ignores it unconditionally regardless
 * of that row's `is_visible` toggle. The /about and /contact pages that
 * used to render `contact` sections were removed entirely (migration
 * 0038) — nothing in the site links to them anymore.
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
  const theme = getThemeComponents(site.website.theme_key);
  const { HeroSection, PropertyGridSection, TextSection } = theme;
  const isClassic = site.website.theme_key === 'classic';
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
                bannerVideoUrl={site.website.banner_video_url}
                tenantName={tenantName}
              />
            );
          case 'property_grid':
            return <PropertyGridSection key={section.id} locale={locale} config={section.config} />;
          case 'featured_properties': return isClassic ? <FeaturedPropertiesSection key={section.id} locale={locale} config={section.config} /> : null;
          case 'latest_properties': return isClassic ? <LatestPropertiesSection key={section.id} locale={locale} config={section.config} /> : null;
          case 'projects_showcase': return isClassic ? <ProjectsShowcaseSection key={section.id} locale={locale} config={section.config} /> : null;
          case 'properties_by_city': return isClassic ? <PropertiesByCitySection key={section.id} locale={locale} config={section.config} /> : null;
          case 'stats': return isClassic ? <StatsSection key={section.id} locale={locale} config={section.config} /> : null;
          case 'services': return isClassic ? <ServicesSection key={section.id} locale={locale} config={section.config} /> : null;
          case 'faq': return isClassic ? <FaqSection key={section.id} locale={locale} config={section.config} /> : null;
          case 'cta': return isClassic ? <CtaSection key={section.id} locale={locale} config={section.config} /> : null;
          case 'property_request': return isClassic ? <PropertyRequestSection key={section.id} locale={locale} config={section.config} /> : null;
          case 'promo_banner': return isClassic ? <PromoBannerSection key={section.id} locale={locale} config={section.config} /> : null;
          case 'free_content': return isClassic ? <FreeContentSection key={section.id} locale={locale} config={section.config} /> : null;
          case 'gallery': return isClassic ? <GallerySection key={section.id} locale={locale} config={section.config} /> : null;
          case 'video': return isClassic ? <VideoSection key={section.id} locale={locale} config={section.config} /> : null;
          case 'about':
          case 'why_us':
            return <TextSection key={section.id} type={section.type} locale={locale} config={section.config} />;
          case 'broker_marketer_form':
            return <BrokerMarketerForm key={section.id} locale={locale} tenantId={site.tenant.id} cities={cities} />;
          case 'map':
            return <MapSection key={section.id} locale={locale} />;
          case 'contact':
          case 'footer':
          default:
            return null;
        }
      })}
    </div>
  );
}
