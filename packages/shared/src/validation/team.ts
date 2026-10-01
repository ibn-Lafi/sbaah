import { z } from 'zod';
import { emailSchema, passwordSchema, saudiPhoneSchema } from './auth';
import { PERMISSIONS } from '../types/permissions';

export const teamPermissionSchema = z.enum(PERMISSIONS);

export const createTeamMemberSchema = z.object({
  full_name: z.string().trim().min(3, 'الاسم مطلوب'),
  phone: saudiPhoneSchema,
  email: emailSchema,
  temporary_password: passwordSchema,
  permissions: z.array(teamPermissionSchema).max(PERMISSIONS.length).default([]),
});
export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;

export const inviteTeamMemberSchema = createTeamMemberSchema;
export type InviteTeamMemberInput = CreateTeamMemberInput;

export const updateTeamMemberSchema = z
  .object({
    full_name: z.string().trim().min(3, 'الاسم مطلوب').optional(),
    status: z.enum(['active', 'disabled']).optional(),
    permissions: z.array(teamPermissionSchema).max(PERMISSIONS.length).optional(),
  })
  .refine(
    (data) => data.full_name !== undefined || data.status !== undefined || data.permissions !== undefined,
    { message: 'لا توجد تغييرات للحفظ' },
  );
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;
