import type { Locale } from '@/lib/i18n/locales';
import type {
  StatsSectionConfig, ServicesSectionConfig, FaqSectionConfig, CtaSectionConfig,
  PromoBannerSectionConfig, FreeContentSectionConfig, GallerySectionConfig, VideoSectionConfig,
  PropertyRequestSectionConfig,
} from '@sbaah/shared';
import { ClassicEmptyState, ClassicSection, ClassicSectionHeading } from './primitives';

const copy = {
  ar: { request: 'أرسل طلبك', name: 'الاسم', phone: 'رقم الجوال', details: 'تفاصيل العقار المطلوب', stats: 'أرقامنا', services: 'خدماتنا', faq: 'الأسئلة الشائعة', gallery: 'معرض الصور', video: 'فيديو', empty: 'أضف محتوى لهذا القسم من تخصيص الموقع.' },
  en: { request: 'Send request', name: 'Name', phone: 'Phone', details: 'Property requirements', stats: 'Our numbers', services: 'Our services', faq: 'Frequently asked questions', gallery: 'Gallery', video: 'Video', empty: 'Add content to this section from the website customizer.' },
} as const;

function safeHref(value?: string) {
  if (!value) return null;
  const href = value.trim();
  if (href.startsWith('/') || href.startsWith('https://') || href.startsWith('http://') || href.startsWith('tel:') || href.startsWith('mailto:')) return href;
  return null;
}

function Action({ label, url, inverted = false }: { label?: string; url?: string; inverted?: boolean }) {
  const href = safeHref(url);
  if (!label || !href) return null;
  return <a href={href} className={`inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${inverted ? 'bg-white text-tenant-primary' : 'bg-tenant-primary text-white'}`}>{label}</a>;
}

export function StatsSection({ locale, config }: { locale: Locale; config: StatsSectionConfig }) {
  const items = (config.items ?? []).filter((item) => item.value || item.label);
  return <ClassicSection className="bg-black/[0.025]"><ClassicSectionHeading title={config.title_ar || copy[locale].stats} centered />{items.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{items.map((item, index) => <div key={index} className="rounded-2xl border border-black/10 bg-white p-5 text-center shadow-sm sm:p-6"><strong className="block text-2xl font-bold text-tenant-primary sm:text-3xl">{item.value}</strong><span className="mt-2 block text-sm leading-6 text-black/55">{item.label}</span></div>)}</div> : <ClassicEmptyState>{copy[locale].empty}</ClassicEmptyState>}</ClassicSection>;
}

export function ServicesSection({ locale, config }: { locale: Locale; config: ServicesSectionConfig }) {
  const items = (config.items ?? []).filter((item) => item.title);
  return <ClassicSection><ClassicSectionHeading title={config.title_ar || copy[locale].services} />{items.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item, index) => <article key={index} className="group rounded-2xl border border-black/10 bg-white p-6 transition hover:-translate-y-0.5 hover:border-tenant-secondary/50 hover:shadow-md"><span className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-tenant-primary/10 font-bold text-tenant-primary">{String(index + 1).padStart(2, '0')}</span><h3 className="text-lg font-bold">{item.title}</h3>{item.description && <p className="mt-2 text-sm leading-7 text-black/60">{item.description}</p>}</article>)}</div> : <ClassicEmptyState>{copy[locale].empty}</ClassicEmptyState>}</ClassicSection>;
}

export function FaqSection({ locale, config }: { locale: Locale; config: FaqSectionConfig }) {
  const items = (config.items ?? []).filter((item) => item.question && item.answer);
  return <ClassicSection className="bg-black/[0.025]"><div className="mx-auto max-w-4xl"><ClassicSectionHeading title={config.title_ar || copy[locale].faq} centered />{items.length ? <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">{items.map((item, index) => <details key={index} className="group border-b border-black/10 last:border-b-0"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 font-semibold sm:px-6"><span>{item.question}</span><span className="text-xl font-normal text-tenant-primary transition-transform group-open:rotate-45" aria-hidden="true">+</span></summary><p className="px-5 pb-5 text-sm leading-7 text-black/60 sm:px-6">{item.answer}</p></details>)}</div> : <ClassicEmptyState>{copy[locale].empty}</ClassicEmptyState>}</div></ClassicSection>;
}

