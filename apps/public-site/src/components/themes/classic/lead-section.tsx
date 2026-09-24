import type { LeadSectionProps } from '../types';
import { InquiryForm } from '@/components/properties/inquiry-form';

export function LeadSection({ locale, tenantId, projectId, assetId, listingId, config }: LeadSectionProps) {
  const title = config.title_ar || (locale === 'ar' ? 'سجل اهتمامك' : 'Register your interest');
  const body = config.body_ar || (locale === 'ar' ? 'اترك بياناتك وسيتواصل معك الفريق قريبًا.' : 'Leave your details and the team will contact you soon.');
  return <section className="mx-auto max-w-6xl px-6 py-12"><div className="grid gap-8 lg:grid-cols-2 lg:items-start"><div><h2 className="text-3xl font-bold">{title}</h2><p className="mt-3 leading-7 text-black/60">{body}</p></div><InquiryForm locale={locale} tenantId={tenantId} projectId={projectId} assetId={assetId} listingId={listingId}/></div></section>;
}
