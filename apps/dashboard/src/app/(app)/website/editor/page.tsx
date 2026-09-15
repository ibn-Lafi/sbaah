'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  SUPPORTED_WEBSITE_FONTS,
  WEBSITE_PAGE_KEYS,
  type Website,
  type WebsitePageKey,
  type WebsiteSection,
} from '@sbaah/shared';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { FormError } from '@/components/ui/form-error';
import { EditorSkeleton } from '@/components/website/editor-skeleton';
import { BackButton } from '@/components/ui/back-button';
import { SectionList, EDITABLE_TYPES } from '@/components/website/section-list';
import { SectionConfigEditor } from '@/components/website/section-config-editor';
import { SitePreview, type Device } from '@/components/website/site-preview';
import {
  AdjustmentsIcon,
  CloseIcon,
  DesktopIcon,
  MobileIcon,
  ChevronIcon,
  PencilIcon,
  EyeOffIcon,
  PlusIcon,
  SearchIcon,
  SectionTypeIcon,
} from '@/components/website/editor-icons';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { getPlatformRootDomain } from '@/lib/env/platform-root-domain';
import {
  getWebsite,
  updateWebsite,
  updateSection,
  type WebsitePageWithSections,
} from '@/lib/api/website';
import { ApiRequestError } from '@/lib/api/client';

type PanelView = 'sections' | 'settings';
type ZoneKey = 'top' | 'content' | 'bottom';

/**
 * تخصيص الثيم — شاشة كاملة (بدون AppShell، الرجوع عبر سهم) مطابقة لأداة
 * المرجع: شريط أدوات (رجوع ← تبديل جهاز ← اختيار صفحة ← إعدادات) ولوحة
 * جانبية على يمين المعاينة (RTL) تتبدّل بين "أقسام [الصفحة]" (مقسّمة إلى 3
 * مناطق: أعلى الصفحة / محتوى الصفحة / أسفل الصفحة) و"إعدادات الصفحة".
 * لا "نشر"/سجل تعديلات — سبعة تحفظ فور التغيير، لا حالة مسودة/منشور.
 */
