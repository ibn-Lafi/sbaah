'use client';

import { useEffect, useState } from 'react';
import {
  HERO_VARIANTS,
  HERO_SEARCH_MODES,
  type AboutSectionConfig,
  type StatsSectionConfig,
  type ServicesSectionConfig,
  type FaqSectionConfig,
  type HeroSectionConfig,
  type HeroSearchMode,
  type HeroVariant,
  resolveHeroSearchMode,
  type Website,
  type WebsiteSection,
  type City,
  type Asset,
  type SectionTone,
  type SectionHeadingAlign,
  type SectionColumns,
} from '@sbaah/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { useLocale } from '@/lib/i18n/locale-context';
import {
  updateSection,
  uploadBanner,
  uploadBannerVideo,
  uploadSectionAsset,
  updateWebsite,
} from '@/lib/api/website';
import { AssetUploader } from './asset-uploader';
import { listAssets } from '@/lib/api/real-estate';
import { listCities } from '@/lib/api/reference-data';

interface SectionConfigEditorProps {
  section: WebsiteSection;
  accessToken: string;
  onSaved: (section: WebsiteSection) => void;
  /**
   * صورة/فيديو خلفية الهيرو (website.banner_image_url/banner_video_url)
   * يبقيان على مستوى الموقع (مشتركان بين كل الصفحات، كما كانا) — لا
   * علاقة لهما بـ`section.config` — لذلك هذا المكوّن يحتاج نسخة `website`
   * الحالية وطريقة لتحديثها في حالة الصفحة الأب، فقط لقسم hero.
   */
  website: Website;
  onWebsiteUpdate: (website: Website) => void;
}

/**
 * public-site (task 35/42) renders these fields for real — this is the
 * editing side task 28/42 deliberately deferred ("لا تحرير حر لمحتوى
 * نصي داخل الأقسام... يحتاج قرارًا منفصلًا"). حقل واحد لكل معنى (عنوان/
 * عنوان فرعي/نص) بلا نسخة إنجليزية — الثيم الأساسي بلغة عربية واحدة فقط
 * (طلب المؤسس)، خلافًا لحقول أخرى ثنائية اللغة فعليًا بالمنتج (مثل
 * عنوان العقار). `footer`/`property_grid` لا محتوى حر يستحق تحريرًا هنا
 * — `property_grid` يعرض عقارات حقيقية، و`footer` فقط اسم المستأجر
 * + شارة سبعة الثابتة.
 *
 * قسم hero فقط يضيف شكل القسم (HERO_VARIANTS) + رفع الصورة أو الفيديو
 * المناسب للشكل المختار — طلب المؤسس (ترتيب أقسام الصفحة الرئيسية، ثيم
 * الأساسي): صورة فقط / صورة مع فلتر بحث العقارات / فيديو فقط / فيديو
 * مع فلتر بحث العقارات.
 */
