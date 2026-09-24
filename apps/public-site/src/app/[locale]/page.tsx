import { isLocale, DEFAULT_LOCALE } from '@/lib/i18n/locales';
import { getTenantSite } from '@/lib/tenant/get-tenant-site';
import { isMarketingHost } from '@/lib/tenant/get-host';
import { MarketingHome } from '@/components/marketing-home';
import { resolveTheme, themeSupportsSection } from '@/components/themes/registry';
import { MapSection } from '@/components/map/map-section';
import { FeaturedPropertiesSection, LatestPropertiesSection, ProjectsShowcaseSection, PropertiesByCitySection } from '@/components/themes/classic/data-sections';
import { StatsSection, ServicesSection, FaqSection, CtaSection, PromoBannerSection, FreeContentSection, GallerySection, VideoSection } from '@/components/themes/classic/content-sections';

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
  const resolvedTheme = resolveTheme(site.website.theme_key);
  const { HeroSection, PropertyGridSection, TextSection } = resolvedTheme.components;

  return (
    <div>
      {site.sections.map((section) => {
        if(!themeSupportsSection(resolvedTheme.key,section.type)) return null;
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
          case 'featured_properties': return <FeaturedPropertiesSection key={section.id} locale={locale} config={section.config} />;
          case 'latest_properties': return <LatestPropertiesSection key={section.id} locale={locale} config={section.config} />;
          case 'projects_showcase': return <ProjectsShowcaseSection key={section.id} locale={locale} config={section.config} />;
          case 'properties_by_city': return <PropertiesByCitySection key={section.id} locale={locale} config={section.config} />;
          case 'stats': return <StatsSection key={section.id} locale={locale} config={section.config} />;
          case 'services': return <ServicesSection key={section.id} locale={locale} config={section.config} />;
          case 'faq': return <FaqSection key={section.id} locale={locale} config={section.config} />;
          case 'cta': return <CtaSection key={section.id} locale={locale} config={section.config} />;
          case 'promo_banner': return <PromoBannerSection key={section.id} locale={locale} config={section.config} />;
          case 'free_content': return <FreeContentSection key={section.id} locale={locale} config={section.config} />;
          case 'gallery': return <GallerySection key={section.id} locale={locale} config={section.config} />;
          case 'video': return <VideoSection key={section.id} locale={locale} config={section.config} />;
          case 'about':
          case 'why_us':
            return <TextSection key={section.id} type={section.type} locale={locale} config={section.config} />;
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
