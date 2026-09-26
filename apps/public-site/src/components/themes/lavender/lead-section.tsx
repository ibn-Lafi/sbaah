import type { LeadSectionProps } from '../types';
import { InquiryForm } from '@/components/properties/inquiry-form';

export function LeadSection({
  locale,
  tenantId,
  projectId,
  assetId,
  listingId,
  config,
}: LeadSectionProps) {
  const title = config.title_ar || (locale === 'ar' ? 'سجل اهتمامك' : 'Register your interest');
  const body =
    config.body_ar ||
    (locale === 'ar'
      ? 'اترك بياناتك وسيتواصل معك الفريق بخصوص اهتمامك العقاري.'
      : 'Leave your details and our team will contact you about your real-estate interest.');
  return (
    <section
      id="inquiry"
      className="scroll-mt-28 border-t border-black/15 bg-[#f4f1ea] px-5 py-16 sm:px-6 sm:py-24"
      aria-labelledby="lavender-lead-title"
    >
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.75fr_1.25fr] lg:gap-16">
        <div className="border-t border-black/30 pt-6">
          <p className="text-tenant-primary mb-4 text-xs font-semibold tracking-[.14em]">
            {locale === 'ar' ? 'فريقنا مستعد لخدمتكم' : 'TALK TO OUR TEAM'}
          </p>
          <h2 id="lavender-lead-title" className="text-3xl font-semibold leading-tight sm:text-5xl">
            {title}
          </h2>
          <p className="mt-5 max-w-md leading-8 text-black/70">{body}</p>
        </div>
        <div className="border border-black/10 bg-white shadow-[0_18px_55px_rgba(23,23,19,.07)]">
          <InquiryForm
            locale={locale}
            tenantId={tenantId}
            projectId={projectId}
            assetId={assetId}
            listingId={listingId}
            variant="lavender"
          />
        </div>
      </div>
    </section>
  );
}
