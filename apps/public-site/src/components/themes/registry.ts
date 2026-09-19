import type { ThemeSectionComponents } from './types';
import { classicTheme } from './classic';

/**
 * Theme registry.
 *
 * Keep theme resolution and theme identity separate: callers sometimes need
 * to know which theme actually won the fallback, not only its components.
 * This is important for theme-specific section libraries (Classic today,
 * additional marketplace themes later).
 */
const THEME_REGISTRY: Record<string, ThemeSectionComponents> = {
  classic: classicTheme,
};

export const DEFAULT_THEME_KEY = 'classic';

export interface ResolvedTheme {
  key: string;
  components: ThemeSectionComponents;
}

/** Unknown/deactivated legacy keys resolve safely to the marketplace default. */
export function resolveTheme(themeKey: string | null | undefined): ResolvedTheme {
  if (themeKey && THEME_REGISTRY[themeKey]) {
    return { key: themeKey, components: THEME_REGISTRY[themeKey] };
  }
  return { key: DEFAULT_THEME_KEY, components: THEME_REGISTRY[DEFAULT_THEME_KEY] };
}

/** Backwards-compatible component-only helper for layouts and existing pages. */
export function getThemeComponents(themeKey: string | null | undefined): ThemeSectionComponents {
  return resolveTheme(themeKey).components;
}

export function isThemeKey(themeKey: string | null | undefined, expected: string): boolean {
  return resolveTheme(themeKey).key === expected;
}
