import type { WebsiteSection } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import type { ThemeSectionComponents } from '@/components/themes/types';

/**
 * Renders one THEMED section (hero/about/why_us/contact) via the active
 * theme's components — shared by every non-home page (`/properties`,
 * `/projects`, `/properties/[id]`, `/about`, `/contact`) so the switch
 * isn't duplicated 5 times. Deliberately does NOT handle `property_grid`,
 * `project_grid`, `property_detail`, or `footer` — those are each page's
 * own data-driven anchor (or, for footer, the layout's fixed badge), not
 * theme-branched content; see migration 0024's header comment.
 */
export function renderThemedSection(
  section: Pick<WebsiteSection, 'id' | 'type' | 'config'>,
  theme: ThemeSectionComponents,
  ctx: { locale: Locale; bannerUrl: string | null; tenantName: string; whatsappPhone: string; tenantId: string },
): React.ReactNode {
  switch (section.type) {
    case 'hero':
      return (
        <theme.HeroSection
          key={section.id}
          locale={ctx.locale}
          config={section.config}
          bannerUrl={ctx.bannerUrl}
          tenantName={ctx.tenantName}
        />
      );
    case 'about':
    case 'why_us':
      return <theme.TextSection key={section.id} type={section.type} locale={ctx.locale} config={section.config} />;
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
    default:
      return null;
  }
}
