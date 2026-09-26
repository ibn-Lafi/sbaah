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
      className="scroll-mt-28 bg-[var(--tenant-background)] px-5 py-10 sm:px-6 sm:py-14"
      aria-labelledby="lavender-lead-title"
    >
      <div className="mx-auto max-w-xl">
        <InquiryForm
          locale={locale}
          tenantId={tenantId}
          projectId={projectId}
          assetId={assetId}
          listingId={listingId}
          variant="lavender"
          eyebrow={locale === 'ar' ? 'فريقنا مستعد لخدمتكم' : 'TALK TO OUR TEAM'}
          description={body}
        />
      </div>
    </section>
  );
}