export default function WebsiteEditorPage() {
  const { me, accessToken } = useCurrentUser();
  const { pages: pageLabels } = useLocale();
  const t = pageLabels.website;
  const [website, setWebsite] = useState<Website | null>(null);
  const [pages, setPages] = useState<WebsitePageWithSections[]>([]);
  const [textDraft, setTextDraft] = useState({ announcement: '', footerDescription: '' });
  const [error, setError] = useState<string | null>(null);
  const [panelView, setPanelView] = useState<PanelView>('sections');
  const [activePageKey, setActivePageKey] = useState<WebsitePageKey>('home');
  const [device, setDevice] = useState<Device>('desktop');
  const [colorsOpen, setColorsOpen] = useState(true);
  const [openZones, setOpenZones] = useState<Record<ZoneKey, boolean>>({
    top: true,
    content: true,
    bottom: true,
  });
  const [mobileEditingId, setMobileEditingId] = useState<string | null>(null);
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [addSectionQuery, setAddSectionQuery] = useState('');

  const siteUrl = `https://${me.tenant.subdomain}.${getPlatformRootDomain()}`;
  const activePage = pages.find((p) => p.key === activePageKey);
  // قسم "تواصل" لم يعد يُعرض إطلاقًا في الموقع العام على الرئيسية/تفاصيل
  // العقار (الفوتر يحمل نفس المعلومات) — يُستبعد هنا أيضًا حتى لا يبقى
  // مفتاح توسيط/تحرير ميت بلا أي أثر فعلي، حتى قبل تشغيل migration 0037
  // التي تحذف الصف نفسه من قاعدة البيانات لكل مستأجر.
  const contentSections =
    activePage?.website_sections.filter((s) => {
      if (s.type === 'footer') return false;
      if (s.type === 'contact' && (activePageKey === 'home' || activePageKey === 'property_detail'))
        return false;
      return true;
    }) ?? [];
  const footerSection = activePage?.website_sections.find((s) => s.type === 'footer');
  // محرر الجوال: الأقسام المُفعَّلة تُعرض في "محتوى الصفحة"، والمخفية
  // تصبح "مكتبة" القسم القابلة للإضافة — كل أقسام الصفحة موجودة أصلًا
  // بقاعدة البيانات منذ إنشاء الحساب (migration 0024، فلسفة "منسّقة لا
  // كنفاس حر")، فـ"الإضافة" هنا تعني تفعيل قسم مخفٍ لا إنشاء نوع جديد.
  const visibleContentSections = contentSections.filter((s) => s.is_visible);
  const hiddenContentSections = contentSections.filter((s) => !s.is_visible);
  const filteredHiddenSections = hiddenContentSections.filter((s) =>
    t.sectionTypeLabels[s.type].toLowerCase().includes(addSectionQuery.trim().toLowerCase()),
  );

  useEffect(() => {
    void getWebsite(accessToken).then((result) => {
      setWebsite(result.website);
      setPages(result.pages);
      setTextDraft({
        announcement: result.website.announcement_bar_text ?? '',
        footerDescription: result.website.footer_description ?? '',
      });
    });
  }, [accessToken]);

  function toggleZone(zone: ZoneKey) {
    setOpenZones((current) => ({ ...current, [zone]: !current[zone] }));
  }

  async function saveFont(font: string) {
    setError(null);
    try {
      const { website: updated } = await updateWebsite(accessToken, { font_family: font });
      setWebsite((current) => (current ? { ...current, ...updated } : current));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.editor.errors.saveFont);
    }
  }

  async function saveAnnouncementBar(value: string) {
    setError(null);
    try {
      const { website: updated } = await updateWebsite(accessToken, {
        announcement_bar_text: value || null,
      });
      setWebsite((current) => (current ? { ...current, ...updated } : current));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.editor.errors.saveAnnouncement);
    }
  }

  async function saveFooterDescription(value: string) {
    setError(null);
    try {
      const { website: updated } = await updateWebsite(accessToken, {
        footer_description: value || null,
      });
      setWebsite((current) => (current ? { ...current, ...updated } : current));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.editor.errors.saveFooterDescription);
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

  /** يُستخدم لتفعيل/إخفاء أي قسم — مفتاح الفوتر بالطريقة القديمة، وأزرار الإضافة/الإخفاء بمحرر الجوال. */
  async function toggleSectionVisibility(section: WebsiteSection) {
    if (!activePage) return;
    const { section: updated } = await updateSection(accessToken, section.id, {
      is_visible: !section.is_visible,
    });
    setPages((current) =>
      current.map((p) =>
        p.id === activePage.id
          ? {
              ...p,
              website_sections: p.website_sections.map((s) => (s.id === updated.id ? updated : s)),
            }
          : p,
      ),
    );
  }

  if (!website) {
    return <EditorSkeleton />;
  }

  return (
    <>
      {/*
        عرض الجوال — بلا معاينة حية جنبًا لجنب (لا مساحة تكفي الاثنين معًا
        على شاشة هاتف)؛ فقط إدارة الأقسام والإعدادات، بنفس البيانات
        والحفظ الفوري لعرض الكمبيوتر لكن بتنظيم مختلف: مناطق قابلة للطي
        بعدّاد أقسام حقيقي، كل قسم كصف بأيقونة (قلم للتعديل، عين مشطوبة
        للإخفاء)، و"+ إضافة قسم" يفتح قائمة الأقسام المخفية أصلًا لهذه
        الصفحة (لا قسم "حر" جديد — كل الأنواع موجودة بقاعدة البيانات منذ
        الإنشاء، migration 0024).
      */}
      <div className="bg-surface-page flex h-screen flex-col md:hidden">
        <div className="border-border-subtle bg-surface-card flex h-14 flex-none items-center gap-2 border-b px-3">
          <BackButton href="/website" label={t.editor.backToThemeStore} className="h-9 w-9" />
          <Select
            value={activePageKey}
            onChange={(e) => {
              setActivePageKey(e.target.value as WebsitePageKey);
              setPanelView('sections');
              setMobileEditingId(null);
            }}
            className="bg-surface-subtle-3 !h-9 flex-1 !rounded-full border-0 px-4 text-sm"
          >
            {WEBSITE_PAGE_KEYS.map((key) => (
              <option key={key} value={key}>
                {t.pageTabLabels[key]}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex-1 overflow-auto">
          {panelView === 'sections' ? (
            <>
              <div className="flex items-center justify-between px-4 pt-4">
                <h1 className="text-text-primary text-base font-semibold">
                  {t.editor.sectionsFor(t.pageTabLabels[activePageKey])}
                </h1>
                <button
                  type="button"
                  onClick={() => setPanelView('settings')}
                  aria-label={t.editor.pageSettings}
                  title={t.editor.pageSettings}
                  className="text-text-secondary hover:text-brand"
                >
                  <AdjustmentsIcon className="h-[18px] w-[18px]" />
                </button>
              </div>

              <Link href="/website" className="text-brand mt-1 block px-4 text-sm font-semibold hover:underline">
                {t.editor.changeTheme}
              </Link>

              <div className="px-4 pt-2">
                <FormError message={error} />
              </div>

              {/* أعلى الصفحة */}
              <div className="border-border-subtle mt-2 border-t px-4 py-4">
                <button
                  type="button"
                  onClick={() => toggleZone('top')}
                  className="text-text-primary flex w-full items-center justify-between text-sm font-semibold"
                >
                  <span>
                    {t.editor.topOfPage}{' '}
                    <span className="text-text-secondary font-normal">({t.editor.sectionsCount(1)})</span>
                  </span>
                  <ChevronIcon open={openZones.top} className="text-text-secondary h-[14px] w-[14px]" />
                </button>
                {openZones.top && (
                  <div className="mt-3 flex flex-col gap-2">
                    <div className="rounded-input border-border-default flex items-center gap-3 border px-4 py-3">
                      <PencilIcon className="text-text-secondary h-[16px] w-[16px] flex-none" />
                      <span className="text-sm font-medium text-text-primary">{t.editor.headerLabel}</span>
                    </div>
                    <label className="text-text-secondary px-1 text-xs">{t.editor.announcementBarLabel}</label>
                    <Input
                      value={textDraft.announcement}
                      onChange={(e) => setTextDraft((c) => ({ ...c, announcement: e.target.value }))}
                      onBlur={() => void saveAnnouncementBar(textDraft.announcement)}
                      placeholder={t.editor.announcementBarPlaceholder}
                      className="h-10"
                    />
                  </div>
                )}
              </div>

              {/* محتوى الصفحة */}
              <div className="border-border-subtle border-t px-4 py-4">
                <button
                  type="button"
                  onClick={() => toggleZone('content')}
                  className="text-text-primary flex w-full items-center justify-between text-sm font-semibold"
                >
                  <span>
                    {t.editor.pageContent}{' '}
                    <span className="text-text-secondary font-normal">
                      ({t.editor.sectionsCount(visibleContentSections.length)})
                    </span>
                  </span>
                  <ChevronIcon open={openZones.content} className="text-text-secondary h-[14px] w-[14px]" />
                </button>
                {openZones.content && (
                  <div className="mt-3 flex flex-col gap-2">
                    {visibleContentSections.map((section) => (
                      <div key={section.id} className="flex flex-col gap-2">
                        <div className="rounded-input border-border-default flex items-center gap-3 border px-4 py-3">
                          <SectionTypeIcon type={section.type} className="text-text-secondary h-[16px] w-[16px] flex-none" />
                          <span className="flex-1 text-sm font-medium text-text-primary">
                            {t.sectionTypeLabels[section.type]}
                          </span>
                          {EDITABLE_TYPES.includes(section.type) && (
                            <button
                              type="button"
                              onClick={() => setMobileEditingId(mobileEditingId === section.id ? null : section.id)}
                              aria-label={mobileEditingId === section.id ? t.sectionList.closeEdit : t.sectionList.editContent}
                              title={mobileEditingId === section.id ? t.sectionList.closeEdit : t.sectionList.editContent}
                              className="text-text-secondary hover:text-brand"
                            >
                              <PencilIcon className="h-[16px] w-[16px]" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void toggleSectionVisibility(section)}
                            aria-label={t.editor.hideSection}
                            title={t.editor.hideSection}
                            className="text-text-secondary hover:text-danger"
                          >
                            <EyeOffIcon className="h-[16px] w-[16px]" />
                          </button>
                        </div>
                        {mobileEditingId === section.id && (
                          <SectionConfigEditor
                            section={section}
                            accessToken={accessToken}
                            website={website}
                            onWebsiteUpdate={(updated) => setWebsite(updated)}
                            onSaved={(updated) => {
                              if (!activePage) return;
                              mergeSections(activePage.id, [
                                ...visibleContentSections.map((s) => (s.id === updated.id ? updated : s)),
                                ...hiddenContentSections,
                              ]);
                              setMobileEditingId(null);
                            }}
                          />
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => setAddSectionOpen(true)}
                      className="rounded-input border-border-default text-brand flex items-center justify-center gap-2 border border-dashed px-4 py-3 text-sm font-semibold"
                    >
                      <PlusIcon className="h-[16px] w-[16px]" />
                      {t.editor.addSection}
                    </button>
                  </div>
                )}
              </div>

              {/* أسفل الصفحة */}
              <div className="border-border-subtle border-t px-4 py-4">
                <button
                  type="button"
                  onClick={() => toggleZone('bottom')}
                  className="text-text-primary flex w-full items-center justify-between text-sm font-semibold"
                >
                  <span>
                    {t.editor.bottomOfPage}{' '}
                    <span className="text-text-secondary font-normal">({t.editor.sectionsCount(2)})</span>
                  </span>
                  <ChevronIcon open={openZones.bottom} className="text-text-secondary h-[14px] w-[14px]" />
                </button>
                {openZones.bottom && (
                  <div className="mt-3 flex flex-col gap-3">
                    {footerSection && (
                      <div className="rounded-input border-border-default flex items-center gap-3 border px-4 py-3">
                        <SectionTypeIcon type="footer" className="text-text-secondary h-[16px] w-[16px] flex-none" />
                        <span className="flex-1 text-sm font-medium text-text-primary">
                          {t.editor.showFooterOnPage}
                        </span>
                        <Switch
                          checked={footerSection.is_visible}
                          onChange={() => void toggleSectionVisibility(footerSection)}
                        />
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      <div className="rounded-input border-border-default flex items-center gap-3 border px-4 py-3">
                        <PencilIcon className="text-text-secondary h-[16px] w-[16px] flex-none" />
                        <span className="flex-1 text-sm font-medium text-text-primary">
                          {t.editor.footerDescriptionLabel}
                        </span>
                      </div>
                      <Textarea
                        value={textDraft.footerDescription}
                        onChange={(e) => setTextDraft((c) => ({ ...c, footerDescription: e.target.value }))}
                        onBlur={() => void saveFooterDescription(textDraft.footerDescription)}
                        placeholder={t.editor.footerDescriptionPlaceholder}
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 pt-4">
                <h1 className="text-text-primary text-base font-semibold">{t.editor.pageSettings}</h1>
                <button
                  type="button"
                  onClick={() => setPanelView('sections')}
                  className="text-text-secondary hover:text-brand"
                >
                  <CloseIcon className="h-[18px] w-[18px]" />
                </button>
              </div>
              <div className="flex flex-col gap-4 px-4 py-4">
                <div className="flex flex-col gap-2">
                  <label className="text-text-secondary text-xs">{t.editor.font}</label>
                  <Select value={website.font_family} onChange={(e) => void saveFont(e.target.value)} className="h-10">
                    {SUPPORTED_WEBSITE_FONTS.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </>
          )}
        </div>

        {/* نافذة "إضافة قسم" — كل الأقسام المخفية أصلًا بهذه الصفحة، لا نوع قسم جديد. */}
        {addSectionOpen && (
          <>
            <div
              aria-hidden="true"
              onClick={() => setAddSectionOpen(false)}
              className="fixed inset-0 z-50 bg-black/45"
            />
            <div
              role="dialog"
              aria-modal="true"
              className="bg-surface-card rounded-t-card fixed inset-x-0 bottom-0 z-50 flex max-h-[80vh] flex-col overflow-hidden"
            >
              <div className="border-border-subtle flex h-14 flex-none items-center justify-between border-b px-4">
                <h2 className="text-text-primary text-sm font-semibold">{t.editor.addSectionTitle}</h2>
                <button
                  type="button"
                  onClick={() => setAddSectionOpen(false)}
                  aria-label={t.sectionList.closeEdit}
                  className="text-text-secondary hover:bg-surface-subtle flex h-9 w-9 items-center justify-center rounded-full"
                >
                  <CloseIcon className="h-[17px] w-[17px]" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4">
                <div className="relative mb-3">
                  <SearchIcon className="text-text-placeholder pointer-events-none absolute start-4 top-1/2 h-[16px] w-[16px] -translate-y-1/2" />
                  <Input
                    value={addSectionQuery}
                    onChange={(e) => setAddSectionQuery(e.target.value)}
                    placeholder={t.editor.searchSectionPlaceholder}
                    className="ps-10"
                  />
                </div>

                {filteredHiddenSections.length === 0 ? (
                  <p className="text-text-secondary py-6 text-center text-sm">{t.editor.noHiddenSections}</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {filteredHiddenSections.map((section) => (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => {
                          void toggleSectionVisibility(section);
                          setAddSectionOpen(false);
                          setAddSectionQuery('');
                        }}
                        className="rounded-input border-border-default flex items-center gap-3 border px-4 py-3 text-start"
                      >
                        <SectionTypeIcon type={section.type} className="text-text-secondary h-[16px] w-[16px] flex-none" />
                        <span className="flex-1 text-sm font-medium text-text-primary">
                          {t.sectionTypeLabels[section.type]}
                        </span>
                        <PlusIcon className="text-brand h-[16px] w-[16px] flex-none" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bg-surface-page hidden h-screen flex-col md:flex">
        {/* Toolbar */}
        <div className="border-border-subtle bg-surface-card flex h-14 flex-none items-center gap-2 border-b px-4">
          <BackButton href="/website" label={t.editor.backToThemeStore} />
        </div>

        {/* Panel + preview — panel first in DOM so it renders on the right under RTL, matching the reference tool. */}
        <div className="flex min-h-0 flex-1">
          <div className="border-border-subtle bg-surface-card flex w-[360px] flex-none flex-col overflow-auto border-e">
            {panelView === 'sections' ? (
              <>
                <div className="border-border-subtle flex h-14 flex-none items-center justify-between border-b px-4">
                  <h2 className="text-text-primary text-sm font-semibold">
                    {t.editor.sectionsFor(t.pageTabLabels[activePageKey])}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setPanelView('settings')}
                    aria-label={t.editor.pageSettings}
                    title={t.editor.pageSettings}
                    className="text-text-secondary hover:text-brand"
                  >
                    <AdjustmentsIcon className="h-[17px] w-[17px]" />
                  </button>
                </div>
                <div className="divide-border-subtle flex-1 divide-y">
                  <div className="p-4">
                    <FormError message={error} />
                  </div>

                  {/* أعلى الصفحة */}
                  <div className="p-4">
                    <button
                      type="button"
                      onClick={() => toggleZone('top')}
                      className="text-text-primary flex w-full items-center justify-between text-sm font-semibold"
                    >
                      {t.editor.topOfPage}
                      <ChevronIcon
                        open={openZones.top}
                        className="text-text-secondary h-[14px] w-[14px]"
                      />
                    </button>
                    {openZones.top && (
                      <div className="mt-4 flex flex-col gap-4">
                        <p className="text-text-primary text-sm font-semibold">{t.editor.headerLabel}</p>
                        <div className="flex flex-col gap-2">
                          <label className="text-text-secondary text-xs">
                            {t.editor.announcementBarLabel}
                          </label>
                          <Input
                            value={textDraft.announcement}
                            onChange={(e) =>
                              setTextDraft((c) => ({ ...c, announcement: e.target.value }))
                            }
                            onBlur={() => void saveAnnouncementBar(textDraft.announcement)}
                            placeholder={t.editor.announcementBarPlaceholder}
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
                      className="text-text-primary flex w-full items-center justify-between text-sm font-semibold"
                    >
                      {t.editor.pageContent}
                      <ChevronIcon
                        open={openZones.content}
                        className="text-text-secondary h-[14px] w-[14px]"
                      />
                    </button>
                    {openZones.content && (
                      <div className="mt-4">
                        {activePage && (
                          <SectionList
                            key={activePage.id}
                            sections={contentSections}
                            accessToken={accessToken}
                            onChange={(sections) => mergeSections(activePage.id, sections)}
                            website={website}
                            onWebsiteUpdate={(updated) => setWebsite(updated)}
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
                      className="text-text-primary flex w-full items-center justify-between text-sm font-semibold"
                    >
                      {t.editor.bottomOfPage}
                      <ChevronIcon
                        open={openZones.bottom}
                        className="text-text-secondary h-[14px] w-[14px]"
                      />
                    </button>
                    {openZones.bottom && (
                      <div className="mt-4 flex flex-col gap-4">
                        {footerSection && (
                          <div className="rounded-input border-border-default flex items-center justify-between border px-4 py-3">
                            <span className="text-text-primary text-sm">
                              {t.editor.showFooterOnPage}
                            </span>
                            <Switch
                              checked={footerSection.is_visible}
                              onChange={() => void toggleSectionVisibility(footerSection)}
                            />
                          </div>
                        )}

                        <div className="flex flex-col gap-2">
                          <label className="text-text-secondary text-xs">
                            {t.editor.footerDescriptionLabel}
                          </label>
                          <Textarea
                            value={textDraft.footerDescription}
                            onChange={(e) =>
                              setTextDraft((c) => ({ ...c, footerDescription: e.target.value }))
                            }
                            onBlur={() => void saveFooterDescription(textDraft.footerDescription)}
                            placeholder={t.editor.footerDescriptionPlaceholder}
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
                <div className="border-border-subtle flex h-14 flex-none items-center justify-between border-b px-4">
                  <h2 className="text-text-primary text-sm font-semibold">{t.editor.pageSettings}</h2>
                  <button
                    type="button"
                    onClick={() => setPanelView('sections')}
                    className="text-text-secondary hover:text-brand"
                  >
                    <CloseIcon className="h-[17px] w-[17px]" />
                  </button>
                </div>
                <div className="flex-1 p-4">
                  <FormError message={error} />
                  <button
                    type="button"
                    onClick={() => setColorsOpen((v) => !v)}
                    className="text-text-primary flex w-full items-center justify-between py-2 text-sm font-semibold"
                  >
                    {t.editor.colorsAndIdentity}
                    <ChevronIcon
                      open={colorsOpen}
                      className="text-text-secondary h-[14px] w-[14px]"
                    />
                  </button>
                  {colorsOpen && (
                    <div className="flex flex-col gap-4 pb-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-text-secondary text-xs">{t.editor.font}</label>
                        <Select
                          value={website.font_family}
                          onChange={(e) => void saveFont(e.target.value)}
                          className="h-10"
                        >
                          {SUPPORTED_WEBSITE_FONTS.map((font) => (
                            <option key={font} value={font}>
                              {font}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            {/* اختيار الصفحة + تبديل الجهاز — فوق مربع المعاينة تحديدًا (لا فوق الشريط الجانبي)، بحيث تكون معاينة الموقع الحيّة في المنتصف فعليًا، لا مُزاحة بعرض اللوحة الجانبية. */}
            <div className="border-border-subtle bg-surface-card flex h-14 flex-none items-center justify-center gap-3 border-b px-4">
              <Select
                value={activePageKey}
                onChange={(e) => {
                  setActivePageKey(e.target.value as WebsitePageKey);
                  setPanelView('sections');
                }}
                className="bg-surface-subtle-3 !h-10 w-[170px] !rounded-full border-0 px-4 text-sm"
              >
                {WEBSITE_PAGE_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {t.pageTabLabels[key]}
                  </option>
                ))}
              </Select>

              <div className="bg-surface-subtle-3 flex gap-1 rounded-full p-1">
                <button
                  type="button"
                  onClick={() => setDevice('desktop')}
                  aria-label={t.editor.desktopView}
                  title={t.editor.desktopView}
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${device === 'desktop' ? 'bg-surface-card text-brand shadow-sm' : 'text-text-secondary'}`}
                >
                  <DesktopIcon className="h-[16px] w-[16px]" />
                </button>
                <button
                  type="button"
                  onClick={() => setDevice('mobile')}
                  aria-label={t.editor.mobileView}
                  title={t.editor.mobileView}
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${device === 'mobile' ? 'bg-surface-card text-brand shadow-sm' : 'text-text-secondary'}`}
                >
                  <MobileIcon className="h-[16px] w-[16px]" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1">
              <SitePreview siteUrl={siteUrl} pageKey={activePageKey} device={device} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
