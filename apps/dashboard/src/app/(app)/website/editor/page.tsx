'use client';

import { useEffect, useState } from 'react';
import {
  SUPPORTED_WEBSITE_FONTS,
  HERO_VARIANTS,
  type HeroVariant,
  type Website,
  type WebsitePageKey,
  type WebsiteSection,
} from '@sbaah/shared';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { FormError } from '@/components/ui/form-error';
import { EditorSkeleton } from '@/components/website/editor-skeleton';
import { BackButton } from '@/components/ui/back-button';
import { SectionList, EDITABLE_TYPES } from '@/components/website/section-list';
import { SectionConfigEditor } from '@/components/website/section-config-editor';
import { SectionRowMenu } from '@/components/website/section-row-menu';
import { SitePreview, type Device } from '@/components/website/site-preview';
import {
  AdjustmentsIcon,
  CloseIcon,
  DesktopIcon,
  MobileIcon,
  ChevronIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  SectionTypeIcon,
  RadioIcon,
} from '@/components/website/editor-icons';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { getPlatformRootDomain } from '@/lib/env/platform-root-domain';
import {
  getWebsite,
  updateWebsite,
  updateSection,
  duplicateSection,
  type WebsitePageWithSections,
} from '@/lib/api/website';
import { ApiRequestError } from '@/lib/api/client';

type PanelView = 'sections' | 'settings';
type ZoneKey = 'top' | 'content' | 'bottom';

