import { z } from 'zod';
import { BROKER_MARKETER_APPLICANT_TYPES } from '../types/enums';

/**
 * POST /v1/public/broker-applications — the "الوسطاء والمسوقين" section's
 * form (migration 0032). Same shape/validation discipline as
 * publicLeadInputSchema (lead.ts): `property_id` is optional/nullable
 * (home-page submissions have none), `captcha_token` is required, and
 * `tenant_id`/`property_id` are re-validated server-side before any
 * insert — never trusted as sent.
 */
export const publicBrokerMarketerApplicationInputSchema = z.object({
  tenant_id: z.string().uuid(),
  property_id: z.string().uuid().optional().nullable(),
  full_name: z.string().min(2, 'الاسم مطلوب'),
  city_id: z.string().uuid('المدينة مطلوبة'),
  fal_license_number: z.string().min(1, 'رقم رخصة فال مطلوب'),
  applicant_type: z.enum(BROKER_MARKETER_APPLICANT_TYPES),
  captcha_token: z.string().min(1, 'التحقق الأمني مطلوب'),
});
export type PublicBrokerMarketerApplicationInput = z.infer<typeof publicBrokerMarketerApplicationInputSchema>;
