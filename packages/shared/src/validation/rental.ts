import { z } from 'zod';
import { saudiPhoneSchema } from './auth';
import { RENTAL_STATUSES } from '../types/enums';

/** PRODUCT_SPEC section 4.2 — simple lease tracking, added with the property hierarchy/rentals scope expansion. */
export const rentalInputSchema = z
  .object({
    property_id: z.string().uuid('العقار مطلوب'),
    tenant_name: z.string().min(2, 'اسم المستأجر مطلوب'),
    tenant_phone: saudiPhoneSchema,
    rent_amount: z.number().positive('مبلغ الإيجار يجب أن يكون أكبر من صفر'),
    contract_start_date: z.string().date('تاريخ بداية العقد غير صحيح'),
    contract_end_date: z.string().date('تاريخ نهاية العقد غير صحيح'),
    notes: z.string().optional().nullable(),
  })
  .refine((data) => data.contract_end_date > data.contract_start_date, {
    message: 'تاريخ نهاية العقد يجب أن يكون بعد تاريخ البداية',
    path: ['contract_end_date'],
  });
export type RentalInput = z.infer<typeof rentalInputSchema>;

export const rentalUpdateSchema = z.object({
  tenant_name: z.string().min(2).optional(),
  tenant_phone: saudiPhoneSchema.optional(),
  rent_amount: z.number().positive().optional(),
  contract_start_date: z.string().date().optional(),
  contract_end_date: z.string().date().optional(),
  status: z.enum(RENTAL_STATUSES).optional(),
  notes: z.string().optional().nullable(),
});
export type RentalUpdateInput = z.infer<typeof rentalUpdateSchema>;
