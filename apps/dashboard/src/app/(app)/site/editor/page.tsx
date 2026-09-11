'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SUPPORTED_WEBSITE_FONTS, WEBSITE_PAGE_KEYS, type Website, type WebsitePageKey, type WebsiteSection } from '@sbaah/shared';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { FormError } from '@/components/ui/form-error';
import { EditorSkeleton } from '@/components/website/editor-skeleton';
import { AssetUploader } from '@/components/website/asset-uploader';
import { SectionList } from '@/components/website/section-list';
import { SitePreview, type Device } from '@/components/website/site-preview';
import { BackArrowIcon, AdjustmentsIcon, CloseIcon, DesktopIcon, MobileIcon, ChevronIcon } from '@/components/website/editor-icons';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { getPlatformRootDomain } from '@/lib/env/platform-root-domain';
import { WEBSITE_PAGE_LABELS } from '@/lib/website/labels';
import { getWebsite, updateWebsite, updateSection, uploadBanner, uploadLogo, type WebsitePageWithSections } from '@/lib/api/website';
import { ApiRequestError } from '@/lib/api/client';

type PanelView = 'sections' | 'settings';
type ZoneKey = 'top' | 'content' | 'bottom';

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

/**
 * تخصيص الثيم — شاشة كاملة (بدون AppShell، الرجوع عبر سهم) مطابقة لأداة
 * المرجع: شريط أدوات (رجوع ← تبديل جهاز ← اختيار صفحة ← إعدادات) ولوحة
 * جانبية على يمين المعاينة (RTL) تتبدّل بين "أقسام [الصفحة]" (مقسّمة إلى 3
 * مناطق: أعلى الصفحة / محتوى الصفحة / أسفل الصفحة) و"إعدادات الصفحة".
 * لا "نشر"/سجل تعديلات — سبعة تحفظ فور التغيير، لا حالة مسودة/منشور.
 */
