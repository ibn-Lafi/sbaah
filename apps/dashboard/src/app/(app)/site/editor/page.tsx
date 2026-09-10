'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { WEBSITE_PAGE_KEYS, SUPPORTED_WEBSITE_FONTS, type Website, type WebsitePageKey } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormError } from '@/components/ui/form-error';
import { AssetUploader } from '@/components/website/asset-uploader';
import { SectionList } from '@/components/website/section-list';
import { SitePreview, type Device } from '@/components/website/site-preview';
import { ExitIcon, SettingsGearIcon, CloseIcon, DesktopIcon, MobileIcon, ChevronIcon } from '@/components/website/editor-icons';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { getPlatformRootDomain } from '@/lib/env/platform-root-domain';
import { WEBSITE_PAGE_LABELS } from '@/lib/website/labels';
import { getWebsite, updateWebsite, uploadBanner, uploadLogo, type WebsitePageWithSections } from '@/lib/api/website';
import { ApiRequestError } from '@/lib/api/client';

type PanelView = 'sections' | 'settings';

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

/**
 * تخصيص الثيم — toolbar + live preview + a sections/settings panel,
 * matching the founder's reference tool's layout order: exit ← device
 * toggle ← page picker ← settings gear, with the panel switching
 * between "أقسام [الصفحة]" and "إعدادات الصفحة" instead of a 3-way tab
 * row. No "نشر"/history/fullscreen controls — سبعة has no draft-vs-
 * published state for site content (every change saves immediately via
 * PATCH), so a fake publish button would claim a state that doesn't
 * exist; likewise no "ربط المنتجات" section (no product-linking concept
 * in سبعة's data model) — only the parts with something real behind
 * them are here.
 */
