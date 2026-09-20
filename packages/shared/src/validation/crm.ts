import { z } from 'zod';
import { ASSET_TYPES, DEAL_STATUSES, LISTING_TYPES, VIEWING_OUTCOMES, VIEWING_STATUSES } from '../types/enums';

export const leadRequirementSchema = z.object({
  purpose_v2:z.enum(LISTING_TYPES).optional().nullable(), budget_min:z.number().nonnegative().optional().nullable(), budget_max:z.number().nonnegative().optional().nullable(),
  asset_types:z.array(z.enum(ASSET_TYPES)).default([]), city_ids:z.array(z.string().uuid()).default([]), district_ids:z.array(z.string().uuid()).default([]),
  area_min:z.number().positive().optional().nullable(), area_max:z.number().positive().optional().nullable(), bedrooms_min:z.number().int().nonnegative().optional().nullable(),
  timeline:z.string().optional().nullable(), financing:z.string().optional().nullable(), notes:z.string().optional().nullable(),
}).refine(v=>v.budget_min==null||v.budget_max==null||v.budget_max>=v.budget_min,{message:'الحد الأعلى للميزانية يجب ألا يقل عن الحد الأدنى'}).refine(v=>v.area_min==null||v.area_max==null||v.area_max>=v.area_min,{message:'الحد الأعلى للمساحة يجب ألا يقل عن الحد الأدنى'});
export const crmTaskSchema=z.object({lead_id:z.string().uuid().optional().nullable(),assigned_user_id:z.string().uuid().optional().nullable(),title:z.string().min(1),due_at:z.string().datetime().optional().nullable()});
export const viewingInputSchema=z.object({lead_id:z.string().uuid(),asset_id:z.string().uuid(),listing_id:z.string().uuid().optional().nullable(),assigned_user_id:z.string().uuid(),scheduled_at:z.string().datetime(),notes:z.string().optional().nullable()});
export const viewingUpdateSchema=z.object({scheduled_at:z.string().datetime().optional(),status:z.enum(VIEWING_STATUSES).optional(),outcome:z.enum(VIEWING_OUTCOMES).optional().nullable(),notes:z.string().optional().nullable()});
export const dealInputSchema=z.object({lead_id:z.string().uuid(),asset_ids:z.array(z.string().uuid()).min(1),listing_id:z.string().uuid().optional().nullable(),reservation_id:z.string().uuid().optional().nullable(),deal_type:z.enum(LISTING_TYPES),responsible_user_id:z.string().uuid().optional().nullable(),status:z.enum(DEAL_STATUSES).optional(),value:z.number().nonnegative().optional().nullable(),expected_close_date:z.string().date().optional().nullable(),lost_reason:z.string().optional().nullable(),commission_type:z.enum(['fixed','percentage']).optional().nullable(),commission_value:z.number().nonnegative().optional().nullable()});
