import { z } from 'zod';
import { PROPERTY_STATUSES, PROPERTY_TYPES, UNIT_AVAILABILITY } from '../types/enums';

export const projectInputSchema = z.object({
  name_ar: z.string().min(2, 'اسم المشروع مطلوب'), name_en: z.string().optional().nullable(),
  description_ar: z.string().optional().nullable(), description_en: z.string().optional().nullable(),
  city_id: z.string().uuid('المدينة مطلوبة'), district_id: z.string().uuid().optional().nullable(),
  lat: z.number().optional().nullable(), lng: z.number().optional().nullable(),
  developer_name: z.string().optional().nullable(), completion_percentage: z.number().min(0).max(100).optional().nullable(),
  expected_completion_date: z.string().date().optional().nullable(), total_units: z.number().int().nonnegative().optional().nullable(),
  reference_number: z.string().max(100).optional().nullable(),
});
export type ProjectInput = z.infer<typeof projectInputSchema>;
export const projectUpdateSchema = projectInputSchema.partial().extend({ status: z.enum(PROPERTY_STATUSES).optional() });
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;

export const phaseInputSchema = z.object({ project_id:z.string().uuid(), name_ar:z.string().min(1), name_en:z.string().optional().nullable(), order_index:z.number().int().nonnegative().default(0) });
export const buildingInputSchema = z.object({ project_id:z.string().uuid().optional().nullable(), phase_id:z.string().uuid().optional().nullable(), name_ar:z.string().min(2), name_en:z.string().optional().nullable(), city_id:z.string().uuid(), district_id:z.string().uuid().optional().nullable(), lat:z.number().optional().nullable(), lng:z.number().optional().nullable(), floors_count:z.number().int().positive().optional().nullable() });
export type BuildingInput = z.infer<typeof buildingInputSchema>;
export const buildingUpdateSchema = buildingInputSchema.partial();
export type BuildingUpdateInput = z.infer<typeof buildingUpdateSchema>;
export const unitTypeInputSchema = z.object({ project_id:z.string().uuid(), name_ar:z.string().min(1), name_en:z.string().optional().nullable(), property_type:z.enum(PROPERTY_TYPES), area_sqm:z.number().positive(), bedrooms:z.number().int().nonnegative().optional().nullable(), bathrooms:z.number().int().nonnegative().optional().nullable(), base_price:z.number().positive().optional().nullable() });
export const unitInputSchema = z.object({ project_id:z.string().uuid(), phase_id:z.string().uuid().optional().nullable(), building_id:z.string().uuid().optional().nullable(), unit_type_id:z.string().uuid(), unit_number:z.string().min(1), floor_number:z.number().int().optional().nullable(), area_sqm:z.number().positive().optional().nullable(), price:z.number().positive().optional().nullable(), orientation:z.string().optional().nullable(), availability:z.enum(UNIT_AVAILABILITY).optional() });