export default function WebsiteEditorPage() {
  const { me, accessToken } = useCurrentUser();
  const [website, setWebsite] = useState<Website | null>(null);
  const [pages, setPages] = useState<WebsitePageWithSections[]>([]);
  const [colorDraft, setColorDraft] = useState({ primary: '', secondary: '' });
  const [error, setError] = useState<string | null>(null);
  const [panelView, setPanelView] = useState<PanelView>('sections');
  const [activePageKey, setActivePageKey] = useState<WebsitePageKey>('home');
  const [device, setDevice] = useState<Device>('desktop');
  const [colorsOpen, setColorsOpen] = useState(true);

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
      <AppShell title="تخصيص الثيم" orgName={me.tenant.name_ar} accountType={me.tenant.account_type} roleLabel={ROLE_LABELS[me.user.role]}>
        <p className="text-text-secondary">جارٍ التحميل...</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="تخصيص الثيم" orgName={me.tenant.name_ar} accountType={me.tenant.account_type} roleLabel={ROLE_LABELS[me.user.role]}>
      <div className="-m-7 flex h-[calc(100vh-72px)] flex-col">
        {/* Toolbar */}
        <div className="flex h-14 flex-none items-center gap-2 border-b border-border-subtle bg-surface-card px-4">
          <Link
            href="/site"
            aria-label="رجوع لمتجر الثيمات"
            title="رجوع لمتجر الثيمات"
            className="flex h-9 w-9 items-center justify-center rounded-control text-text-secondary hover:bg-surface-subtle"
          >
            <ExitIcon className="h-[18px] w-[18px]" />
          </Link>

          <div className="h-6 w-px bg-border-subtle" />

          <div className="flex gap-1 rounded-full bg-surface-subtle-3 p-1">
            <button
              type="button"
              onClick={() => setDevice('desktop')}
              aria-label="عرض كمبيوتر"
              title="عرض كمبيوتر"
              className={`flex h-8 w-8 items-center justify-center rounded-full ${device === 'desktop' ? 'bg-surface-card text-brand shadow-sm' : 'text-text-secondary'}`}
            >
              <DesktopIcon className="h-[16px] w-[16px]" />
            </button>
            <button
              type="button"
              onClick={() => setDevice('mobile')}
              aria-label="عرض جوال"
              title="عرض جوال"
              className={`flex h-8 w-8 items-center justify-center rounded-full ${device === 'mobile' ? 'bg-surface-card text-brand shadow-sm' : 'text-text-secondary'}`}
            >
              <MobileIcon className="h-[16px] w-[16px]" />
            </button>
          </div>

          <div className="flex-1" />

          <Select
            value={activePageKey}
            onChange={(e) => {
              setActivePageKey(e.target.value as WebsitePageKey);
              setPanelView('sections');
            }}
            className="h-9 w-[180px]"
          >
            {WEBSITE_PAGE_KEYS.map((key) => (
              <option key={key} value={key}>
                {WEBSITE_PAGE_LABELS[key]}
              </option>
            ))}
          </Select>

          <button
            type="button"
            onClick={() => setPanelView((v) => (v === 'settings' ? 'sections' : 'settings'))}
            aria-label="إعدادات الصفحة"
            title="إعدادات الصفحة"
            className={`flex h-9 w-9 items-center justify-center rounded-control ${
              panelView === 'settings' ? 'bg-brand-surface text-brand' : 'text-text-secondary hover:bg-surface-subtle'
            }`}
          >
            <SettingsGearIcon className="h-[18px] w-[18px]" />
          </button>
        </div>

        {/* Preview + panel */}
        <div className="flex min-h-0 flex-1">
          <div className="min-w-0 flex-1">
            <SitePreview siteUrl={siteUrl} pageKey={activePageKey} device={device} />
          </div>

          <div className="flex w-[360px] flex-none flex-col overflow-auto border-s border-border-subtle bg-surface-card">
            {panelView === 'sections' ? (
              <>
                <div className="flex h-14 flex-none items-center justify-between border-b border-border-subtle px-4">
                  <h2 className="text-sm font-semibold text-text-primary">أقسام {WEBSITE_PAGE_LABELS[activePageKey]}</h2>
                  <button type="button" onClick={() => setPanelView('settings')} className="text-text-secondary hover:text-brand">
                    <SettingsGearIcon className="h-[17px] w-[17px]" />
                  </button>
                </div>
                <div className="flex-1 p-4">
                  <FormError message={error} />
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
              </>
            ) : (
              <>
                <div className="flex h-14 flex-none items-center justify-between border-b border-border-subtle px-4">
                  <h2 className="text-sm font-semibold text-text-primary">إعدادات الصفحة</h2>
                  <button type="button" onClick={() => setPanelView('sections')} className="text-text-secondary hover:text-brand">
                    <CloseIcon className="h-[17px] w-[17px]" />
                  </button>
                </div>
                <div className="flex-1 p-4">
                  <FormError message={error} />
                  <button
                    type="button"
                    onClick={() => setColorsOpen((v) => !v)}
                    className="flex w-full items-center justify-between py-2 text-sm font-semibold text-text-primary"
                  >
                    الألوان والهوية
                    <ChevronIcon open={colorsOpen} className="h-[14px] w-[14px] text-text-secondary" />
                  </button>
                  {colorsOpen && (
                    <div className="flex flex-col gap-4 pb-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-text-secondary">اللون الأساسي</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={colorDraft.primary}
                            onChange={(e) => setColorDraft((c) => ({ ...c, primary: e.target.value }))}
                            onBlur={() => void saveColor('primary_color', colorDraft.primary)}
                            className="h-10 w-10 shrink-0 cursor-pointer rounded-input border border-border-default"
                          />
                          <Input
                            value={colorDraft.primary}
                            onChange={(e) => setColorDraft((c) => ({ ...c, primary: e.target.value }))}
                            onBlur={() => void saveColor('primary_color', colorDraft.primary)}
                            dir="ltr"
                            className="h-10 min-w-0 flex-1"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-text-secondary">اللون الثانوي</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={colorDraft.secondary}
                            onChange={(e) => setColorDraft((c) => ({ ...c, secondary: e.target.value }))}
                            onBlur={() => void saveColor('secondary_color', colorDraft.secondary)}
                            className="h-10 w-10 shrink-0 cursor-pointer rounded-input border border-border-default"
                          />
                          <Input
                            value={colorDraft.secondary}
                            onChange={(e) => setColorDraft((c) => ({ ...c, secondary: e.target.value }))}
                            onBlur={() => void saveColor('secondary_color', colorDraft.secondary)}
                            dir="ltr"
                            className="h-10 min-w-0 flex-1"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-text-secondary">الخط</label>
                        <Select value={website.font_family} onChange={(e) => void saveFont(e.target.value)} className="h-10">
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
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
