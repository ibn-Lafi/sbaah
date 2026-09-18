export type Theme = 'light' | 'dark';
export type ThemePreference = Theme | 'system';

export const DEFAULT_THEME: Theme = 'light';
export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';
export const THEME_STORAGE_KEY = 'sbaah-theme';

export function resolveSystemTheme(): Theme {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
