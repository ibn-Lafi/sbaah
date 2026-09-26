import type { Locale } from '@/lib/i18n/locales';
import type { PublicProjectDetailResponse } from '@/lib/api/public-projects';
import { pickLocalized } from '@/lib/i18n/localized-field';
import { LavenderProjectMediaGallery } from './project-media-gallery';
import { InquiryForm } from '@/components/properties/inquiry-form';

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
      <section className="relative -mt-20 h-[100svh] min-h-[100svh] w-full overflow-hidden bg-[#171713] text-white">
        {primary && <img src={primary.url} alt={title} loading="eager" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/20" />
        <div className="relative flex h-full w-full items-end px-5 pb-10 pt-24 sm:px-8 sm:pb-14 lg:px-12 lg:pb-16">
          <div className="w-full max-w-4xl border-t border-white/40 pt-5">
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

      <section className="bg-white px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-7 text-3xl font-semibold sm:text-5xl">{locale === 'ar' ? 'أرقام المشروع' : 'Project facts'}</h2>
          <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-black/10">
            <div className="p-4 text-center sm:p-7"><p className="text-xs text-black/55">{locale === 'ar' ? 'نسبة الإنجاز' : 'Progress'}</p><strong className="mt-2 block text-2xl sm:text-4xl">{project.completion_percentage ?? 0}%</strong></div>
            <div className="border-x border-black/10 p-4 text-center sm:p-7"><p className="text-xs text-black/55">{locale === 'ar' ? 'عدد الوحدات' : 'Units'}</p><strong className="mt-2 block text-2xl sm:text-4xl">{project.planned_units_count ?? data.total ?? 0}</strong></div>
            <div className="p-4 text-center sm:p-7"><p className="text-xs text-black/55">{locale === 'ar' ? 'نماذج المشروع' : 'Models'}</p><strong className="mt-2 block text-2xl sm:text-4xl">{data.unit_types.length}</strong></div>
          </div>
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

      <section id="inquiry" className="border-t border-black/10 bg-white px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[.7fr_1.3fr] lg:gap-14">
          <div>
            <p className="text-tenant-primary mb-3 text-xs font-semibold">{locale === 'ar' ? 'مهتم بالمشروع؟' : 'INTERESTED?'}</p>
            <h2 className="text-3xl font-semibold sm:text-5xl">{locale === 'ar' ? 'سجل اهتمامك' : 'Register your interest'}</h2>
            <p className="mt-4 leading-7 text-black/60">{locale === 'ar' ? 'اترك بياناتك وسيتواصل معك الفريق بخصوص المشروع.' : 'Leave your details and the team will contact you about this project.'}</p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-[#f4f1ea] p-1 shadow-sm">
            <InquiryForm locale={locale} tenantId={tenantId} projectId={project.id} variant="lavender" />
          </div>
        </div>
      </section>
    </main>
  );
}
