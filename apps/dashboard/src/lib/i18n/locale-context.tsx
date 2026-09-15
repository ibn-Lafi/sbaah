'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { dictionaries, type ChromeDictionary } from './dictionaries';
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, dirFor, type Locale } from './locale';

interface LocaleContextValue {
  locale: Locale;
  t: ChromeDictionary;
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

  const setLocale = useCallback((next: Locale) => setLocaleState(next), []);
  const toggleLocale = useCallback(() => setLocaleState((current) => (current === 'ar' ? 'en' : 'ar')), []);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, t: dictionaries[locale], setLocale, toggleLocale }),
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
