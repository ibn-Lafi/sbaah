'use client';

import { useEffect, useState } from 'react';
import type { Theme, Website } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { FormError } from '@/components/ui/form-error';
import { LoadingState } from '@/components/ui/loading-state';
import { ThemeGallery } from '@/components/website/theme-gallery';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { getWebsite, updateWebsite } from '@/lib/api/website';
import { listThemes } from '@/lib/api/reference-data';
import { ApiRequestError } from '@/lib/api/client';

/** متجر الثيمات — theme selection only. Content editing (أقسام/صفحات/ألوان) is a separate screen, reached via the selected theme's "تخصيص الثيم" button — see /site/editor. Domain management moved to its own top-level nav item, /domain. */
export default function ThemeStorePage() {
  const { me, accessToken } = useCurrentUser();
  const [website, setWebsite] = useState<Website | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getWebsite(accessToken).then((result) => setWebsite(result.website));
    void listThemes().then(setThemes);
  }, [accessToken]);

  async function saveTheme(themeId: string) {
    setError(null);
    try {
      const { website: updated } = await updateWebsite(accessToken, { theme_id: themeId });
      setWebsite((current) => (current ? { ...current, ...updated } : current));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر حفظ الثيم');
    }
  }

  if (!website) {
    return (
      <AppShell
        title="متجر الثيمات"
        orgName={me.tenant.name_ar}
        accountType={me.tenant.account_type}
        roleLabel={ROLE_LABELS[me.user.role]}
      >
        <LoadingState />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="متجر الثيمات"
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      <div className="flex max-w-[1100px] flex-col gap-6">
        <FormError message={error} />

        <Card className="p-8">
          <h2 className="mb-1 text-base font-semibold text-text-primary">متجر الثيمات</h2>
          <p className="mb-4 text-sm text-text-secondary">
            اختر شكل موقعك، ثم اضغط &quot;تخصيص الثيم&quot; على الثيم الحالي لتعديل أقسامه وألوانه ومحتواه
          </p>
          <ThemeGallery themes={themes} selectedThemeId={website.theme_id} primaryColor={website.primary_color} onSelect={(themeId) => void saveTheme(themeId)} />
        </Card>
      </div>
    </AppShell>
  );
}
