import { z } from 'zod';
import { ASSET_TYPES, PROJECT_STATUSES } from '../types/enums';

export const projectInputSchema = z.object({
  name_ar: z.string().min(2, 'اسم المشروع مطلوب'), name_en: z.string().optional().nullable(),
  description_ar: z.string().optional().nullable(), description_en: z.string().optional().nullable(),
  city_id: z.string().uuid('المدينة مطلوبة'), district_id: z.string().uuid().optional().nullable(),
  lat: z.number().optional().nullable(), lng: z.number().optional().nullable(),
  developer_party_id: z.string().uuid().optional().nullable(), completion_percentage: z.number().min(0).max(100).optional().nullable(),
  expected_completion_date: z.string().date().optional().nullable(), planned_units_count: z.number().int().nonnegative().optional().nullable(),
  reference_number: z.string().max(100).optional().nullable(),
});
export type ProjectInput = z.infer<typeof projectInputSchema>;
export const projectUpdateSchema = projectInputSchema.partial().extend({ status: z.enum(PROJECT_STATUSES).optional() });
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;

export const phaseInputSchema = z.object({ project_id:z.string().uuid(), name_ar:z.string().min(1), name_en:z.string().optional().nullable(), order_index:z.number().int().nonnegative().default(0) });
export const unitTypeInputSchema = z.object({ project_id:z.string().uuid().optional().nullable(), name_ar:z.string().min(1), name_en:z.string().optional().nullable(), asset_type:z.enum(ASSET_TYPES), area_sqm:z.number().positive(), bedrooms:z.number().int().nonnegative().optional().nullable(), bathrooms:z.number().int().nonnegative().optional().nullable(), base_price:z.number().positive().optional().nullable(), specifications:z.record(z.string(),z.unknown()).optional() });