const EDITOR_PAGE_KEYS: WebsitePageKey[] = ['home', 'properties', 'projects'];
const LAVENDER_ALLOWED_SECTIONS: Partial<Record<WebsitePageKey, WebsiteSection['type'][]>> = {
  home: ['hero', 'why_us', 'featured_properties', 'latest_properties', 'projects_showcase', 'stats', 'services', 'property_request'],
  properties: ['property_grid'],
  projects: ['project_grid'],
};

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
  const [textDraft, setTextDraft] = useState({ footerDescription: '' });
  const [error, setError] = useState<string | null>(null);
  const [panelView, setPanelView] = useState<PanelView>('sections');
  const [activePageKey, setActivePageKey] = useState<WebsitePageKey>('home');
  const [device, setDevice] = useState<Device>('desktop');
  const [previewRevision, setPreviewRevision] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [colorsOpen, setColorsOpen] = useState(true);
  const [openZones, setOpenZones] = useState<Record<ZoneKey, boolean>>({
    top: true,
    content: true,
    bottom: true,
  });
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [addSectionQuery, setAddSectionQuery] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [addSectionHeroVariant, setAddSectionHeroVariant] = useState<HeroVariant>('image_search');

  const siteUrl = `https://${me.tenant.subdomain}.${getPlatformRootDomain()}`;
  const activePage = pages.find((p) => p.key === activePageKey);
  // قسم "تواصل" لم يعد يُعرض إطلاقًا في الموقع العام على الرئيسية/تفاصيل
  // العقار (الفوتر يحمل نفس المعلومات) — يُستبعد هنا أيضًا حتى لا يبقى
  // مفتاح توسيط/تحرير ميت بلا أي أثر فعلي، حتى قبل تشغيل migration 0037
  // التي تحذف الصف نفسه من قاعدة البيانات لكل مستأجر.
  const contentSections =
    activePage?.website_sections.filter((s) => {
      if (s.type === 'footer' || s.type === 'broker_marketer_form') return false;
      return (LAVENDER_ALLOWED_SECTIONS[activePageKey] ?? []).includes(s.type);
    }) ?? [];
  // محرر الجوال: الأقسام المُفعَّلة تُعرض في "محتوى الصفحة"، والمخفية
  // تصبح "مكتبة" القسم القابلة للإضافة — كل أقسام الصفحة موجودة أصلًا
  // بقاعدة البيانات منذ إنشاء الحساب (migration 0024، فلسفة "منسّقة لا
  // كنفاس حر")، فـ"الإضافة" هنا تعني تفعيل قسم مخفٍ لا إنشاء نوع جديد.
  const visibleContentSections = contentSections.filter((s) => s.is_visible);
  const hiddenContentSections = contentSections.filter((s) => !s.is_visible);
  const editingSection = visibleContentSections.find((s) => s.id === editingSectionId) ?? null;
  const selectedAddSection = hiddenContentSections.find((s) => s.id === selectedSectionId);
  const filteredHiddenSections = hiddenContentSections.filter((s) =>
    t.sectionTypeLabels[s.type].toLowerCase().includes(addSectionQuery.trim().toLowerCase()),
  );

  useEffect(() => {
    let cancelled = false;
    async function loadEditor() {
      setLoadError(null);
      try {
        const result = await getWebsite(accessToken);
        if (cancelled) return;
        setWebsite(result.website);
        setPages(result.pages);
        setTextDraft({ footerDescription: result.website.footer_description ?? '' });
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof ApiRequestError ? err.message : 'تعذر تحميل تخصيص الموقع.');
      }
    }
    void loadEditor();
    return () => { cancelled = true; };
  }, [accessToken]);

  function toggleZone(zone: ZoneKey) {
    setOpenZones((current) => ({ ...current, [zone]: !current[zone] }));
  }

  async function saveFont(font: string) {
    setError(null);
    try {
      const { website: updated } = await updateWebsite(accessToken, { font_family: font });
      setWebsite((current) => (current ? { ...current, ...updated } : current));
      setPreviewRevision((value) => value + 1);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.editor.errors.saveFont);
    }
  }

  async function saveFooterDescription(value: string) {
    setError(null);
    try {
      const { website: updated } = await updateWebsite(accessToken, {
        footer_description: value || null,
      });
      setWebsite((current) => (current ? { ...current, ...updated } : current));
      setPreviewRevision((value) => value + 1);
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

  /** يُحدّث قسمًا واحدًا (رؤية و/أو محتوى) في حالة الصفحة النشطة دفعة واحدة. */
  async function patchSection(sectionId: string, input: { is_visible?: boolean; config?: Record<string, unknown> }) {
    if (!activePage) return;
    const { section: updated } = await updateSection(accessToken, sectionId, input);
    setPreviewRevision((value) => value + 1);
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

  /** مفتاح الفوتر بالطريقة القديمة، وبند "إخفاء/حذف القسم" بقائمة SectionRowMenu بمحرري الجوال والكمبيوتر. */
  async function toggleSectionVisibility(section: WebsiteSection) {
    await patchSection(section.id, { is_visible: !section.is_visible });
  }

  /** بعد حفظ "تحرير المحتوى" (لوحة الصفحة، جوال وكمبيوتر معًا) — تحديث حالة الصفحة وإغلاق لوحة التحرير عائدًا لقائمة الأقسام. */
  function handleSectionSaved(updated: WebsiteSection) {
    if (!activePage) return;
    mergeSections(activePage.id, [
      ...visibleContentSections.map((s) => (s.id === updated.id ? updated : s)),
      ...hiddenContentSections,
    ]);
    setEditingSectionId(null);
    setPreviewRevision((value) => value + 1);
  }

  /** بند "تكرار القسم" بقائمة SectionRowMenu — ينسخ الصف عبر duplicateSection API، ويضيفه لحالة الصفحة النشطة. */
  async function duplicateSectionHandler(section: WebsiteSection) {
    if (!activePage) return;
    const { section: created } = await duplicateSection(accessToken, section.id);
    setPages((current) =>
      current.map((p) => (p.id === activePage.id ? { ...p, website_sections: [...p.website_sections, created] } : p)),
    );
  }

  function closeAddSectionSheet() {
    setAddSectionOpen(false);
    setAddSectionQuery('');
    setSelectedSectionId(null);
    setAddSectionHeroVariant('image_search');
  }

  function confirmAddSection() {
    const section = hiddenContentSections.find((s) => s.id === selectedSectionId);
    if (!section) return;
    // قسم الهيرو له عدة نماذج (صورة/فيديو، مع/بلا فلتر بحث) — يُختار
    // النموذج هنا مباشرة عند الإضافة بدل الاضطرار لفتح "تحرير المحتوى"
    // كخطوة ثانية منفصلة بعد التفعيل.
    if (section.type === 'hero') {
      void patchSection(section.id, {
        is_visible: true,
        config: { ...section.config, variant: addSectionHeroVariant },
      });
    } else {
      void toggleSectionVisibility(section);
    }
    closeAddSectionSheet();
  }

  if (!website) {
    if (loadError) {
      return (
        <div className="bg-surface-page flex min-h-screen items-center justify-center p-6">
          <div className="bg-surface-card border-border-default flex w-full max-w-md flex-col gap-4 rounded-2xl border p-6 text-center">
            <FormError message={loadError} />
            <Button type="button" variant="secondary" onClick={() => window.location.reload()} className="self-center">
              إعادة المحاولة
            </Button>
          </div>
        </div>
      );
    }
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
              setEditingSectionId(null);
            }}
            className="bg-surface-subtle-3 !h-9 flex-1 !rounded-full border-0 px-4 text-sm"
          >
            {EDITOR_PAGE_KEYS.map((key) => (
              <option key={key} value={key}>
                {t.pageTabLabels[key]}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex-1 overflow-auto">
          {editingSection ? (
            <>
              {/* "تحرير المحتوى" يستبدل قائمة الأقسام بنفس اللوحة (طلب المؤسس) بدل نافذة منبثقة منفصلة — تمامًا كتبديل لوحة "إعدادات الصفحة". */}
              <div className="flex items-center justify-between px-4 pt-4">
                <h1 className="text-text-primary text-base font-semibold">{t.sectionTypeLabels[editingSection.type]}</h1>
                <button
                  type="button"
                  onClick={() => setEditingSectionId(null)}
                  aria-label={t.sectionList.closeEdit}
                  title={t.sectionList.closeEdit}
                  className="text-text-secondary hover:text-brand"
                >
                  <CloseIcon className="h-[18px] w-[18px]" />
                </button>
              </div>
              <div className="px-4 py-4">
                <SectionConfigEditor
                  section={editingSection}
                  accessToken={accessToken}
                  website={website}
                  onWebsiteUpdate={(updated) => setWebsite(updated)}
                  onSaved={handleSectionSaved}
                />
              </div>
            </>
          ) : panelView === 'sections' ? (
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

              <a href="/website" className="text-brand mt-1 block px-4 text-sm font-semibold hover:underline">
                {t.editor.changeTheme}
              </a>

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
                              onClick={() => setEditingSectionId(section.id)}
                              aria-label={t.sectionList.editContent}
                              title={t.sectionList.editContent}
                              className="text-text-secondary hover:text-brand"
                            >
                              <PencilIcon className="h-[16px] w-[16px]" />
                            </button>
                          )}
                          <SectionRowMenu
                            onHide={() => void toggleSectionVisibility(section)}
                            onDuplicate={() => void duplicateSectionHandler(section)}
                          />
                        </div>
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
                    <span className="text-text-secondary font-normal">({t.editor.sectionsCount(1)})</span>
                  </span>
                  <ChevronIcon open={openZones.bottom} className="text-text-secondary h-[14px] w-[14px]" />
                </button>
                {openZones.bottom && (
                  <div className="mt-3 flex flex-col gap-3">
                    <p className="text-text-primary text-sm font-semibold">{t.editor.footerLabel}</p>

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

        {/*
          نافذة "إضافة قسم" — كل الأقسام المخفية أصلًا بهذه الصفحة، لا نوع
          قسم جديد. تحديد (راديو) أولًا، ثم تأكيد بزر "إضافة" أسفل القائمة
          — لا إضافة فورية بمجرد الضغط على الصف — مطابقةً لمرجع الجوال
          (اختيار يبقي النافذة مفتوحة، ثم "إضافة"/"إلغاء" صريحان).
        */}
        {addSectionOpen && (
          <>
            <div
              aria-hidden="true"
              onClick={closeAddSectionSheet}
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
                  onClick={closeAddSectionSheet}
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
                    {filteredHiddenSections.map((section) => {
                      const selected = selectedSectionId === section.id;
                      return (
                        <button
                          key={section.id}
                          type="button"
                          onClick={() => setSelectedSectionId(section.id)}
                          className={`rounded-input flex items-center gap-3 border px-4 py-3 text-start ${
                            selected ? 'border-brand ring-brand ring-1' : 'border-border-default'
                          }`}
                        >
                          <SectionTypeIcon type={section.type} className="text-text-secondary h-[16px] w-[16px] flex-none" />
                          <span className="flex-1 text-sm font-medium text-text-primary">
                            {t.sectionTypeLabels[section.type]}
                          </span>
                          <RadioIcon selected={selected} className="text-brand h-[18px] w-[18px] flex-none" />
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedAddSection?.type === 'hero' && (
                  <div className="mt-3 flex flex-col gap-2">
                    <label className="text-text-secondary text-xs">{t.sectionConfigEditor.heroVariantLabel}</label>
                    <Select
                      value={addSectionHeroVariant}
                      onChange={(e) => setAddSectionHeroVariant(e.target.value as HeroVariant)}
                      className="h-10"
                    >
                      {HERO_VARIANTS.map((variant) => (
                        <option key={variant} value={variant}>
                          {t.sectionConfigEditor.heroVariants[variant]}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>

              <div className="border-border-subtle flex flex-none items-center gap-2 border-t p-4">
                <Button type="button" onClick={confirmAddSection} disabled={!selectedSectionId} className="flex-1">
                  {t.editor.addSectionConfirm}
                </Button>
                <Button type="button" variant="secondary" onClick={closeAddSectionSheet} className="flex-1">
                  {t.editor.addSectionCancel}
                </Button>
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
            {editingSection ? (
              <>
                {/* "تحرير المحتوى" يستبدل قائمة الأقسام بنفس اللوحة (طلب المؤسس) بدل نافذة منبثقة منفصلة — تمامًا كتبديل لوحة "إعدادات الصفحة". */}
                <div className="border-border-subtle flex h-14 flex-none items-center justify-between border-b px-4">
                  <h2 className="text-text-primary text-sm font-semibold">{t.sectionTypeLabels[editingSection.type]}</h2>
                  <button
                    type="button"
                    onClick={() => setEditingSectionId(null)}
                    aria-label={t.sectionList.closeEdit}
                    title={t.sectionList.closeEdit}
                    className="text-text-secondary hover:text-brand"
                  >
                    <CloseIcon className="h-[17px] w-[17px]" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  <SectionConfigEditor
                    section={editingSection}
                    accessToken={accessToken}
                    website={website}
                    onWebsiteUpdate={(updated) => setWebsite(updated)}
                    onSaved={handleSectionSaved}
                  />
                </div>
              </>
            ) : panelView === 'sections' ? (
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
                      <div className="mt-4 flex flex-col gap-3">
                        {activePage && (
                          <SectionList
                            key={activePage.id}
                            sections={visibleContentSections}
                            accessToken={accessToken}
                            // SectionList لا يعرف إلا الأقسام الظاهرة (reorder
                            // API يُعيد فقط ما أرسلناه له) — لازم إعادة دمج
                            // الأقسام المخفية يدويًا هنا وإلا تضيع من الحالة.
                            onChange={(updatedVisible) =>
                              mergeSections(activePage.id, [...updatedVisible, ...hiddenContentSections])
                            }
                            onHide={(section) => void toggleSectionVisibility(section)}
                            onDuplicate={(section) => void duplicateSectionHandler(section)}
                            onEdit={(sectionId) => setEditingSectionId(sectionId)}
                          />
                        )}
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
                        <p className="text-text-primary text-sm font-semibold">{t.editor.footerLabel}</p>

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
                  setEditingSectionId(null);
                }}
                className="bg-surface-subtle-3 !h-10 w-[170px] !rounded-full border-0 px-4 text-sm"
              >
                {EDITOR_PAGE_KEYS.map((key) => (
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
              <SitePreview siteUrl={siteUrl} pageKey={activePageKey} device={device} accessToken={accessToken} revision={previewRevision} />
            </div>
          </div>
        </div>

        {/* نافذة "إضافة قسم" بعرض الكمبيوتر — نفس حالة/منطق نافذة الجوال
            (اختيار راديو يبقي النافذة مفتوحة، ثم تأكيد صريح)، بقالب Modal
            المشترك المستخدم أصلًا في كل تدفقات "+ إضافة ..." بلوحة التحكم،
            بدل نمط الورقة السفلية الخاص بالجوال. */}
        {addSectionOpen && (
          <Modal title={t.editor.addSectionTitle} onClose={closeAddSectionSheet} maxWidth="420px">
            <div className="flex flex-col gap-3">
              <div className="relative">
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
                <div className="flex max-h-[320px] flex-col gap-2 overflow-y-auto">
                  {filteredHiddenSections.map((section) => {
                    const selected = selectedSectionId === section.id;
                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => setSelectedSectionId(section.id)}
                        className={`rounded-input flex items-center gap-3 border px-4 py-3 text-start ${
                          selected ? 'border-brand ring-brand ring-1' : 'border-border-default'
                        }`}
                      >
                        <SectionTypeIcon type={section.type} className="text-text-secondary h-[16px] w-[16px] flex-none" />
                        <span className="flex-1 text-sm font-medium text-text-primary">
                          {t.sectionTypeLabels[section.type]}
                        </span>
                        <RadioIcon selected={selected} className="text-brand h-[18px] w-[18px] flex-none" />
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedAddSection?.type === 'hero' && (
                <div className="flex flex-col gap-2">
                  <label className="text-text-secondary text-xs">{t.sectionConfigEditor.heroVariantLabel}</label>
                  <Select
                    value={addSectionHeroVariant}
                    onChange={(e) => setAddSectionHeroVariant(e.target.value as HeroVariant)}
                    className="h-10"
                  >
                    {HERO_VARIANTS.map((variant) => (
                      <option key={variant} value={variant}>
                        {t.sectionConfigEditor.heroVariants[variant]}
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <Button type="button" onClick={confirmAddSection} disabled={!selectedSectionId} className="flex-1">
                  {t.editor.addSectionConfirm}
                </Button>
                <Button type="button" variant="secondary" onClick={closeAddSectionSheet} className="flex-1">
                  {t.editor.addSectionCancel}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </>
  );
}
