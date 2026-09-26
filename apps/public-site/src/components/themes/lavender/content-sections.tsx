import type { Locale } from '@/lib/i18n/locales';
import type {
  StatsSectionConfig,
  ServicesSectionConfig,
  FaqSectionConfig,
  CtaSectionConfig,
  PromoBannerSectionConfig,
  FreeContentSectionConfig,
  GallerySectionConfig,
  VideoSectionConfig,
} from '@sbaah/shared';
import { LavenderHeading, LavenderSection } from './primitives';
const copy = {
  ar: {
    stats: 'أرقامنا',
    services: 'خدماتنا',
    faq: 'الأسئلة الشائعة',
    gallery: 'معرض الصور',
    video: 'فيديو',
  },
  en: {
    stats: 'Our numbers',
    services: 'Services',
    faq: 'Frequently asked questions',
    gallery: 'Gallery',
    video: 'Video',
  },
} as const;
function href(v?: string) {
  if (!v) return null;
  const x = v.trim();
  return /^(\/|https?:\/\/|tel:|mailto:)/.test(x) ? x : null;
}
function Action({ label, url, light = false }: { label?: string; url?: string; light?: boolean }) {
  const h = href(url);
  return label && h ? (
    <a
      href={h}
      className={`focus-visible:ring-tenant-primary inline-flex min-h-11 items-center gap-2 border-b pb-1 text-sm font-semibold outline-none focus-visible:ring-2 ${light ? 'border-white/70 text-white' : 'border-black/50 text-black'}`}
    >
      {label}
      <span aria-hidden="true">↗</span>
    </a>
  ) : null;
}
const cols = (value?: 2 | 3 | 4) =>
  value === 2 ? 'lg:grid-cols-2' : value === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4';
const soft = (value?: 'default' | 'soft') => (value === 'soft' ? 'bg-[#f4f1ea]' : 'bg-white');

