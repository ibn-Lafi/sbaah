import type { ThemeSectionComponents } from './types';
import { classicTheme } from './classic';
import { modernTheme } from './modern';

/**
 * The theme registry — maps a `themes.key` (from the DB, resolved by
 * `api`'s `/v1/public/website`) to the component set that renders it.
 * Adding a theme means adding a new folder here + one line in this map;
 * see docs/THEMES.md for the full workflow. `classic` is "الثيم الأول"
 * (task-list theme system), unchanged visually from before this system
 * existed — just now addressable by key instead of hardcoded.
 */
const THEME_REGISTRY: Record<string, ThemeSectionComponents> = {
  classic: classicTheme,
  modern: modernTheme,
};

export const DEFAULT_THEME_KEY = 'classic';

/** Falls back to the default theme for an unknown/missing key (e.g. a theme later deactivated) rather than failing the whole page render. */
export function getThemeComponents(themeKey: string | null | undefined): ThemeSectionComponents {
  const resolved = themeKey ? THEME_REGISTRY[themeKey] : undefined;
  return resolved ?? classicTheme;
}
