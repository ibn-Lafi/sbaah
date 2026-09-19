'use client';

import { useState } from 'react';
import {
  HERO_VARIANTS,
  type AboutSectionConfig,
  type StatsSectionConfig,
  type ServicesSectionConfig,
  type FaqSectionConfig,
  type HeroSectionConfig,
  type HeroVariant,
  type Website,
  type WebsiteSection,
} from '@sbaah/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { useLocale } from '@/lib/i18n/locale-context';
import { updateSection, uploadBanner, uploadBannerVideo, updateWebsite } from '@/lib/api/website';
import { AssetUploader } from './asset-uploader';

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
export function SectionConfigEditor({ section, accessToken, onSaved, website, onWebsiteUpdate }: SectionConfigEditorProps) {
  const { pages } = useLocale();
  const t = pages.website;
  const isHero = section.type === 'hero';
  const hasBody = ['about','why_us','cta','property_request','promo_banner','free_content'].includes(section.type);
  const hasSimpleTitle = !['property_detail','map','footer'].includes(section.type);
  const config = section.config as HeroSectionConfig & AboutSectionConfig;

  const [titleAr, setTitleAr] = useState(config.title_ar ?? '');
  const [subtitleAr, setSubtitleAr] = useState(config.subtitle_ar ?? '');
  const [bodyAr, setBodyAr] = useState(config.body_ar ?? '');
  const [variant, setVariant] = useState<HeroVariant>(config.variant ?? 'image_search');
  const [loading, setLoading] = useState(false);
  type EditorItem = { value?: string; label?: string; title?: string; description?: string; question?: string; answer?: string };
  const [items, setItems] = useState<EditorItem[]>(() => ((section.config as StatsSectionConfig & ServicesSectionConfig & FaqSectionConfig).items ?? []) as EditorItem[]);
  const [buttonLabel, setButtonLabel] = useState(String(section.config.button_label ?? ''));
  const [buttonUrl, setButtonUrl] = useState(String(section.config.button_url ?? ''));
  const [mediaUrl, setMediaUrl] = useState(String(section.config.image_url ?? section.config.video_url ?? ''));
  const hasItems = ['stats','services','faq'].includes(section.type);
  const hasButton = ['cta','promo_banner','free_content'].includes(section.type);
  const hasImageUrl = ['promo_banner','free_content'].includes(section.type);
  const hasVideoUrl = section.type === 'video';

  async function handleSave() {
    setLoading(true);
    try {
      const nextConfig: Record<string, unknown> = {};
      if (titleAr) nextConfig.title_ar = titleAr;
      if (hasItems) nextConfig.items = items;
      if (hasButton && buttonLabel) nextConfig.button_label = buttonLabel;
      if (hasButton && buttonUrl) nextConfig.button_url = buttonUrl;
      if (hasImageUrl && mediaUrl) nextConfig.image_url = mediaUrl;
      if (hasVideoUrl && mediaUrl) nextConfig.video_url = mediaUrl;
      if (isHero && subtitleAr) nextConfig.subtitle_ar = subtitleAr;
      if (hasBody && bodyAr) nextConfig.body_ar = bodyAr;
      if (isHero) nextConfig.variant = variant;

      const { section: updated } = await updateSection(accessToken, section.id, { config: nextConfig });
      onSaved(updated);
    } finally {
      setLoading(false);
    }
  }

  const showImageUploader = isHero && (variant === 'image' || variant === 'image_search');
  const showVideoUploader = isHero && (variant === 'video' || variant === 'video_search');

  return (
    <div className="flex flex-col gap-3 rounded-input border border-border-subtle bg-surface-subtle p-4">
      {hasSimpleTitle && <Input placeholder={t.sectionConfigEditor.title} value={titleAr} onChange={(e) => setTitleAr(e.target.value)} />}

      {hasItems && (
        <div className="flex flex-col gap-3">
          {items.map((item, index) => (
            <div key={index} className="rounded-input border border-border-default bg-surface-card p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                {section.type === 'stats' && <>
                  <Input placeholder="الرقم" value={item.value ?? ''} onChange={(e) => setItems((v) => v.map((x,i) => i===index ? {...x,value:e.target.value}:x))} />
                  <Input placeholder="الوصف" value={item.label ?? ''} onChange={(e) => setItems((v) => v.map((x,i) => i===index ? {...x,label:e.target.value}:x))} />
                </>}
                {section.type === 'services' && <>
                  <Input placeholder="اسم الخدمة" value={item.title ?? ''} onChange={(e) => setItems((v) => v.map((x,i) => i===index ? {...x,title:e.target.value}:x))} />
                  <Input placeholder="وصف الخدمة" value={item.description ?? ''} onChange={(e) => setItems((v) => v.map((x,i) => i===index ? {...x,description:e.target.value}:x))} />
                </>}
                {section.type === 'faq' && <>
                  <Input placeholder="السؤال" value={item.question ?? ''} onChange={(e) => setItems((v) => v.map((x,i) => i===index ? {...x,question:e.target.value}:x))} />
                  <Input placeholder="الإجابة" value={item.answer ?? ''} onChange={(e) => setItems((v) => v.map((x,i) => i===index ? {...x,answer:e.target.value}:x))} />
                </>}
              </div>
              <button type="button" onClick={() => setItems((v) => v.filter((_,i) => i!==index))} className="mt-2 text-xs text-red-600 hover:underline">حذف</button>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => setItems((v) => [...v, section.type === 'stats' ? {value:'',label:''} : section.type === 'services' ? {title:'',description:''} : {question:'',answer:''}])} className="w-fit">
            + إضافة {section.type === 'stats' ? 'رقم' : section.type === 'services' ? 'خدمة' : 'سؤال'}
          </Button>
        </div>
      )}
      {hasButton && <><Input placeholder="نص الزر" value={buttonLabel} onChange={(e) => setButtonLabel(e.target.value)} /><Input placeholder="رابط الزر" value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)} /></>}
      {(hasImageUrl || hasVideoUrl) && <Input placeholder={hasVideoUrl ? 'رابط الفيديو' : 'رابط الصورة'} value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} />}

      {isHero && (
        <Input placeholder={t.sectionConfigEditor.subtitle} value={subtitleAr} onChange={(e) => setSubtitleAr(e.target.value)} />
      )}

      {hasBody && (
        <Textarea placeholder={t.sectionConfigEditor.body} value={bodyAr} onChange={(e) => setBodyAr(e.target.value)} />
      )}

      {isHero && (
        <div className="flex flex-col gap-2">
          <label className="text-text-secondary text-xs">{t.sectionConfigEditor.heroVariantLabel}</label>
          <Select value={variant} onChange={(e) => setVariant(e.target.value as HeroVariant)} className="h-10">
            {HERO_VARIANTS.map((v) => (
              <option key={v} value={v}>
                {t.sectionConfigEditor.heroVariants[v]}
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
            const { website: updated } = await updateWebsite(accessToken, { banner_image_url: null });
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
            const { website: updated } = await updateWebsite(accessToken, { banner_video_url: null });
            onWebsiteUpdate(updated);
          }}
        />
      )}

      <Button type="button" variant="secondary" onClick={() => void handleSave()} disabled={loading} className="w-fit">
        {loading ? t.sectionConfigEditor.saving : t.sectionConfigEditor.save}
      </Button>
    </div>
  );
}
