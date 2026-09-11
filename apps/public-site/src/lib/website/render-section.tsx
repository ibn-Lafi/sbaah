import type { City, WebsiteSection } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import type { ThemeSectionComponents } from '@/components/themes/types';
import { BrokerMarketerForm } from '@/components/broker-marketer/broker-marketer-form';

/**
 * Renders one THEMED section (hero/about/why_us/contact/broker_marketer_form)
 * via the active theme's components — shared by every non-home page
 * (`/properties`, `/projects`, `/properties/[id]`, `/about`, `/contact`)
 * so the switch isn't duplicated 5 times. Deliberately does NOT handle
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
    tenantName: string;
    whatsappPhone: string;
    tenantId: string;
    /** Only set on the property_detail page — ties a submission to the property being viewed. */
    propertyId?: string;
    cities?: City[];
  },
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
    case 'broker_marketer_form':
      return (
        <BrokerMarketerForm
          key={section.id}
          locale={ctx.locale}
          tenantId={ctx.tenantId}
          propertyId={ctx.propertyId}
          cities={ctx.cities ?? []}
        />
      );
    default:
      return null;
  }
}
