'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SUPPORTED_WEBSITE_FONTS, type Website, type WebsitePageKey } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormError } from '@/components/ui/form-error';
import { AssetUploader } from '@/components/website/asset-uploader';
import { SectionList } from '@/components/website/section-list';
import { PageTabs } from '@/components/website/page-tabs';
import { SitePreview } from '@/components/website/site-preview';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { getPlatformRootDomain } from '@/lib/env/platform-root-domain';
import { getWebsite, updateWebsite, uploadBanner, uploadLogo, type WebsitePageWithSections } from '@/lib/api/website';
import { ApiRequestError } from '@/lib/api/client';

const EDITOR_TABS = [
  { key: 'sections', label: 'الأقسام' },
  { key: 'pages', label: 'الصفحات' },
  { key: 'colors', label: 'الألوان' },
] as const;
type EditorTab = (typeof EDITOR_TABS)[number]['key'];

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

/** محرر الموقع — reached via "تخصيص الثيم" on متجر الثيمات's selected theme card (/site). Content only (أقسام/صفحات/ألوان); theme choice itself stays on /site. */
export default function WebsiteEditorPage() {
  const { me, accessToken } = useCurrentUser();
  const [website, setWebsite] = useState<Website | null>(null);
  const [pages, setPages] = useState<WebsitePageWithSections[]>([]);
  const [colorDraft, setColorDraft] = useState({ primary: '', secondary: '' });
  const [error, setError] = useState<string | null>(null);
  const [editorTab, setEditorTab] = useState<EditorTab>('sections');
  const [activePageKey, setActivePageKey] = useState<WebsitePageKey>('home');

  const siteUrl = `https://${me.tenant.subdomain}.${getPlatformRootDomain()}`;
  const activePage = pages.find((p) => p.key === activePageKey);

  useEffect(() => {
    void getWebsite(accessToken).then((result) => {
      setWebsite(result.website);
      setPages(result.pages);
      setColorDraft({ primary: result.website.primary_color, secondary: result.website.secondary_color });
    });
  }, [accessToken]);

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
      <div className="flex max-w-[1100px] flex-col gap-6">
        <Link href="/site" className="w-fit text-sm text-text-secondary hover:text-brand">
          ← رجوع لمتجر الثيمات
        </Link>

        <FormError message={error} />

        <Card className="p-6">
          <div className="mb-5 flex gap-2 border-b border-border-subtle pb-4">
            {EDITOR_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setEditorTab(tab.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  editorTab === tab.key ? 'bg-brand-surface text-brand' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
            <div>
              {editorTab === 'pages' && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-text-secondary">اختر صفحة لتعديل أقسامها — كل صفحة من صفحات موقعك الست الثابتة لها أقسامها الخاصة.</p>
                  <PageTabs
                    pages={pages}
                    activeKey={activePageKey}
                    onSelect={(key) => {
                      setActivePageKey(key);
                      setEditorTab('sections');
                    }}
                  />
                </div>
              )}

              {editorTab === 'sections' && (
                <div className="flex flex-col gap-3">
                  <PageTabs pages={pages} activeKey={activePageKey} onSelect={setActivePageKey} />
                  <p className="text-sm text-text-secondary">اسحب لإعادة الترتيب، وفعّل/عطّل أي قسم</p>
                  {activePage && (
                    <SectionList
                      key={activePage.id}
                      sections={activePage.website_sections}
                      accessToken={accessToken}
                      onChange={(sections) =>
                        setPages((current) => current.map((p) => (p.id === activePage.id ? { ...p, website_sections: sections } : p)))
                      }
                    />
                  )}
                </div>
              )}

              {editorTab === 'colors' && (
                <div className="flex flex-col gap-6">
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

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-text-secondary">الخط</label>
                    <Select value={website.font_family} onChange={(e) => void saveFont(e.target.value)}>
                      {SUPPORTED_WEBSITE_FONTS.map((font) => (
                        <option key={font} value={font}>
                          {font}
                        </option>
                      ))}
                    </Select>
                  </div>

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
                </div>
              )}
            </div>

            <SitePreview siteUrl={siteUrl} pageKey={activePageKey} />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
