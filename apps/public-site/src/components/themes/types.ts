import type { ComponentType, ReactNode } from 'react';
import type { AboutSectionConfig, ContactSectionConfig, HeroSectionConfig, PropertyGridSectionConfig } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import type { getDictionary } from '@/lib/i18n/dictionary';
import type { TenantSite } from '@/lib/tenant/get-tenant-site';

/**
 * The per-section prop shapes every theme's component set must implement.
 * These come straight from `website_sections.config` (theme-agnostic,
 * authored once in the dashboard's section editor) — a theme changes HOW
 * a section looks, never what data it's given. Adding a theme means
 * writing new components against these exact same props; see docs/THEMES.md.
 */
export interface HeroSectionProps {
  locale: Locale;
  config: HeroSectionConfig;
  bannerUrl: string | null;
  tenantName: string;
}

export interface PropertyGridSectionProps {
  locale: Locale;
  config: PropertyGridSectionConfig;
}

export interface TextSectionProps {
  type: 'about' | 'why_us';
  locale: Locale;
  config: AboutSectionConfig;
}

export interface ContactSectionProps {
  locale: Locale;
  config: ContactSectionConfig;
  whatsappPhone: string;
  tenantId: string;
}

/**
 * Site-wide chrome, not a `website_sections` row — every page gets
 * exactly one of each, rendered by the root layout. Still fully
 * theme-owned (not hardcoded in the layout) so a future theme can give
 * the whole shell — announcement bar, nav header, footer — a completely
 * different look without touching shared code; see docs/THEMES.md.
 */
export interface HeaderProps {
  locale: Locale;
  dict: ReturnType<typeof getDictionary>;
  website: TenantSite['website'];
  tenantName: string;
  otherLocaleHref: string;
}

export interface FooterProps {
  locale: Locale;
  dict: ReturnType<typeof getDictionary>;
  tenant: TenantSite['tenant'];
  website: TenantSite['website'];
  customPages: TenantSite['custom_pages'];
}

/** `PropertyGridSection` fetches data server-side, so it's an async component — the others are plain sync components. */
type SectionComponent<P> = ComponentType<P> | ((props: P) => Promise<ReactNode>);

export interface ThemeSectionComponents {
  HeroSection: SectionComponent<HeroSectionProps>;
  PropertyGridSection: SectionComponent<PropertyGridSectionProps>;
  TextSection: SectionComponent<TextSectionProps>;
  ContactSection: SectionComponent<ContactSectionProps>;
  Header: SectionComponent<HeaderProps>;
  Footer: SectionComponent<FooterProps>;
}
