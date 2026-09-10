import type { ComponentType, ReactNode } from 'react';
import type { AboutSectionConfig, ContactSectionConfig, HeroSectionConfig, PropertyGridSectionConfig } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';

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

/** `PropertyGridSection` fetches data server-side, so it's an async component — the others are plain sync components. */
type SectionComponent<P> = ComponentType<P> | ((props: P) => Promise<ReactNode>);

export interface ThemeSectionComponents {
  HeroSection: SectionComponent<HeroSectionProps>;
  PropertyGridSection: SectionComponent<PropertyGridSectionProps>;
  TextSection: SectionComponent<TextSectionProps>;
  ContactSection: SectionComponent<ContactSectionProps>;
}
