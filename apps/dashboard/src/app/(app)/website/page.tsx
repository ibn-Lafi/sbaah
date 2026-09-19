'use client';

import { useEffect, useState } from 'react';
import type { Theme, Website } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { FormError } from '@/components/ui/form-error';
import { ThemeGallerySkeleton } from '@/components/website/theme-gallery-skeleton';
import { ThemeGallery } from '@/components/website/theme-gallery';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { getWebsite, updateWebsite } from '@/lib/api/website';
import { listThemes } from '@/lib/api/reference-data';
import { ApiRequestError } from '@/lib/api/client';
import { getPlatformRootDomain } from '@/lib/env/platform-root-domain';

/** متجر الثيمات — theme selection only. Content editing (أقسام/صفحات/ألوان) is a separate screen, reached via the selected theme's "تخصيص الثيم" button — see /website/editor. Domain management moved to its own top-level nav item, /domain. */
export default function ThemeStorePage() {
  const { me, accessToken } = useCurrentUser();
  const { pages } = useLocale();
  const t = pages.website;
  const [website, setWebsite] = useState<Website | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [error, setError] = useState<string | null>(null);
  const siteUrl = `https://${me.tenant.subdomain}.${getPlatformRootDomain()}`;

  useEffect(() => {
    let cancelled = false;

    async function loadThemeStore() {
      setError(null);
      try {
        const [websiteResult, themesResult] = await Promise.all([getWebsite(accessToken), listThemes()]);
        if (cancelled) return;
        setWebsite(websiteResult.website);
        setThemes(themesResult);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiRequestError ? err.message : t.themeStore.errors.loadStore);
      }
    }

    void loadThemeStore();
    return () => {
      cancelled = true;
    };
  }, [accessToken, t.themeStore.errors.load]);

  async function saveTheme(themeId: string) {
    setError(null);
    try {
      const { website: updated } = await updateWebsite(accessToken, { theme_id: themeId });
      setWebsite((current) => (current ? { ...current, ...updated } : current));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.themeStore.errors.saveTheme);
    }
  }

  if (!website) {
    return (
      <AppShell
        title={t.themeStore.pageTitle}
        orgName={me.tenant.name_ar}
        accountType={me.tenant.account_type}
      >
        {error ? (
          <div className="flex w-full flex-col gap-4">
            <FormError message={error} />
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-fit rounded-input border border-border-default bg-surface-card px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-subtle"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <ThemeGallerySkeleton />
        )}
      </AppShell>
    );
  }

  return (
    <AppShell
      title={t.themeStore.pageTitle}
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
    >
      <div className="flex w-full flex-col gap-6">
        <FormError message={error} />

        <Card className="p-8">
          <h2 className="mb-1 text-base font-semibold text-text-primary">{t.themeStore.pageTitle}</h2>
          <p className="mb-4 text-sm text-text-secondary">{t.themeStore.description}</p>
          <ThemeGallery
            themes={themes}
            selectedThemeId={website.theme_id}
            primaryColor={website.primary_color}
            siteUrl={siteUrl}
            onSelect={(themeId) => void saveTheme(themeId)}
          />
        </Card>
      </div>
    </AppShell>
  );
}
