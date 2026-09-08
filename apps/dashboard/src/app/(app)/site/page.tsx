'use client';

import { useEffect, useState } from 'react';
import { SUPPORTED_WEBSITE_FONTS, type Theme } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormError } from '@/components/ui/form-error';
import { AssetUploader } from '@/components/website/asset-uploader';
import { SectionList } from '@/components/website/section-list';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import {
  getWebsite,
  updateWebsite,
  uploadBanner,
  uploadLogo,
  type WebsiteWithSections,
} from '@/lib/api/website';
import { listThemes } from '@/lib/api/reference-data';
import { ApiRequestError } from '@/lib/api/client';

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export default function WebsiteEditorPage() {
  const { me, accessToken } = useCurrentUser();
  const [website, setWebsite] = useState<WebsiteWithSections | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [colorDraft, setColorDraft] = useState({ primary: '', secondary: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getWebsite(accessToken).then((result) => {
      setWebsite(result.website);
      setColorDraft({ primary: result.website.primary_color, secondary: result.website.secondary_color });
    });
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

  async function saveColor(field: 'primary_color' | 'secondary_color', value: string) {
    if (!HEX_PATTERN.test(value)) return;
    setError(null);
    try {
      const { website: updated } = await updateWebsite(accessToken, { [field]: value });
      setWebsite((current) => (current ? { ...current, ...updated } : current));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر حفظ اللون');
    }
  }

  async function saveFont(font: string) {
    setError(null);
    try {
      const { website: updated } = await updateWebsite(accessToken, { font_family: font });
      setWebsite((current) => (current ? { ...current, ...updated } : current));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر حفظ الخط');
    }
  }

  if (!website) {
    return (
      <AppShell
        title="محرر الموقع"
        orgName={me.tenant.name_ar}
        accountType={me.tenant.account_type}
        roleLabel={ROLE_LABELS[me.user.role]}
      >
        <p className="text-text-secondary">جارٍ التحميل...</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="محرر الموقع"
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      <div className="flex max-w-[720px] flex-col gap-6">
        <FormError message={error} />

        <Card className="p-8">
          <h2 className="mb-1 text-base font-semibold text-text-primary">الثيم</h2>
          <p className="mb-4 text-sm text-text-secondary">
            نقطة الانطلاق قبل تخصيص الألوان والخط أدناه — ثيم واحد متاح حاليًا، وستضاف ثيمات أخرى لاحقًا لنفس القائمة
          </p>
          <Select value={website.theme_id} onChange={(e) => void saveTheme(e.target.value)}>
            {themes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name_ar}
              </option>
            ))}
          </Select>
        </Card>

        <Card className="p-8">
          <h2 className="mb-4 text-base font-semibold text-text-primary">الألوان والخط</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary">اللون الأساسي</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colorDraft.primary}
                  onChange={(e) => setColorDraft((c) => ({ ...c, primary: e.target.value }))}
                  onBlur={() => void saveColor('primary_color', colorDraft.primary)}
                  className="h-[54px] w-[54px] shrink-0 cursor-pointer rounded-input border border-border-default"
                />
                <Input
                  value={colorDraft.primary}
                  onChange={(e) => setColorDraft((c) => ({ ...c, primary: e.target.value }))}
                  onBlur={() => void saveColor('primary_color', colorDraft.primary)}
                  dir="ltr"
                  className="min-w-0 flex-1"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary">اللون الثانوي</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colorDraft.secondary}
                  onChange={(e) => setColorDraft((c) => ({ ...c, secondary: e.target.value }))}
                  onBlur={() => void saveColor('secondary_color', colorDraft.secondary)}
                  className="h-[54px] w-[54px] shrink-0 cursor-pointer rounded-input border border-border-default"
                />
                <Input
                  value={colorDraft.secondary}
                  onChange={(e) => setColorDraft((c) => ({ ...c, secondary: e.target.value }))}
                  onBlur={() => void saveColor('secondary_color', colorDraft.secondary)}
                  dir="ltr"
                  className="min-w-0 flex-1"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-1">
            <label className="text-xs text-text-secondary">الخط</label>
            <Select value={website.font_family} onChange={(e) => void saveFont(e.target.value)}>
              {SUPPORTED_WEBSITE_FONTS.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </Select>
          </div>
        </Card>

        <Card className="flex flex-col gap-6 p-8">
          <AssetUploader
            label="الشعار"
            currentUrl={website.logo_url}
            onUpload={async (file) => {
              const { website: updated } = await uploadLogo(accessToken, file);
              setWebsite((current) => (current ? { ...current, ...updated } : current));
            }}
            onRemove={async () => {
              const { website: updated } = await updateWebsite(accessToken, { logo_url: null });
              setWebsite((current) => (current ? { ...current, ...updated } : current));
            }}
          />
          <AssetUploader
            label="صورة البانر (قسم الغلاف الرئيسي)"
            currentUrl={website.banner_image_url}
            onUpload={async (file) => {
              const { website: updated } = await uploadBanner(accessToken, file);
              setWebsite((current) => (current ? { ...current, ...updated } : current));
            }}
            onRemove={async () => {
              const { website: updated } = await updateWebsite(accessToken, { banner_image_url: null });
              setWebsite((current) => (current ? { ...current, ...updated } : current));
            }}
          />
        </Card>

        <Card className="p-8">
          <h2 className="mb-1 text-base font-semibold text-text-primary">أقسام الصفحة</h2>
          <p className="mb-4 text-sm text-text-secondary">اسحب لإعادة الترتيب، وفعّل/عطّل أي قسم</p>
          <SectionList
            sections={website.website_sections}
            accessToken={accessToken}
            onChange={(sections) => setWebsite((current) => (current ? { ...current, website_sections: sections } : current))}
          />
        </Card>
      </div>
    </AppShell>
  );
}
