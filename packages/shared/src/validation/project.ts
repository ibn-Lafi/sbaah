import { z } from 'zod';
import { PROPERTY_STATUSES } from '../types/enums';

/** PRODUCT_SPEC section 4.1 — optional grouping above properties, added with the property hierarchy scope expansion. */
export const projectInputSchema = z.object({
  name_ar: z.string().min(2, 'اسم المشروع مطلوب'),
  name_en: z.string().optional().nullable(),
  description_ar: z.string().optional().nullable(),
  description_en: z.string().optional().nullable(),
  city_id: z.string().uuid('المدينة مطلوبة'),
  district_id: z.string().uuid().optional().nullable(),
});
export type ProjectInput = z.infer<typeof projectInputSchema>;

export const projectUpdateSchema = projectInputSchema.partial().extend({
  status: z.enum(PROPERTY_STATUSES).optional(),
});
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;

export const buildingInputSchema = z.object({
  project_id: z.string().uuid().optional().nullable(),
  name_ar: z.string().min(2, 'اسم العمارة مطلوب'),
  name_en: z.string().optional().nullable(),
  city_id: z.string().uuid('المدينة مطلوبة'),
  district_id: z.string().uuid().optional().nullable(),
  floors_count: z.number().int().positive().optional().nullable(),
});
export type BuildingInput = z.infer<typeof buildingInputSchema>;

export const buildingUpdateSchema = buildingInputSchema.partial();
export type BuildingUpdateInput = z.infer<typeof buildingUpdateSchema>;
