'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_THEME_PREFERENCE, THEME_STORAGE_KEY, resolveSystemTheme, type Theme, type ThemePreference } from './theme';

interface ThemeContextValue {
  theme: Theme;
  preference: ThemePreference;
  setTheme: (preference: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readPreference(): ThemePreference {
  if (typeof window === 'undefined') return DEFAULT_THEME_PREFERENCE;
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : DEFAULT_THEME_PREFERENCE;
  } catch {
    return DEFAULT_THEME_PREFERENCE;
  }
}

function resolvePreference(preference: ThemePreference): Theme {
  return preference === 'system' ? resolveSystemTheme() : preference;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(readPreference);
  const [theme, setResolvedTheme] = useState<Theme>(() => {
    if (typeof document !== 'undefined') return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    return 'light';
  });

  useEffect(() => {
    const apply = () => {
      const resolved = resolvePreference(preference);
      setResolvedTheme(resolved);
      document.documentElement.setAttribute('data-theme', resolved);
      document.documentElement.style.colorScheme = resolved;
    };
    apply();
    try { window.localStorage.setItem(THEME_STORAGE_KEY, preference); } catch { /* Storage can be unavailable in private/restricted browsing. */ }
    if (preference !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [preference]);

  const setTheme = useCallback((next: ThemePreference) => setPreference(next), []);
  const toggleTheme = useCallback(() => setPreference((current) => {
    const resolved = resolvePreference(current);
    return resolved === 'light' ? 'dark' : 'light';
  }), []);

  const value = useMemo<ThemeContextValue>(() => ({ theme, preference, setTheme, toggleTheme }), [theme, preference, setTheme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used within a ThemeProvider');
  return value;
}
