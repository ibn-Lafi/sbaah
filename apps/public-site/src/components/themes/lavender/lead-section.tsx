import type { LeadSectionProps } from '../types';
import { InquiryForm } from '@/components/properties/inquiry-form';

export function LeadSection({ locale, tenantId, projectId, assetId, listingId, config }: LeadSectionProps) {
  const title = config.title_ar || (locale === 'ar' ? 'سجل اهتمامك' : 'Register your interest');
  const body = config.body_ar || (locale === 'ar' ? 'اترك بياناتك وسيتواصل معك الفريق بخصوص اهتمامك العقاري.' : 'Leave your details and the team will contact you about your real-estate interest.');
  return <section className="border-t border-black/10 px-5 py-16 sm:px-6 sm:py-24"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.7fr_1.3fr]"><div><p className="mb-3 text-xs uppercase tracking-[.18em] text-tenant-primary">{locale==='ar'?'تواصل معنا':'Get in touch'}</p><h2 className="text-3xl font-medium leading-tight sm:text-5xl">{title}</h2><p className="mt-5 max-w-md leading-8 text-black/55">{body}</p></div><InquiryForm locale={locale} tenantId={tenantId} projectId={projectId} assetId={assetId} listingId={listingId} variant="lavender"/></div></section>;
}
