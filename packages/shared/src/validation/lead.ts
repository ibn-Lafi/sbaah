import { z } from 'zod';
import { saudiPhoneSchema } from './auth';
import { LEAD_SOURCES, LEAD_STATUSES } from '../types/enums';

/**
 * Public inquiry form (PRODUCT_SPEC section 10) — submitted anonymously
 * from public-site. tenant_id/property_id are re-validated server-side
 * against a published property before insert; this schema only checks shape.
 */
export const publicLeadInputSchema = z.object({
  tenant_id: z.string({ required_error: 'تعذر تحديد الموقع العقاري، أعد تحميل الصفحة' }).uuid('تعذر تحديد الموقع العقاري'),
  project_id: z.string().uuid().optional().nullable(),
  asset_id: z.string().uuid().optional().nullable(),
  listing_id: z.string().uuid().optional().nullable(),
  full_name: z.string({ required_error: 'الاسم مطلوب' }).trim().min(2, 'الاسم مطلوب'),
  phone: saudiPhoneSchema,
  email: z.string().email().optional().nullable(),
  captcha_token: z.string({ required_error: 'التحقق الأمني مطلوب' }).min(1, 'أكمل التحقق الأمني ثم أرسل النموذج'),
});
export type PublicLeadInput = z.infer<typeof publicLeadInputSchema>;

/** POST /v1/leads (authenticated, Owner/Admin only) — staff manually entering a lead, e.g. a walk-in. Always source='manual'. */
export const manualLeadInputSchema = z.object({
  project_id: z.string().uuid().optional().nullable(),
  unit_type_id: z.string().uuid().optional().nullable(),
  asset_id: z.string().uuid().optional().nullable(),
  listing_id: z.string().uuid().optional().nullable(),
  full_name: z.string().min(2, 'الاسم مطلوب'),
  phone: saudiPhoneSchema,
  email: z.string().email().optional().nullable(),
  assigned_agent_id: z.string().uuid().optional().nullable(),
  source: z.enum(LEAD_SOURCES).default('manual'),
  customer_relationship: z.enum(['purchase', 'tenant', 'owner', 'former']).optional().nullable(),
  follow_up_at: z.string().datetime({ offset: true }).optional().nullable(),
  notes: z.string().trim().max(4000).optional().nullable(),
}).superRefine((value, ctx) => {
  const targets = [value.project_id, value.unit_type_id, value.asset_id, value.listing_id].filter(Boolean);
  if (targets.length > 1) ctx.addIssue({ code: 'custom', message: 'اختر هدف اهتمام عقاري واحدًا فقط' });
});
export type ManualLeadInput = z.infer<typeof manualLeadInputSchema>;

export const updateLeadStatusSchema = z.object({
  status: z.enum(LEAD_STATUSES),
});
export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;

export const addLeadNoteSchema = z.object({
  note_text: z.string().min(1, 'الملاحظة لا يمكن أن تكون فارغة'),
});
export type AddLeadNoteInput = z.infer<typeof addLeadNoteSchema>;

export const setFollowUpSchema = z.object({
  follow_up_at: z.string().datetime().nullable(),
});
export type SetFollowUpInput = z.infer<typeof setFollowUpSchema>;

/** PATCH /v1/leads/[id] — status, follow-up date, and reassignment in one call rather than three tiny endpoints. */
export const leadUpdateSchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  follow_up_at: z.string().datetime().nullable().optional(),
  assigned_agent_id: z.string().uuid().nullable().optional(),
});
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;