export function CtaSection({ config }: { locale: Locale; config: CtaSectionConfig }) {
  if (!config.title_ar && !config.body_ar && !config.button_label) return null;
  return <ClassicSection><div className="relative overflow-hidden rounded-3xl bg-tenant-primary px-6 py-9 text-white shadow-sm sm:px-10 sm:py-11"><div className="absolute -end-16 -top-20 h-52 w-52 rounded-full bg-tenant-secondary/25" aria-hidden="true" /><div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div className="max-w-2xl">{config.title_ar && <h2 className="text-2xl font-bold sm:text-3xl">{config.title_ar}</h2>}{config.body_ar && <p className="mt-3 leading-7 text-white/80">{config.body_ar}</p>}</div><Action label={config.button_label} url={config.button_url} inverted /></div></div></ClassicSection>;
}

export function PromoBannerSection({ config }: { locale: Locale; config: PromoBannerSectionConfig }) {
  if (!config.title_ar && !config.body_ar && !config.image_url) return null;
  return <ClassicSection><div className="relative min-h-72 overflow-hidden rounded-3xl bg-black p-7 text-white sm:p-10">{config.image_url && <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={config.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/55 to-black/25" /></>}<div className="relative flex min-h-56 max-w-2xl flex-col justify-center">{config.title_ar && <h2 className="text-2xl font-bold sm:text-3xl">{config.title_ar}</h2>}{config.body_ar && <p className="mt-3 leading-7 text-white/80">{config.body_ar}</p>}<div className="mt-6"><Action label={config.button_label} url={config.button_url} inverted /></div></div></div></ClassicSection>;
}

export function FreeContentSection({ config }: { locale: Locale; config: FreeContentSectionConfig }) {
  if (!config.title_ar && !config.body_ar && !config.image_url) return null;
  return <ClassicSection className="bg-white"><div className={`grid items-center gap-8 ${config.image_url ? 'md:grid-cols-2' : ''}`}>{config.image_url && <div className="overflow-hidden rounded-3xl bg-black/5">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={config.image_url} alt="" className="aspect-[4/3] w-full object-cover transition duration-500 hover:scale-[1.02]" /></div>}<div className="max-w-2xl">{config.title_ar && <ClassicSectionHeading title={config.title_ar} />}{config.body_ar && <p className="whitespace-pre-line leading-8 text-black/65">{config.body_ar}</p>}<div className="mt-6"><Action label={config.button_label} url={config.button_url} /></div></div></div></ClassicSection>;
}

export function GallerySection({ locale, config }: { locale: Locale; config: GallerySectionConfig }) {
  const images = (config.image_urls ?? []).filter(Boolean);
  return <ClassicSection><ClassicSectionHeading title={config.title_ar || copy[locale].gallery} />{images.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{images.map((url, index) => <div key={url + index} className={`overflow-hidden rounded-2xl bg-black/5 ${index === 0 && images.length > 2 ? 'col-span-2 row-span-2' : ''}`}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={url} alt="" loading="lazy" className="aspect-[4/3] h-full w-full object-cover transition duration-500 hover:scale-[1.03]" /></div>)}</div> : <ClassicEmptyState>{copy[locale].empty}</ClassicEmptyState>}</ClassicSection>;
}

export function VideoSection({ locale, config }: { locale: Locale; config: VideoSectionConfig }) {
  return <ClassicSection className="bg-black/[0.025]"><ClassicSectionHeading title={config.title_ar || copy[locale].video} />{config.video_url ? <div className="overflow-hidden rounded-3xl bg-black shadow-sm"><video controls playsInline preload="metadata" className="aspect-video w-full" src={config.video_url} /></div> : <ClassicEmptyState>{copy[locale].empty}</ClassicEmptyState>}</ClassicSection>;
}

/** Kept internal until the property-request backend is wired; the editor does not expose this section. */
export function PropertyRequestSection({ locale, config }: { locale: Locale; config: PropertyRequestSectionConfig }) {
  const t = copy[locale];
  return <ClassicSection><div className="mx-auto max-w-4xl"><ClassicSectionHeading title={config.title_ar || t.request} />{config.body_ar && <p className="mb-5 text-black/60">{config.body_ar}</p>}<div className="grid gap-3 sm:grid-cols-2"><input disabled placeholder={t.name} className="h-12 rounded-xl border border-black/10 px-4" /><input disabled placeholder={t.phone} className="h-12 rounded-xl border border-black/10 px-4" /><textarea disabled placeholder={t.details} className="min-h-28 rounded-xl border border-black/10 p-4 sm:col-span-2" /><button disabled className="h-12 rounded-xl bg-tenant-primary px-5 font-semibold text-white opacity-70 sm:w-fit">{t.request}</button></div></div></ClassicSection>;
}
