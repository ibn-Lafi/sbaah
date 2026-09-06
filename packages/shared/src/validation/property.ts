import { z } from 'zod';
import { LISTING_TYPES, PROPERTY_TYPES } from '../types/enums';

export const propertyInputSchema = z.object({
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
});
export type PropertyInput = z.infer<typeof propertyInputSchema>;

/** Query params for the public search/filter endpoint (PRODUCT_SPEC section 4). */
export const propertySearchSchema = z.object({
  city_id: z.string().uuid().optional(),
  district_id: z.string().uuid().optional(),
  property_type: z.enum(PROPERTY_TYPES).optional(),
  listing_type: z.enum(LISTING_TYPES).optional(),
  min_price: z.number().nonnegative().optional(),
  max_price: z.number().positive().optional(),
  bedrooms: z.number().int().nonnegative().optional(),
  page: z.number().int().positive().default(1),
  page_size: z.number().int().positive().max(50).default(20),
});
export type PropertySearchInput = z.infer<typeof propertySearchSchema>;

/** Max upload limits per PRODUCT_SPEC section 12 (video risk mitigation). */
export const MAX_VIDEO_SIZE_MB = 50;
export const MAX_VIDEOS_PER_PROPERTY = 2;
export const MAX_IMAGES_PER_PROPERTY = 15;
