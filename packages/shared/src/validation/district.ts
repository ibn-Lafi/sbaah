import { z } from 'zod';

/**
 * Tenant-facing district creation (migration 0046) — a broker/agent adding
 * a property picks a location on the map and, if their neighborhood isn't
 * listed yet, adds it themselves instead of asking the platform owner via
 * console. Deliberately lighter than console's `districtInputSchema`: no
 * `name_en` (the API fills it in from `name_ar`) since requiring an
 * English translation upfront is friction nobody filling this in on the
 * fly can pay.
 */
export const districtCreateSchema = z.object({
  city_id: z.string().uuid('المدينة مطلوبة'),
  name_ar: z.string().min(2, 'اسم الحي مطلوب'),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
});
export type DistrictCreateInput = z.infer<typeof districtCreateSchema>;
