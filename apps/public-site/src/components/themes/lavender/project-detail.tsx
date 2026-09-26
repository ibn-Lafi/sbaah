import type { Locale } from '@/lib/i18n/locales';
import type { PublicProjectDetailResponse } from '@/lib/api/public-projects';
import { pickLocalized } from '@/lib/i18n/localized-field';
import { LavenderProjectMediaGallery } from './project-media-gallery';
import { InquiryForm } from '@/components/properties/inquiry-form';
import { LavenderStatsCounter } from './stats-counter';

export function LavenderProjectDetail({
  locale,
  data,
  tenantId,
}: {
  locale: Locale;
  data: PublicProjectDetailResponse;
  tenantId: string;
}) {
  const project = data.project;
  const title = pickLocalized(locale, project.name_ar, project.name_en);
  const description = pickLocalized(locale, project.description_ar ?? '', project.description_en ?? null);
  const images = data.media.filter((media) => media.media_type === 'image');
  const primary = images.find((media) => media.is_primary) ?? images[0];
  const by = (category: string) => images.filter((media) => media.category === category);
  const gallery = images.filter((media) => ['general', 'exterior', 'interior'].includes(media.category));
  const groups = [
    {
      key: 'gallery' as const,
      label: locale === 'ar' ? 'معرض الصور' : 'Photo gallery',
      items: gallery.map((media, index) => ({
        id: media.id,
        url: media.url,
        alt: pickLocalized(locale, media.alt_ar ?? `${title} ${index + 1}`, media.alt_en),
      })),
    },
    {
      key: 'master_plan' as const,
      label: locale === 'ar' ? 'مخطط المشروع' : 'Master plan',
      items: by('master_plan').map((media, index) => ({
        id: media.id,
        url: media.url,
        alt: pickLocalized(locale, media.alt_ar ?? `${title} ${index + 1}`, media.alt_en),
      })),
    },
    {
      key: 'construction' as const,
      label: locale === 'ar' ? 'أعمال الإنشاء' : 'Construction',
      items: by('construction').map((media, index) => ({
        id: media.id,
        url: media.url,
        alt: pickLocalized(locale, media.alt_ar ?? `${title} ${index + 1}`, media.alt_en),
      })),
    },
  ];
  const hasLocation = typeof project.lat === 'number' && typeof project.lng === 'number';

  return (
    <main className="bg-[#f4f1ea] text-[#171713]">
      <section className="relative -mt-20 h-[calc(100svh+5rem)] min-h-[calc(100svh+5rem)] w-full overflow-hidden bg-[#171713] text-white">
        {primary && <img src={primary.url} alt={title} loading="eager" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/20" />
        <div className="relative flex h-full w-full items-end px-5 pb-10 pt-24 sm:px-8 sm:pb-14 lg:px-12 lg:pb-16">
          <div className="w-full max-w-4xl pt-5">
            <p className="mb-3 text-xs font-semibold tracking-[.14em] text-white/75">{locale === 'ar' ? 'مشروع عقاري' : 'REAL ESTATE PROJECT'}</p>
            <h1 className="text-4xl font-semibold leading-tight sm:text-6xl lg:text-7xl">{title}</h1>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-7 lg:grid-cols-[.55fr_1.45fr] lg:gap-14">
          <div>
            <p className="text-tenant-primary mb-3 text-xs font-semibold">{locale === 'ar' ? 'نظرة عامة' : 'OVERVIEW'}</p>
            <h2 className="text-3xl font-semibold sm:text-5xl">{locale === 'ar' ? 'وصف المشروع' : 'Project overview'}</h2>
          </div>
          <p className="whitespace-pre-line text-base leading-8 text-black/70 sm:text-lg sm:leading-9">
            {description || (locale === 'ar' ? 'لا يوجد وصف للمشروع حتى الآن.' : 'No project description yet.')}
          </p>
        </div>
      </section>

      <LavenderProjectMediaGallery locale={locale} groups={groups} />

      <section className="bg-[#f4f1ea] px-5 py-10 text-[#171713] sm:px-6 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-5 text-center text-xl font-semibold sm:mb-8 sm:text-3xl lg:text-4xl">{locale === 'ar' ? 'أرقام المشروع' : 'Project facts'}</h2>
          <dl className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
            {[
              { value: `${project.completion_percentage ?? 0}%`, label: locale === 'ar' ? 'نسبة الإنجاز' : 'Progress' },
              { value: String(project.planned_units_count ?? data.total ?? 0), label: locale === 'ar' ? 'عدد الوحدات' : 'Units' },
              { value: String(data.unit_types.length), label: locale === 'ar' ? 'نماذج المشروع' : 'Models' },
            ].map((item) => (
              <div key={item.label} className="flex min-h-[88px] min-w-0 flex-col items-center justify-center rounded-[18px] border border-white/50 bg-white/30 px-1.5 py-3 text-center shadow-[0_8px_28px_rgba(23,23,19,.05)] backdrop-blur-xl sm:min-h-[135px] sm:rounded-[24px] sm:px-4 sm:py-5 lg:min-h-[155px]">
                <dd className="max-w-full truncate text-xl font-semibold tracking-tight text-tenant-primary sm:text-4xl lg:text-5xl"><LavenderStatsCounter value={item.value} /></dd>
                <dt className="mt-1.5 line-clamp-2 text-[9px] leading-3 text-black/60 sm:mt-3 sm:text-sm sm:leading-5 lg:text-base">{item.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {hasLocation && (
        <section className="px-5 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6"><p className="text-tenant-primary mb-3 text-xs font-semibold">{locale === 'ar' ? 'الموقع' : 'LOCATION'}</p><h2 className="text-3xl font-semibold sm:text-5xl">{locale === 'ar' ? 'موقع المشروع' : 'Project location'}</h2></div>
            <iframe
              title={locale === 'ar' ? 'موقع المشروع على الخريطة' : 'Project location map'}
              src={`https://www.google.com/maps?q=${project.lat},${project.lng}&z=15&output=embed`}
              className="h-[320px] w-full rounded-2xl border-0 sm:h-[440px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>
      )}

      <section id="inquiry" className="px-5 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-xl">
          <InquiryForm
            locale={locale}
            tenantId={tenantId}
            projectId={project.id}
            variant="lavender"
            eyebrow={locale === 'ar' ? 'مهتم بالمشروع؟' : 'INTERESTED IN THIS PROJECT?'}
            description={locale === 'ar' ? 'اترك بياناتك وسيتواصل معك الفريق بخصوص المشروع.' : 'Leave your details and the team will contact you about this project.'}
          />
        </div>
      </section>
    </main>
  );
}
