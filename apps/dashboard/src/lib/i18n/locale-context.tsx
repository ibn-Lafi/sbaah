'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { dictionaries, type ChromeDictionary } from './dictionaries';
import { pageDictionaries, type PageDictionaries } from './page-dictionaries';
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, dirFor, type Locale } from './locale';

interface LocaleContextValue {
  locale: Locale;
  /** Persistent chrome strings (sidebar/topbar/mobile-nav/app-shell) — unchanged since before per-page translation existed. */
  t: ChromeDictionary;
  /** Per-page strings, one namespace per route (`pages.leads`, `pages.settings`, ...) — kept separate from `t` so translating one page never touches the same dictionary file as another. */
  pages: PageDictionaries;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/** Reads the value the flash-avoidance inline script (root layout) already wrote to <html> before hydration, so the first client render matches what's on screen instead of always starting from DEFAULT_LOCALE. */
function readInitialLocale(): Locale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE;
  const attr = document.documentElement.lang;
  return attr === 'en' ? 'en' : DEFAULT_LOCALE;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readInitialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dirFor(locale);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // Private mode / storage disabled — locale still works for this page load, just doesn't persist.
    }
  }, [locale]);

  const applyLocaleAndReload = useCallback((next: Locale) => {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // Storage may be unavailable; the current document is still updated before reload.
    }
    document.documentElement.lang = next;
    document.documentElement.dir = dirFor(next);
    window.location.reload();
  }, []);

  const setLocale = useCallback((next: Locale) => {
    if (next === locale) return;
    applyLocaleAndReload(next);
  }, [applyLocaleAndReload, locale]);

  const toggleLocale = useCallback(() => {
    applyLocaleAndReload(locale === 'ar' ? 'en' : 'ar');
  }, [applyLocaleAndReload, locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, t: dictionaries[locale], pages: pageDictionaries[locale], setLocale, toggleLocale }),
    [locale, setLocale, toggleLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return value;
}