export function SectionConfigEditor({
  section,
  accessToken,
  onSaved,
  website,
  onWebsiteUpdate,
}: SectionConfigEditorProps) {
  const { pages } = useLocale();
  const t = pages.website;
  const isHero = section.type === 'hero';
  const hasBody = [
    'about',
    'why_us',
    'cta',
    'property_request',
    'promo_banner',
    'free_content',
  ].includes(section.type);
  const hasSimpleTitle = !['property_detail', 'project_detail', 'map', 'footer'].includes(
    section.type,
  );
  const config = section.config as HeroSectionConfig & AboutSectionConfig;

  const [titleAr, setTitleAr] = useState(config.title_ar ?? '');
  const [subtitleAr, setSubtitleAr] = useState(config.subtitle_ar ?? '');
  const [bodyAr, setBodyAr] = useState(config.body_ar ?? '');
  const [variant, setVariant] = useState<HeroVariant>(config.variant ?? 'image_search');
  const [searchMode, setSearchMode] = useState<HeroSearchMode>(() => resolveHeroSearchMode(config));
  const [loading, setLoading] = useState(false);
  type EditorItem = {
    value?: string;
    label?: string;
    title?: string;
    description?: string;
    question?: string;
    answer?: string;
  };
  const [items, setItems] = useState<EditorItem[]>(() => {
    const configured = (((section.config as StatsSectionConfig & ServicesSectionConfig & FaqSectionConfig).items ?? []) as EditorItem[]);
    if (section.type !== 'stats') return configured;
    return Array.from({ length: 3 }, (_, index) => configured[index] ?? { value: '', label: '' });
  });
  const [buttonLabel, setButtonLabel] = useState(String(section.config.button_label ?? ''));
  const [buttonUrl, setButtonUrl] = useState(String(section.config.button_url ?? ''));
  const [mediaUrl, setMediaUrl] = useState(
    String(section.config.image_url ?? section.config.video_url ?? ''),
  );
  const hasItems = ['stats', 'services', 'faq'].includes(section.type);
  const hasButton = ['cta', 'promo_banner', 'free_content'].includes(section.type);
  const hasImageUrl = ['promo_banner', 'free_content'].includes(section.type);
  const hasVideoUrl = section.type === 'video';
  const isGallery = section.type === 'gallery';
  const [galleryUrls, setGalleryUrls] = useState<string[]>(() =>
    Array.isArray(section.config.image_urls) ? (section.config.image_urls as string[]) : [],
  );
  const hasLimit = ['latest_properties', 'projects_showcase'].includes(section.type);
  const isFeaturedProperties = section.type === 'featured_properties';
  const isPropertiesByCity = section.type === 'properties_by_city';
  const [properties, setProperties] = useState<Asset[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>(() =>
    Array.isArray(section.config.property_ids) ? (section.config.property_ids as string[]) : [],
  );
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>(() =>
    Array.isArray(section.config.city_ids) ? (section.config.city_ids as string[]) : [],
  );
  const [limit, setLimit] = useState(String(section.config.limit ?? 6));
  const supportsPresentation = [
    'featured_properties',
    'latest_properties',
    'projects_showcase',
    'properties_by_city',
    'stats',
    'services',
    'faq',
  ].includes(section.type);
  const supportsColumns = [
    'featured_properties',
    'latest_properties',
    'projects_showcase',
    'properties_by_city',
    'stats',
    'services',
  ].includes(section.type);
  const [tone, setTone] = useState<SectionTone>((section.config.tone as SectionTone) ?? 'default');
  const [headingAlign, setHeadingAlign] = useState<SectionHeadingAlign>(
    (section.config.heading_align as SectionHeadingAlign) ?? 'start',
  );
  const [columns, setColumns] = useState<SectionColumns>(
    (section.config.columns as SectionColumns) ?? 3,
  );

  useEffect(() => {
    if (isFeaturedProperties) void listAssets(accessToken).then((r) => setProperties(r.assets));
    if (isPropertiesByCity) void listCities().then(setCities);
  }, [accessToken, isFeaturedProperties, isPropertiesByCity]);

  async function handleSave() {
    setLoading(true);
    try {
      const nextConfig: Record<string, unknown> = {};
      if (titleAr) nextConfig.title_ar = titleAr;
      if (hasItems) nextConfig.items = section.type === 'stats' ? items.slice(0, 3) : items;
      if (hasButton && buttonLabel) nextConfig.button_label = buttonLabel;
      if (hasButton && buttonUrl) nextConfig.button_url = buttonUrl;
      if (hasImageUrl && mediaUrl) nextConfig.image_url = mediaUrl;
      if (hasVideoUrl && mediaUrl) nextConfig.video_url = mediaUrl;
      if (isGallery) nextConfig.image_urls = galleryUrls.filter(Boolean);
      if (hasLimit) nextConfig.limit = Math.max(1, Math.min(12, Number(limit) || 6));
      if (isFeaturedProperties) nextConfig.property_ids = selectedPropertyIds;
      if (isPropertiesByCity) nextConfig.city_ids = selectedCityIds;
      if (isHero && subtitleAr) nextConfig.subtitle_ar = subtitleAr;
      if (hasBody && bodyAr) nextConfig.body_ar = bodyAr;
      if (isHero) {
        nextConfig.variant = variant;
        const variantHasSearch = variant === 'image_search' || variant === 'video_search';
        nextConfig.search_mode = variantHasSearch
          ? searchMode === 'none'
            ? 'both'
            : searchMode
          : 'none';
      }
      if (supportsPresentation) {
        nextConfig.tone = tone;
        nextConfig.heading_align = headingAlign;
      }
      if (supportsColumns) nextConfig.columns = columns;

      const { section: updated } = await updateSection(accessToken, section.id, {
        config: nextConfig,
      });
      onSaved(updated);
    } finally {
      setLoading(false);
    }
  }

  const showImageUploader = isHero && (variant === 'image' || variant === 'image_search');
  const showVideoUploader = isHero && (variant === 'video' || variant === 'video_search');

  return (
    <div className="rounded-input border-border-subtle bg-surface-subtle flex flex-col gap-3 border p-4">
      {hasSimpleTitle && (
        <Input
          placeholder={t.sectionConfigEditor.title}
          value={titleAr}
          onChange={(e) => setTitleAr(e.target.value)}
        />
      )}

      {hasItems && (
        <div className="flex flex-col gap-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="rounded-input border-border-default bg-surface-card border p-3"
            >
              <div className="grid gap-2 sm:grid-cols-2">
                {section.type === 'stats' && (
                  <>
                    <Input
                      placeholder="الرقم"
                      value={item.value ?? ''}
                      onChange={(e) =>
                        setItems((v) =>
                          v.map((x, i) => (i === index ? { ...x, value: e.target.value } : x)),
                        )
                      }
                    />
                    <Input
                      placeholder="الوصف"
                      value={item.label ?? ''}
                      onChange={(e) =>
                        setItems((v) =>
                          v.map((x, i) => (i === index ? { ...x, label: e.target.value } : x)),
                        )
                      }
                    />
                  </>
                )}
                {section.type === 'services' && (
                  <>
                    <Input
                      placeholder="اسم الخدمة"
                      value={item.title ?? ''}
                      onChange={(e) =>
                        setItems((v) =>
                          v.map((x, i) => (i === index ? { ...x, title: e.target.value } : x)),
                        )
                      }
                    />
                    <Input
                      placeholder="وصف الخدمة"
                      value={item.description ?? ''}
                      onChange={(e) =>
                        setItems((v) =>
                          v.map((x, i) =>
                            i === index ? { ...x, description: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </>
                )}
                {section.type === 'faq' && (
                  <>
                    <Input
                      placeholder="السؤال"
                      value={item.question ?? ''}
                      onChange={(e) =>
                        setItems((v) =>
                          v.map((x, i) => (i === index ? { ...x, question: e.target.value } : x)),
                        )
                      }
                    />
                    <Input
                      placeholder="الإجابة"
                      value={item.answer ?? ''}
                      onChange={(e) =>
                        setItems((v) =>
                          v.map((x, i) => (i === index ? { ...x, answer: e.target.value } : x)),
                        )
                      }
                    />
                  </>
                )}
              </div>
              {section.type !== 'stats' && (
                <button
                  type="button"
                  onClick={() => setItems((v) => v.filter((_, i) => i !== index))}
                  className="mt-2 text-xs text-red-600 hover:underline"
                >
                  حذف
                </button>
              )}
            </div>
          ))}
          {section.type !== 'stats' && (
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setItems((v) => [
                  ...v,
                  section.type === 'services'
                    ? { title: '', description: '' }
                    : { question: '', answer: '' },
                ])
              }
              className="w-fit"
            >
              + إضافة {section.type === 'services' ? 'خدمة' : 'سؤال'}
            </Button>
          )}
          {section.type === 'stats' && (
            <p className="text-text-secondary text-xs">قسم أرقامنا ثابت على 3 أرقام.</p>
          )}
        </div>
      )}
      {hasButton && (
        <>
          <Input
            placeholder="نص الزر"
            value={buttonLabel}
            onChange={(e) => setButtonLabel(e.target.value)}
          />
          <Input
            placeholder="رابط الزر"
            value={buttonUrl}
            onChange={(e) => setButtonUrl(e.target.value)}
          />
        </>
      )}
      {supportsPresentation && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-text-secondary text-xs">خلفية القسم</label>
            <Select
              value={tone}
              onChange={(e) => setTone(e.target.value as SectionTone)}
              className="h-10"
            >
              <option value="default">افتراضية</option>
              <option value="soft">هادئة</option>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-text-secondary text-xs">محاذاة عنوان القسم</label>
            <Select
              value={headingAlign}
              onChange={(e) => setHeadingAlign(e.target.value as SectionHeadingAlign)}
              className="h-10"
            >
              <option value="start">بداية القسم</option>
              <option value="center">توسيط</option>
            </Select>
          </div>
          {supportsColumns && (
            <div className="flex flex-col gap-2">
              <label className="text-text-secondary text-xs">عدد الأعمدة على الشاشات الكبيرة</label>
              <Select
                value={String(columns)}
                onChange={(e) => setColumns(Number(e.target.value) as SectionColumns)}
                className="h-10"
              >
                <option value="2">عمودان</option>
                <option value="3">3 أعمدة</option>
                <option value="4">4 أعمدة</option>
              </Select>
            </div>
          )}
        </div>
      )}
      {hasLimit && (
        <Input
          type="number"
          min="1"
          max="12"
          placeholder="عدد العناصر"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
        />
      )}
      {isFeaturedProperties && (
        <div className="flex flex-col gap-2">
          <label className="text-text-secondary text-xs">اختر العقارات المميزة</label>
          <div className="rounded-input border-border-default bg-surface-card max-h-56 overflow-auto border p-2">
            {properties.map((property) => (
              <label
                key={property.id}
                className="hover:bg-surface-subtle flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedPropertyIds.includes(property.id)}
                  onChange={(e) =>
                    setSelectedPropertyIds((v) =>
                      e.target.checked ? [...v, property.id] : v.filter((id) => id !== property.id),
                    )
                  }
                />
                <span>{property.name_ar}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      {isPropertiesByCity && (
        <div className="flex flex-col gap-2">
          <label className="text-text-secondary text-xs">اختر المدن</label>
          <div className="rounded-input border-border-default bg-surface-card max-h-56 overflow-auto border p-2">
            {cities.map((city) => (
              <label
                key={city.id}
                className="hover:bg-surface-subtle flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedCityIds.includes(city.id)}
                  onChange={(e) =>
                    setSelectedCityIds((v) =>
                      e.target.checked ? [...v, city.id] : v.filter((id) => id !== city.id),
                    )
                  }
                />
                <span>{city.name_ar}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {isGallery && (
        <div className="flex flex-col gap-3">
          {galleryUrls.map((url, index) => (
            <div key={url + index} className="flex items-center gap-3">
              <img src={url} alt="" className="rounded-input h-16 w-24 object-cover" />
              <Button
                type="button"
                variant="danger"
                onClick={() => setGalleryUrls((v) => v.filter((_, i) => i !== index))}
              >
                حذف
              </Button>
            </div>
          ))}
          <label className="w-fit cursor-pointer">
            <span className="rounded-input border-border-default bg-surface-card inline-flex border px-4 py-2 text-sm font-medium">
              + رفع صورة
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file)
                  void uploadSectionAsset(accessToken, section.id, file).then((r) =>
                    setGalleryUrls((v) => [...v, r.url]),
                  );
              }}
            />
          </label>
        </div>
      )}
      {hasImageUrl && (
        <AssetUploader
          label="صورة القسم"
          currentUrl={mediaUrl || null}
          onUpload={async (file) => {
            const r = await uploadSectionAsset(accessToken, section.id, file);
            setMediaUrl(r.url);
          }}
          onRemove={async () => setMediaUrl('')}
        />
      )}
      {hasVideoUrl && (
        <Input
          placeholder="رابط الفيديو"
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
        />
      )}

      {isHero && (
        <Input
          placeholder={t.sectionConfigEditor.subtitle}
          value={subtitleAr}
          onChange={(e) => setSubtitleAr(e.target.value)}
        />
      )}

      {hasBody && (
        <Textarea
          placeholder={t.sectionConfigEditor.body}
          value={bodyAr}
          onChange={(e) => setBodyAr(e.target.value)}
        />
      )}

      {isHero && (
        <div className="flex flex-col gap-2">
          <label className="text-text-secondary text-xs">
            {t.sectionConfigEditor.heroVariantLabel}
          </label>
          <Select
            value={variant}
            onChange={(e) => {
              const nextVariant = e.target.value as HeroVariant;
              const variantHasSearch =
                nextVariant === 'image_search' || nextVariant === 'video_search';
              setVariant(nextVariant);
              setSearchMode((current) =>
                variantHasSearch ? (current === 'none' ? 'both' : current) : 'none',
              );
            }}
            className="h-10"
          >
            {HERO_VARIANTS.map((v) => (
              <option key={v} value={v}>
                {t.sectionConfigEditor.heroVariants[v]}
              </option>
            ))}
          </Select>
        </div>
      )}

      {isHero && (variant === 'image_search' || variant === 'video_search') && (
        <div className="flex flex-col gap-2">
          <label className="text-text-secondary text-xs">
            {t.sectionConfigEditor.heroSearchModeLabel}
          </label>
          <Select
            value={searchMode}
            onChange={(e) => setSearchMode(e.target.value as HeroSearchMode)}
            className="h-10"
          >
            {HERO_SEARCH_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {t.sectionConfigEditor.heroSearchModes[mode]}
              </option>
            ))}
          </Select>
        </div>
      )}

      {showImageUploader && (
        <AssetUploader
          label={t.sectionConfigEditor.heroImageLabel}
          currentUrl={website.banner_image_url}
          onUpload={async (file) => {
            const { website: updated } = await uploadBanner(accessToken, file);
            onWebsiteUpdate(updated);
          }}
          onRemove={async () => {
            const { website: updated } = await updateWebsite(accessToken, {
              banner_image_url: null,
            });
            onWebsiteUpdate(updated);
          }}
        />
      )}

      {showVideoUploader && (
        <AssetUploader
          kind="video"
          label={t.sectionConfigEditor.heroVideoLabel}
          currentUrl={website.banner_video_url}
          onUpload={async (file) => {
            const { website: updated } = await uploadBannerVideo(accessToken, file);
            onWebsiteUpdate(updated);
          }}
          onRemove={async () => {
            const { website: updated } = await updateWebsite(accessToken, {
              banner_video_url: null,
            });
            onWebsiteUpdate(updated);
          }}
        />
      )}

      <Button
        type="button"
        variant="secondary"
        onClick={() => void handleSave()}
        disabled={loading}
        className="w-fit"
      >
        {loading ? t.sectionConfigEditor.saving : t.sectionConfigEditor.save}
      </Button>
    </div>
  );
}
