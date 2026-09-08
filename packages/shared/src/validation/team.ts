import { z } from 'zod';
import { saudiPhoneSchema } from './auth';

/**
 * POST /v1/team/invite — Owner/Admin only (PRODUCT_SPEC section 8).
 * `role` deliberately excludes 'owner': exactly one Owner per tenant, set
 * at registration, immutable — inviting can only add Admin/Agent.
 */
export const inviteTeamMemberSchema = z.object({
  full_name: z.string().min(3, 'الاسم الثلاثي مطلوب'),
  phone: saudiPhoneSchema,
  role: z.enum(['admin', 'agent']),
});
export type InviteTeamMemberInput = z.infer<typeof inviteTeamMemberSchema>;

/**
 * PATCH /v1/team/[id] — role/status only. No 'owner' role here either,
 * and no hard delete: `user_status` already has 'disabled' for removal
 * (preserves the row other tables reference, e.g. lead_notes.user_id).
 */
export const updateTeamMemberSchema = z
  .object({
    role: z.enum(['admin', 'agent']).optional(),
    status: z.enum(['active', 'disabled']).optional(),
  })
  .refine((data) => data.role !== undefined || data.status !== undefined, {
    message: 'يجب تحديد الدور أو الحالة على الأقل',
  });
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;