export function LavenderStats({ locale, config }: { locale: Locale; config: StatsSectionConfig }) {
  const configured = (config.items ?? []).filter((i) => i.value || i.label).slice(0, 3);
  const items = Array.from({ length: 3 }, (_, index) => configured[index] ?? { value: '—', label: '' });
  return (
    <LavenderSection className="bg-[#f4f1ea] text-[#171713]">
      <div className="mx-auto max-w-7xl">
        <div className={"mb-7 sm:mb-12 " + (config.heading_align === 'center' ? 'text-center' : '')}>
          <p className="text-tenant-primary mb-2 text-[10px] font-semibold sm:text-xs">{locale === 'ar' ? 'أثرنا بالأرقام' : 'OUR IMPACT'}</p>
          <h2 className="text-2xl font-semibold sm:text-4xl lg:text-5xl">{config.title_ar || copy[locale].stats}</h2>
        </div>
        <div className="rounded-[1.25rem] bg-tenant-primary px-3 py-8 text-white sm:rounded-[1.75rem] sm:px-8 sm:py-12 lg:px-14 lg:py-16">
          <h3 className="mb-7 text-center text-xl font-semibold sm:mb-12 sm:text-3xl lg:text-5xl">{locale === 'ar' ? 'نصنع أثرًا بالأرقام' : 'Excellence Through Innovation'}</h3>
          <dl className="grid grid-cols-3 items-stretch gap-2 sm:gap-5 lg:gap-8">
            {items.map((i, n) => (
              <div
                key={n}
                className={"relative flex min-h-[105px] min-w-0 flex-col items-center justify-center bg-white/[.13] px-2 py-4 text-center sm:min-h-[175px] sm:px-5 sm:py-7 lg:min-h-[220px] " +
                  (n === 0 ? 'rounded-[1.15rem] sm:rounded-[1.7rem]' : n === 1 ? 'rounded-[1.15rem_1.15rem_2rem_1.15rem] sm:rounded-[1.7rem_1.7rem_3rem_1.7rem]' : 'rounded-[1.15rem_2rem_1.15rem_1.15rem] sm:rounded-[1.7rem_3rem_1.7rem_1.7rem]')}
              >
                {n > 0 && <span aria-hidden="true" className="absolute -start-2 -top-2 size-5 rounded-full bg-white/[.12] sm:-start-3 sm:-top-3 sm:size-8" />}
                <dd className="max-w-full truncate text-2xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">{i.value}</dd>
                <dt className="mt-2 line-clamp-2 text-[9px] leading-3 text-white/85 sm:mt-4 sm:text-sm sm:leading-5 lg:text-base">{i.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </LavenderSection>
  );
}
export function LavenderServices({
  locale,
  config,
}: {
  locale: Locale;
  config: ServicesSectionConfig;
}) {
  const items = (config.items ?? []).filter((i) => i.title);
  return (
    <LavenderSection className={soft(config.tone)}>
      <LavenderHeading
        eyebrow={locale === 'ar' ? 'خبرات متكاملة' : 'Integrated expertise'}
        title={config.title_ar || copy[locale].services}
      />
      <div className={`grid border-t border-black/20 ${cols(config.columns)}`}>
        {items.map((i, n) => (
          <article
            key={n}
            className="border-b border-black/20 px-1 py-7 sm:p-7 sm:first:ps-0 lg:border-e"
          >
            <span className="text-tenant-primary text-xs font-semibold">
              {String(n + 1).padStart(2, '0')}
            </span>
            <h3 className="mt-6 text-xl font-semibold sm:text-2xl">{i.title}</h3>
            {i.description && (
              <p className="mt-4 max-w-2xl text-sm leading-7 text-black/70">{i.description}</p>
            )}
          </article>
        ))}
      </div>
    </LavenderSection>
  );
}
export function LavenderFaq({ locale, config }: { locale: Locale; config: FaqSectionConfig }) {
  const items = (config.items ?? []).filter((i) => i.question && i.answer);
  return (
    <LavenderSection className={soft(config.tone)}>
      <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
        <div>
          <p className="text-tenant-primary mb-3 text-xs font-semibold">
            {locale === 'ar' ? 'معلومات مهمة' : 'KEY INFORMATION'}
          </p>
          <h2 className="text-3xl font-semibold sm:text-5xl">
            {config.title_ar || copy[locale].faq}
          </h2>
        </div>
        <div className="border-t border-black/25">
          {items.map((i, n) => (
            <details key={n} className="group border-b border-black/25">
              <summary className="focus-visible:ring-tenant-primary flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg font-semibold outline-none focus-visible:ring-2">
                <span>{i.question}</span>
                <span
                  aria-hidden="true"
                  className="text-2xl font-light transition-transform group-open:rotate-45 motion-reduce:transition-none"
                >
                  +
                </span>
              </summary>
              <p className="max-w-2xl pb-7 text-sm leading-7 text-black/70">{i.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </LavenderSection>
  );
}
export function LavenderCta({ config }: { locale: Locale; config: CtaSectionConfig }) {
  if (!config.title_ar && !config.body_ar) return null;
  return (
    <section className="bg-tenant-primary px-5 py-16 text-white sm:px-6 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-8 border-t border-white/40 pt-7 lg:grid-cols-[1.3fr_.7fr]">
        <h2 className="text-4xl font-medium leading-tight sm:text-6xl">{config.title_ar}</h2>
        <div className="lg:pt-2">
          {config.body_ar && (
            <p className="mb-7 max-w-xl leading-8 text-white/70">{config.body_ar}</p>
          )}
          <Action label={config.button_label} url={config.button_url} light />
        </div>
      </div>
    </section>
  );
}
export function LavenderPromo({ config }: { locale: Locale; config: PromoBannerSectionConfig }) {
  if (!config.title_ar && !config.image_url) return null;
  return (
    <section className="relative min-h-[65vh] overflow-hidden bg-[#171713] text-white">
      {config.image_url && (
        <img
          src={config.image_url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-black/45" />
      <div className="relative mx-auto flex min-h-[65vh] max-w-7xl flex-col justify-end px-5 py-12 sm:px-6 sm:py-16">
        <div className="max-w-3xl border-t border-white/45 pt-6">
          <h2 className="text-4xl font-medium sm:text-6xl">{config.title_ar}</h2>
          {config.body_ar && (
            <p className="mt-4 max-w-xl leading-8 text-white/70">{config.body_ar}</p>
          )}
          <div className="mt-6">
            <Action label={config.button_label} url={config.button_url} light />
          </div>
        </div>
      </div>
    </section>
  );
}
export function LavenderFreeContent({
  locale,
  config,
}: {
  locale: Locale;
  config: FreeContentSectionConfig;
}) {
  if (!config.title_ar && !config.body_ar && !config.image_url) return null;
  return (
    <LavenderSection>
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
        {config.image_url && (
          <img
            src={config.image_url}
            alt={config.title_ar || (locale === 'ar' ? 'صورة تعريفية' : 'Corporate profile')}
            loading="lazy"
            className="aspect-[4/3] h-full w-full object-cover"
          />
        )}
        <div className="flex flex-col justify-center border-t border-black/25 pt-7">
          <h2 className="text-3xl font-semibold leading-tight sm:text-5xl">{config.title_ar}</h2>
          {config.body_ar && (
            <p className="mt-6 whitespace-pre-line leading-8 text-black/70">{config.body_ar}</p>
          )}
          <div className="mt-8">
            <Action label={config.button_label} url={config.button_url} />
          </div>
        </div>
      </div>
    </LavenderSection>
  );
}
export function LavenderGallery({
  locale,
  config,
}: {
  locale: Locale;
  config: GallerySectionConfig;
}) {
  const imgs = (config.image_urls ?? []).filter(Boolean);
  const title = config.title_ar || copy[locale].gallery;
  return (
    <LavenderSection className="bg-[#171713] text-white">
      <div className="mb-10 border-b border-white/25 pb-5">
        <p className="mb-3 text-xs font-semibold text-white/70">
          {locale === 'ar' ? 'أعمالنا' : 'OUR WORK'}
        </p>
        <h2 className="text-3xl font-semibold sm:text-5xl">{title}</h2>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {imgs.map((u, n) => (
          <div key={u + n} className={n === 0 ? 'col-span-2 row-span-2' : ''}>
            <img
              src={u}
              alt={`${title} ${n + 1}`}
              loading="lazy"
              className="aspect-[4/3] h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
    </LavenderSection>
  );
}
export function LavenderVideo({ locale, config }: { locale: Locale; config: VideoSectionConfig }) {
  if (!config.video_url) return null;
  return (
    <LavenderSection>
      <LavenderHeading
        eyebrow={locale === 'ar' ? 'شاهد' : 'Watch'}
        title={config.title_ar || copy[locale].video}
      />
      <video
        controls
        playsInline
        preload="metadata"
        className="aspect-video w-full bg-black"
        src={config.video_url}
      />
    </LavenderSection>
  );
}