export default function WebsiteEditorPage() {
  const { me, accessToken } = useCurrentUser();
  const [website, setWebsite] = useState<Website | null>(null);
  const [pages, setPages] = useState<WebsitePageWithSections[]>([]);
  const [colorDraft, setColorDraft] = useState({ primary: '', secondary: '' });
  const [textDraft, setTextDraft] = useState({ announcement: '', footerDescription: '' });
  const [error, setError] = useState<string | null>(null);
  const [panelView, setPanelView] = useState<PanelView>('sections');
  const [activePageKey, setActivePageKey] = useState<WebsitePageKey>('home');
  const [device, setDevice] = useState<Device>('desktop');
  const [colorsOpen, setColorsOpen] = useState(true);
  const [openZones, setOpenZones] = useState<Record<ZoneKey, boolean>>({ top: true, content: true, bottom: true });

  const siteUrl = `https://${me.tenant.subdomain}.${getPlatformRootDomain()}`;
  const activePage = pages.find((p) => p.key === activePageKey);
  // قسم "تواصل" لم يعد يُعرض إطلاقًا في الموقع العام على الرئيسية/تفاصيل
  // العقار (الفوتر يحمل نفس المعلومات) — يُستبعد هنا أيضًا حتى لا يبقى
  // مفتاح توسيط/تحرير ميت بلا أي أثر فعلي، حتى قبل تشغيل migration 0037
  // التي تحذف الصف نفسه من قاعدة البيانات لكل مستأجر.
  const contentSections =
    activePage?.website_sections.filter((s) => {
      if (s.type === 'footer') return false;
      if (s.type === 'contact' && (activePageKey === 'home' || activePageKey === 'property_detail')) return false;
      return true;
    }) ?? [];
  const footerSection = activePage?.website_sections.find((s) => s.type === 'footer');

  useEffect(() => {
    void getWebsite(accessToken).then((result) => {
      setWebsite(result.website);
      setPages(result.pages);
      setColorDraft({ primary: result.website.primary_color, secondary: result.website.secondary_color });
      setTextDraft({
        announcement: result.website.announcement_bar_text ?? '',
        footerDescription: result.website.footer_description ?? '',
      });
    });
  }, [accessToken]);

  function toggleZone(zone: ZoneKey) {
    setOpenZones((current) => ({ ...current, [zone]: !current[zone] }));
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

  async function saveAnnouncementBar(value: string) {
    setError(null);
    try {
      const { website: updated } = await updateWebsite(accessToken, { announcement_bar_text: value || null });
      setWebsite((current) => (current ? { ...current, ...updated } : current));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر حفظ شريط الإعلان');
    }
  }

  async function saveFooterDescription(value: string) {
    setError(null);
    try {
      const { website: updated } = await updateWebsite(accessToken, { footer_description: value || null });
      setWebsite((current) => (current ? { ...current, ...updated } : current));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر حفظ نص الفوتر');
    }
  }

  function mergeSections(pageId: string, updated: WebsiteSection[]) {
    setPages((current) =>
      current.map((p) => {
        if (p.id !== pageId) return p;
        const keepFooter = p.website_sections.find((s) => s.type === 'footer');
        return { ...p, website_sections: keepFooter ? [...updated, keepFooter] : updated };
      }),
    );
  }

  async function toggleFooterVisibility() {
    if (!activePage || !footerSection) return;
    const { section: updated } = await updateSection(accessToken, footerSection.id, { is_visible: !footerSection.is_visible });
    setPages((current) =>
      current.map((p) =>
        p.id === activePage.id ? { ...p, website_sections: p.website_sections.map((s) => (s.id === updated.id ? updated : s)) } : p,
      ),
    );
  }

  if (!website) {
    return <EditorSkeleton />;
  }

  return (
    <div className="flex h-screen flex-col bg-surface-page">
      {/* Toolbar */}
      <div className="relative flex h-14 flex-none items-center gap-2 border-b border-border-subtle bg-surface-card px-4">
        <Link
          href="/site"
          aria-label="رجوع لمتجر الثيمات"
          title="رجوع لمتجر الثيمات"
          className="flex h-9 w-9 items-center justify-center rounded-control text-text-secondary hover:bg-surface-subtle"
        >
          <BackArrowIcon className="h-[18px] w-[18px]" />
        </Link>

        <div className="h-6 w-px bg-border-subtle" />

        <Select
          value={activePageKey}
          onChange={(e) => {
            setActivePageKey(e.target.value as WebsitePageKey);
            setPanelView('sections');
          }}
          className="h-9 w-[170px] text-sm"
        >
          {WEBSITE_PAGE_KEYS.map((key) => (
            <option key={key} value={key}>
              {WEBSITE_PAGE_LABELS[key]}
            </option>
          ))}
        </Select>

        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 gap-1 rounded-full bg-surface-subtle-3 p-1">
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
      </div>

      {/* Panel + preview — panel first in DOM so it renders on the right under RTL, matching the reference tool. */}
      <div className="flex min-h-0 flex-1">
        <div className="flex w-[360px] flex-none flex-col overflow-auto border-e border-border-subtle bg-surface-card">
          {panelView === 'sections' ? (
            <>
              <div className="flex h-14 flex-none items-center justify-between border-b border-border-subtle px-4">
                <h2 className="text-sm font-semibold text-text-primary">أقسام {WEBSITE_PAGE_LABELS[activePageKey]}</h2>
                <button
                  type="button"
                  onClick={() => setPanelView('settings')}
                  aria-label="إعدادات الصفحة"
                  title="إعدادات الصفحة"
                  className="text-text-secondary hover:text-brand"
                >
                  <AdjustmentsIcon className="h-[17px] w-[17px]" />
                </button>
              </div>
              <div className="flex-1 divide-y divide-border-subtle">
                <div className="p-4">
                  <FormError message={error} />
                </div>

                {/* أعلى الصفحة */}
                <div className="p-4">
                  <button
                    type="button"
                    onClick={() => toggleZone('top')}
                    className="flex w-full items-center justify-between text-sm font-semibold text-text-primary"
                  >
                    أعلى الصفحة
                    <ChevronIcon open={openZones.top} className="h-[14px] w-[14px] text-text-secondary" />
                  </button>
                  {openZones.top && (
                    <div className="mt-4 flex flex-col gap-4">
                      <AssetUploader
                        label="الشعار (مقاس 250×100)"
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
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-text-secondary">الشريط (نص إعلاني أعلى الصفحة)</label>
                        <Input
                          value={textDraft.announcement}
                          onChange={(e) => setTextDraft((c) => ({ ...c, announcement: e.target.value }))}
                          onBlur={() => void saveAnnouncementBar(textDraft.announcement)}
                          placeholder="مثال: عروض نهاية الأسبوع سارية الآن"
                          className="h-10"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* محتوى الصفحة */}
                <div className="p-4">
                  <button
                    type="button"
                    onClick={() => toggleZone('content')}
                    className="flex w-full items-center justify-between text-sm font-semibold text-text-primary"
                  >
                    محتوى الصفحة
                    <ChevronIcon open={openZones.content} className="h-[14px] w-[14px] text-text-secondary" />
                  </button>
                  {openZones.content && (
                    <div className="mt-4">
                      {activePage && (
                        <SectionList
                          key={activePage.id}
                          sections={contentSections}
                          accessToken={accessToken}
                          onChange={(sections) => mergeSections(activePage.id, sections)}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* أسفل الصفحة */}
                <div className="p-4">
                  <button
                    type="button"
                    onClick={() => toggleZone('bottom')}
                    className="flex w-full items-center justify-between text-sm font-semibold text-text-primary"
                  >
                    أسفل الصفحة
                    <ChevronIcon open={openZones.bottom} className="h-[14px] w-[14px] text-text-secondary" />
                  </button>
                  {openZones.bottom && (
                    <div className="mt-4 flex flex-col gap-4">
                      {footerSection && (
                        <div className="flex items-center justify-between rounded-input border border-border-default px-4 py-3">
                          <span className="text-sm text-text-primary">إظهار الفوتر في هذه الصفحة</span>
                          <Switch checked={footerSection.is_visible} onChange={() => void toggleFooterVisibility()} />
                        </div>
                      )}

                      <p className="text-xs text-text-tertiary">يظهر نفس الشعار الموجود أعلى الصفحة (250×100) في الفوتر أيضًا.</p>

                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-text-secondary">التعريف الذي يظهر في الفوتر</label>
                        <Textarea
                          value={textDraft.footerDescription}
                          onChange={(e) => setTextDraft((c) => ({ ...c, footerDescription: e.target.value }))}
                          onBlur={() => void saveFooterDescription(textDraft.footerDescription)}
                          placeholder="نبذة قصيرة عن الحساب تظهر في تذييل الموقع"
                          className="min-h-[80px]"
                        />
                      </div>
                    </div>
                  )}
                </div>
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

        <div className="min-w-0 flex-1">
          <SitePreview siteUrl={siteUrl} pageKey={activePageKey} device={device} />
        </div>
      </div>
    </div>
  );
}
