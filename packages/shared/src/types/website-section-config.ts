/**
 * `website_sections.config` (jsonb) has no fixed shape at the DB/API
 * layer (task 28/42 deliberately left it a free-form record, pending
 * "a separate decision about fields per section type" — this is that
 * decision, made for task 35/42 since public-site now actually needs to
 * render real content per section). Every field is optional and every
 * reader must fall back gracefully: nothing has ever written to these
 * columns before this task, so `config` is `{}` for every section on
 * every existing account.
 */
/**
 * أربعة أشكال لقسم الهيرو (طلب المؤسس، ترتيب أقسام الصفحة الرئيسية —
 * ثيم الأساسي): صورة فقط، صورة مع فلتر بحث العقارات، فيديو فقط، فيديو
 * مع فلتر بحث العقارات. الصورة/الفيديو نفسهما يبقيان على مستوى الموقع
 * (`website.banner_image_url`/`banner_video_url`، مشتركان بين كل صفحات
 * الموقع كما كانا) — هذا الحقل يتحكم فقط بأي المُدخلين (صورة أو فيديو)
 * يُعرض ومعه فلتر البحث أو بدونه، ولأن هذا الحقل جزء من `config` الخاص
 * بكل قسم Hero على حدة، يمكن أن يختلف من صفحة لأخرى (الرئيسية/العقارات/
 * تفاصيل العقار/المشاريع) رغم مشاركتها نفس ملف الصورة/الفيديو حاليًا —
 * لو احتاج المؤسس مستقبلًا صورة/فيديو مختلفًا لكل صفحة، ذلك يحتاج نقل
 * الحقلين لداخل `config` بدل مستوى الموقع، قرار معماري منفصل لم يُطلب هنا.
 * الحساب الحالي بلا `variant` (كل حساب قائم اليوم) يُفسَّر 'image_search'
 * — نفس السلوك الحي الحالي بالضبط (صورة إن وُجدت + فلتر بحث دائمًا).
 */
export const HERO_VARIANTS = ['image', 'image_search', 'video', 'video_search'] as const;
export type HeroVariant = (typeof HERO_VARIANTS)[number];

/**
 * `_ar` فقط، بلا `_en` مقابل — الثيم الأساسي بلغة عربية واحدة فقط، لا
 * محتوى مؤلَّف ثنائي اللغة (طلب المؤسس). المفتاح أبقي بلاحقة `_ar` رغم
 * عدم وجود `_en` مقابل لتفادي أي migration لبيانات مخزَّنة فعليًا بهذا
 * الاسم — لا فرق ظاهر للمستخدم، تسمية داخلية فقط.
 */

export interface HeroSectionConfig {
  title_ar?: string;
  subtitle_ar?: string;
  variant?: HeroVariant;
}

export interface PropertyGridSectionConfig {
  title_ar?: string;
}

/** Same shape as PropertyGridSectionConfig, for the /projects page's listing anchor. */
export interface ProjectGridSectionConfig {
  title_ar?: string;
}

/** No editable fields — the property detail page's content (gallery/price/specs/contact) is entirely data-driven, not authorable. This type only exists so a tenant can toggle/reposition it among that page's other sections (a hero banner above it, for example). */
export type PropertyDetailSectionConfig = Record<string, never>;

/** Also used for `why_us` — same shape (title + one body of text), not a separate multi-item feature-list editor (kept deliberately simple). */
export interface AboutSectionConfig {
  title_ar?: string;
  body_ar?: string;
}

export interface ContactSectionConfig {
  title_ar?: string;
}

/** No editable fields — the footer's only content is the tenant name (auto) and the mandatory سبعة badge (fixed, never from config). */
export type FooterSectionConfig = Record<string, never>;

/** No editable fields — the form's 4 fields (name, city, Fal license, broker/marketer) are fixed, not authorable (migration 0032). Toggle/reposition only, same as property_detail/footer. */
export type BrokerMarketerFormSectionConfig = Record<string, never>;

/** No editable fields — pins are entirely data-driven (every published property/project/building with a location set), same as property_detail/footer. Toggle/reposition only (migration 0044). */
export type MapSectionConfig = Record<string, never>;


export interface FeaturedPropertiesSectionConfig { title_ar?: string; property_ids?: string[]; }
export interface LatestPropertiesSectionConfig { title_ar?: string; limit?: number; }
export interface ProjectsShowcaseSectionConfig { title_ar?: string; limit?: number; }
export interface PropertiesByCitySectionConfig { title_ar?: string; city_ids?: string[]; }
export interface StatsSectionConfig { title_ar?: string; items?: Array<{ value: string; label: string }>; }
export interface ServicesSectionConfig { title_ar?: string; items?: Array<{ title: string; description?: string }>; }
export interface FaqSectionConfig { title_ar?: string; items?: Array<{ question: string; answer: string }>; }
export interface CtaSectionConfig { title_ar?: string; body_ar?: string; button_label?: string; button_url?: string; }
export interface PropertyRequestSectionConfig { title_ar?: string; body_ar?: string; }
export interface PromoBannerSectionConfig { title_ar?: string; body_ar?: string; button_label?: string; button_url?: string; image_url?: string; }
export interface FreeContentSectionConfig { title_ar?: string; body_ar?: string; button_label?: string; button_url?: string; image_url?: string; }
export interface GallerySectionConfig { title_ar?: string; image_urls?: string[]; }
export interface VideoSectionConfig { title_ar?: string; video_url?: string; }

export type WebsiteSectionConfigByType = {
  hero: HeroSectionConfig;
  property_grid: PropertyGridSectionConfig;
  featured_properties: FeaturedPropertiesSectionConfig;
  latest_properties: LatestPropertiesSectionConfig;
  project_grid: ProjectGridSectionConfig;
  projects_showcase: ProjectsShowcaseSectionConfig;
  properties_by_city: PropertiesByCitySectionConfig;
  stats: StatsSectionConfig;
  services: ServicesSectionConfig;
  faq: FaqSectionConfig;
  cta: CtaSectionConfig;
  property_request: PropertyRequestSectionConfig;
  promo_banner: PromoBannerSectionConfig;
  free_content: FreeContentSectionConfig;
  gallery: GallerySectionConfig;
  video: VideoSectionConfig;
  property_detail: PropertyDetailSectionConfig;
  about: AboutSectionConfig;
  why_us: AboutSectionConfig;
  contact: ContactSectionConfig;
  broker_marketer_form: BrokerMarketerFormSectionConfig;
  map: MapSectionConfig;
  footer: FooterSectionConfig;
};
