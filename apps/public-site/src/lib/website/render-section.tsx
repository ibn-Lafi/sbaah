import type { City, WebsiteSection } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import type { ThemeSectionComponents } from '@/components/themes/types';
import { MapSection } from '@/components/map/map-section';
import {
  FeaturedPropertiesSection,
  LatestPropertiesSection,
  ProjectsShowcaseSection,
  PropertiesByCitySection,
} from '@/components/themes/classic/data-sections';
import {
  StatsSection,
  ServicesSection,
  FaqSection,
  CtaSection,
  PromoBannerSection,
  FreeContentSection,
  GallerySection,
  VideoSection,
} from '@/components/themes/classic/content-sections';
import {
  LavenderFeaturedProperties,
  LavenderLatestProperties,
  LavenderProjects,
  LavenderCities,
} from '@/components/themes/lavender/data-sections';
import {
  LavenderStats,
  LavenderServices,
  LavenderFaq,
  LavenderCta,
  LavenderPromo,
  LavenderFreeContent,
  LavenderGallery,
  LavenderVideo,
} from '@/components/themes/lavender/content-sections';

/**
 * Renders one THEMED section (hero/about/why_us/contact/broker_marketer_form)
 * via the active theme's components — shared by every non-home page
 * (`/properties`, `/projects`, `/properties/[id]`) so the switch isn't
 * duplicated 3 times. Deliberately does NOT handle
 * `property_grid`, `project_grid`, `property_detail`, or `footer` — those
 * are each page's own data-driven anchor (or, for footer, the layout's
 * fixed badge), not theme-branched content; see migration 0024's header
 * comment. `broker_marketer_form` is only ever actually seeded on `home`
 * and `property_detail` pages (migration 0032) — harmless no-op on the
 * others since no such section row exists there.
 */
export function renderThemedSection(
  section: Pick<WebsiteSection, 'id' | 'type' | 'config'>,
  theme: ThemeSectionComponents,
  ctx: {
    locale: Locale;
    bannerUrl: string | null;
    bannerVideoUrl: string | null;
    tenantName: string;
    whatsappPhone: string;
    tenantId: string;
    /** Only set on the property_detail page — ties a submission to the property being viewed. */
    assetId?: string;
    projectId?: string;
    listingId?: string;
    cities?: City[];
    themeKey?: string;
  },
): React.ReactNode {
  const lavender = ctx.themeKey === 'lavender';
  switch (section.type) {
    case 'hero':
      return (
        <theme.HeroSection
          key={section.id}
          locale={ctx.locale}
          config={section.config}
          bannerUrl={ctx.bannerUrl}
          bannerVideoUrl={ctx.bannerVideoUrl}
          tenantName={ctx.tenantName}
        />
      );
    case 'about':
    case 'why_us':
      return (
        <theme.TextSection
          key={section.id}
          type={section.type}
          locale={ctx.locale}
          config={section.config}
        />
      );
    case 'property_request':
      return (
        <theme.LeadSection
          key={section.id}
          locale={ctx.locale}
          tenantId={ctx.tenantId}
          projectId={ctx.projectId}
          assetId={ctx.listingId ? undefined : ctx.assetId}
          listingId={ctx.listingId}
          config={section.config}
        />
      );
    case 'contact':
      return (
        <theme.ContactSection
          key={section.id}
          locale={ctx.locale}
          config={section.config}
          whatsappPhone={ctx.whatsappPhone}
          tenantId={ctx.tenantId}
        />
      );
    case 'featured_properties':
      return lavender ? (
        <LavenderFeaturedProperties key={section.id} locale={ctx.locale} config={section.config} />
      ) : (
        <FeaturedPropertiesSection key={section.id} locale={ctx.locale} config={section.config} />
      );
    case 'latest_properties':
      return lavender ? (
        <LavenderLatestProperties key={section.id} locale={ctx.locale} config={section.config} />
      ) : (
        <LatestPropertiesSection key={section.id} locale={ctx.locale} config={section.config} />
      );
    case 'projects_showcase':
      return lavender ? (
        <LavenderProjects key={section.id} locale={ctx.locale} config={section.config} />
      ) : (
        <ProjectsShowcaseSection key={section.id} locale={ctx.locale} config={section.config} />
      );
    case 'properties_by_city':
      return lavender ? (
        <LavenderCities key={section.id} locale={ctx.locale} config={section.config} />
      ) : (
        <PropertiesByCitySection key={section.id} locale={ctx.locale} config={section.config} />
      );
    case 'stats':
      return lavender ? (
        <LavenderStats key={section.id} locale={ctx.locale} config={section.config} />
      ) : (
        <StatsSection key={section.id} locale={ctx.locale} config={section.config} />
      );
    case 'services':
      return lavender ? (
        <LavenderServices key={section.id} locale={ctx.locale} config={section.config} />
      ) : (
        <ServicesSection key={section.id} locale={ctx.locale} config={section.config} />
      );
    case 'faq':
      return lavender ? (
        <LavenderFaq key={section.id} locale={ctx.locale} config={section.config} />
      ) : (
        <FaqSection key={section.id} locale={ctx.locale} config={section.config} />
      );
    case 'cta':
      return lavender ? (
        <LavenderCta key={section.id} locale={ctx.locale} config={section.config} />
      ) : (
        <CtaSection key={section.id} locale={ctx.locale} config={section.config} />
      );
    case 'promo_banner':
      return lavender ? (
        <LavenderPromo key={section.id} locale={ctx.locale} config={section.config} />
      ) : (
        <PromoBannerSection key={section.id} locale={ctx.locale} config={section.config} />
      );
    case 'free_content':
      return lavender ? (
        <LavenderFreeContent key={section.id} locale={ctx.locale} config={section.config} />
      ) : (
        <FreeContentSection key={section.id} locale={ctx.locale} config={section.config} />
      );
    case 'gallery':
      return lavender ? (
        <LavenderGallery key={section.id} locale={ctx.locale} config={section.config} />
      ) : (
        <GallerySection key={section.id} locale={ctx.locale} config={section.config} />
      );
    case 'video':
      return lavender ? (
        <LavenderVideo key={section.id} locale={ctx.locale} config={section.config} />
      ) : (
        <VideoSection key={section.id} locale={ctx.locale} config={section.config} />
      );
    case 'map':
      return (
        <MapSection
          key={section.id}
          locale={ctx.locale}
          variant={lavender ? 'lavender' : 'default'}
        />
      );
    default:
      return null;
  }
}
