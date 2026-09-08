import type { LeadSource, LeadStatus } from '@sbaah/shared';

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'جديد',
  contacted: 'تم التواصل',
  qualified: 'مؤهل',
  won: 'صفقة',
  lost: 'مرفوض',
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  website_form: 'نموذج الموقع',
  whatsapp_click: 'واتساب',
  manual: 'يدوي',
};
