'use client';

import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useLocale } from '@/lib/i18n/locale-context';
import { useTheme } from '@/lib/theme/theme-context';

/**
 * Mobile-only pair of switches (language, dark mode) for the Account tab —
 * desktop already has the same two controls as icon buttons in the topbar
 * (language-toggle.tsx/theme-toggle.tsx), so this only renders below `md`
 * where that topbar row is hidden (topbar.tsx). "English (Beta)" names the
 * language itself rather than translating (a language switcher conventionally
 * shows each language written in itself) — "Beta" because most of the
 * dashboard's own page content is still Arabic-only (see CLAUDE.md's
 * per-page translation rollout), only the persistent chrome and a first
 * batch of pages are fully bilingual so far.
 */
export function LanguageThemeSwitchCard() {
  const { locale, toggleLocale } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const { pages } = useLocale();
  const t = pages.settings.languageThemeCard;

  return (
    <Card className="p-2 md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-medium text-text-primary" dir="ltr">
          {t.englishBetaLabel}
        </span>
        <Switch checked={locale === 'en'} onChange={toggleLocale} />
      </div>
      <div className="h-px bg-border-subtle" />
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-medium text-text-primary">{t.darkModeLabel}</span>
        <Switch checked={theme === 'dark'} onChange={toggleTheme} />
      </div>
    </Card>
  );
}
