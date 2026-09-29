'use client';

import { useEffect, useState } from 'react';
import type { Theme, Website } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { FormError } from '@/components/ui/form-error';
import { ThemeGallerySkeleton } from '@/components/website/theme-gallery-skeleton';
import { ThemeGallery } from '@/components/website/theme-gallery';
import { ThemePreview } from '@/components/website/theme-preview';
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
  const [selectingThemeId, setSelectingThemeId] = useState<string | null>(null);
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
  }, [accessToken, t.themeStore.errors.loadStore]);

  async function saveTheme(themeId: string) {
    setError(null);
    setSelectingThemeId(themeId);
    try {
      const { website: updated } = await updateWebsite(accessToken, { theme_id: themeId });
      setWebsite((current) => (current ? { ...current, ...updated } : current));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.themeStore.errors.saveTheme);
    } finally {
      setSelectingThemeId(null);
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
      <div className="flex w-full flex-col gap-6 pb-28 sm:pb-24">
        <FormError message={error} />

        {themes.find((theme) => theme.id === website.theme_id) ? (() => {
          const activeTheme = themes.find((theme) => theme.id === website.theme_id)!;
          return (
            <div className="fixed inset-x-[11%] bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-4xl overflow-hidden rounded-2xl border border-white/15 bg-brand px-3 py-2 shadow-xl sm:inset-x-10 sm:bottom-6 sm:px-4 sm:py-2.5 md:static md:inset-auto md:order-first md:w-full md:max-w-none md:translate-x-0 md:self-stretch">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="h-12 w-[72px] shrink-0 overflow-hidden rounded-lg border border-border-subtle sm:h-14 sm:w-20">
                  <ThemePreview themeKey={activeTheme.key} primaryColor={website.primary_color} previewImageUrl={activeTheme.preview_image_url} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium text-white/70 sm:text-xs">الثيم المستخدم</p>
                  <h2 className="mt-0.5 truncate text-xs font-semibold text-white sm:text-sm">{activeTheme.name_ar}</h2>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                  <a href="/website/editor" className="flex h-8 items-center justify-center whitespace-nowrap rounded-lg bg-white px-2.5 text-[11px] font-semibold text-brand transition hover:bg-white/90 sm:h-9 sm:px-4 sm:text-sm">
                    {t.themeStore.customizeTheme}
                  </a>
                  <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="flex h-8 items-center justify-center whitespace-nowrap rounded-lg border border-white/35 bg-white/10 px-2.5 text-[11px] font-semibold text-white transition hover:bg-white/15 sm:h-9 sm:px-4 sm:text-sm">
                    فتح الموقع
                  </a>
                </div>
              </div>
            </div>
          );
        })() : null}

        <Card className="p-4 sm:p-8">
          <h2 className="mb-1 text-base font-semibold text-text-primary">{t.themeStore.pageTitle}</h2>
          <div className="mb-4" />
          <ThemeGallery
            themes={themes}
            selectedThemeId={website.theme_id}
            primaryColor={website.primary_color}
            siteUrl={siteUrl}
            onSelect={(themeId) => void saveTheme(themeId)}
            selectingThemeId={selectingThemeId}
          />
        </Card>
      </div>
    </AppShell>
  );
}
