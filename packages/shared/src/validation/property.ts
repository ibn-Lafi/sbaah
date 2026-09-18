import { z } from 'zod';
import {
  FURNISHING_STATUSES,
  LISTING_TYPES,
  PROPERTY_AVAILABILITY,
  PROPERTY_FRONTAGES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
} from '../types/enums';

const propertyFieldsSchema = z.object({
  title_ar: z.string().min(3, 'عنوان العقار مطلوب'),
  title_en: z.string().optional().nullable(),
  description_ar: z.string().min(10, 'وصف العقار مطلوب'),
  description_en: z.string().optional().nullable(),
  property_type: z.enum(PROPERTY_TYPES),
  listing_type: z.enum(LISTING_TYPES),
  price: z.number().positive('السعر يجب أن يكون أكبر من صفر'),
  area_sqm: z.number().positive('المساحة يجب أن تكون أكبر من صفر'),
  bedrooms: z.number().int().nonnegative().optional().nullable(),
  bathrooms: z.number().int().nonnegative().optional().nullable(),
  city_id: z.string().uuid('المدينة مطلوبة'),
  district_id: z.string().uuid().optional().nullable(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  agent_id: z.string().uuid().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  building_id: z.string().uuid().optional().nullable(),
  land_area: z.number().positive().optional().nullable(),
  built_area: z.number().positive().optional().nullable(),
  street_width: z.number().positive().optional().nullable(),
  frontage: z.enum(PROPERTY_FRONTAGES).optional().nullable(),
  property_age: z.number().int().nonnegative().optional().nullable(),
  floor_number: z.number().int().optional().nullable(),
  floors_count: z.number().int().positive().optional().nullable(),
  parking_count: z.number().int().nonnegative().optional().nullable(),
  elevators_count: z.number().int().nonnegative().optional().nullable(),
  furnishing: z.enum(FURNISHING_STATUSES).optional().nullable(),
  reference_number: z.string().max(100).optional().nullable(),
  advertisement_license_number: z.string().max(100).optional().nullable(),
  advertisement_license_expires_at: z.string().datetime().optional().nullable(),
  advertiser_name: z.string().max(200).optional().nullable(),
  marketing_mandate_id: z.string().uuid().optional().nullable(),
});

function validateResidentialFields(
  value: { property_type?: string; bedrooms?: number | null; bathrooms?: number | null },
  ctx: z.RefinementCtx,
) {
  if (value.property_type && ['apartment', 'villa'].includes(value.property_type)) {
    if (value.bedrooms == null) ctx.addIssue({ code: 'custom', path: ['bedrooms'], message: 'عدد غرف النوم مطلوب لهذا النوع' });
    if (value.bathrooms == null) ctx.addIssue({ code: 'custom', path: ['bathrooms'], message: 'عدد دورات المياه مطلوب لهذا النوع' });
  }
}

export const propertyInputSchema = propertyFieldsSchema.superRefine(validateResidentialFields);
export type PropertyInput = z.infer<typeof propertyInputSchema>;

export const propertyUpdateSchema = propertyFieldsSchema.partial().extend({
  status: z.enum(PROPERTY_STATUSES).optional(),
  availability: z.enum(PROPERTY_AVAILABILITY).optional(),
}).superRefine(validateResidentialFields);
export type PropertyUpdateInput = z.infer<typeof propertyUpdateSchema>;

export const propertySearchSchema = z.object({
  city_id: z.string().uuid().optional(),
  district_id: z.string().uuid().optional(),
  property_type: z.enum(PROPERTY_TYPES).optional(),
  listing_type: z.enum(LISTING_TYPES).optional(),
  min_price: z.coerce.number().nonnegative().optional(),
  max_price: z.coerce.number().positive().optional(),
  bedrooms: z.coerce.number().int().nonnegative().optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(50).default(20),
});
export type PropertySearchInput = z.infer<typeof propertySearchSchema>;

export const MAX_VIDEO_SIZE_MB = 50;
export const MAX_VIDEOS_PER_PROPERTY = 2;
export const MAX_IMAGES_PER_PROPERTY = 15;
