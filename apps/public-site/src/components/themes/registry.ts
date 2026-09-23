import type { ThemeSectionComponents } from './types';
import type { WebsiteSectionType } from '@sbaah/shared';
import { classicTheme } from './classic';

/**
 * Theme registry.
 *
 * Keep theme resolution and theme identity separate: callers sometimes need
 * to know which theme actually won the fallback, not only its components.
 * This is important for theme-specific section libraries (Classic today,
 * additional marketplace themes later).
 */
export const DEFAULT_THEME_KEY = 'classic' as const;

const CLASSIC_SUPPORTED_SECTIONS = new Set<WebsiteSectionType>(['hero','property_grid','featured_properties','latest_properties','projects_showcase','properties_by_city','stats','services','faq','cta','promo_banner','free_content','gallery','video','about','why_us','map']);

const THEME_REGISTRY = {
  [DEFAULT_THEME_KEY]: { components: classicTheme, supportedSections: CLASSIC_SUPPORTED_SECTIONS },
} satisfies Record<string, {components:ThemeSectionComponents;supportedSections:ReadonlySet<WebsiteSectionType>}>;

export interface ResolvedTheme {
  key: string;
  components: ThemeSectionComponents;
}

/** Unknown/deactivated legacy keys resolve safely to the marketplace default. */
export function resolveTheme(themeKey: string | null | undefined): ResolvedTheme {
  const fallback = THEME_REGISTRY[DEFAULT_THEME_KEY];

  if (themeKey && Object.prototype.hasOwnProperty.call(THEME_REGISTRY, themeKey)) {
    return {
      key: themeKey,
      components: THEME_REGISTRY[themeKey as keyof typeof THEME_REGISTRY].components,
    };
  }

  return { key: DEFAULT_THEME_KEY, components: fallback.components };
}

/** Backwards-compatible component-only helper for layouts and existing pages. */
export function getThemeComponents(themeKey: string | null | undefined): ThemeSectionComponents {
  return resolveTheme(themeKey).components;
}

export function isThemeKey(themeKey: string | null | undefined, expected: string): boolean {
  return resolveTheme(themeKey).key === expected;
}

export function themeSupportsSection(themeKey:string|null|undefined,sectionType:WebsiteSectionType):boolean{const resolvedKey=resolveTheme(themeKey).key;return THEME_REGISTRY[resolvedKey as keyof typeof THEME_REGISTRY].supportedSections.has(sectionType);}
