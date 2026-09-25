import { z } from 'zod';
import {
  ASSET_PHYSICAL_STATUSES,
  ASSET_TYPES,
  FURNISHING_STATUSES,
  LISTING_COMMERCIAL_STATUSES,
  LISTING_PRICING_PERIODS,
  LISTING_PUBLICATION_STATUSES,
  LISTING_TYPES,
  PARTY_TYPES,
  PROPERTY_FRONTAGES,
  RESERVATION_STATUSES,
  MARKETING_MANDATE_STATUSES,
  MARKETING_MANDATE_TYPES,
  COMMISSION_TYPES,
} from '../types/enums';

const nullableUuid = z.string().uuid().optional().nullable();

export const assetInputSchema = z.object({
  asset_type: z.enum(ASSET_TYPES),
  parent_asset_id: nullableUuid,
  project_id: nullableUuid,
  phase_id: nullableUuid,
  unit_type_id: nullableUuid,
  slug: z.string().trim().min(1).max(160).optional().nullable(),
  reference_number: z.string().trim().min(1).max(100).optional().nullable(),
  name_ar: z.string().trim().min(2, 'اسم العقار مطلوب'),
  name_en: z.string().trim().optional().nullable(),
  description_ar: z.string().optional().nullable(),
  description_en: z.string().optional().nullable(),
  unit_number: z.string().trim().max(100).optional().nullable(),
  floor_number: z.number().int().optional().nullable(),
  city_id: nullableUuid,
  district_id: nullableUuid,
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  area_sqm: z.number().positive().optional().nullable(),
  land_area: z.number().positive().optional().nullable(),
  built_area: z.number().positive().optional().nullable(),
  street_width: z.number().positive().optional().nullable(),
  frontage: z.enum(PROPERTY_FRONTAGES).optional().nullable(),
  bedrooms: z.number().int().nonnegative().optional().nullable(),
  bathrooms: z.number().int().nonnegative().optional().nullable(),
  floors_count: z.number().int().positive().optional().nullable(),
  parking_count: z.number().int().nonnegative().optional().nullable(),
  elevators_count: z.number().int().nonnegative().optional().nullable(),
  furnishing: z.enum(FURNISHING_STATUSES).optional().nullable(),
  property_age: z.number().int().nonnegative().optional().nullable(),
  physical_status: z.enum(ASSET_PHYSICAL_STATUSES).optional(),
  specifications: z.record(z.string(), z.unknown()).optional(),
});
export type AssetInput = z.infer<typeof assetInputSchema>;
export const assetUpdateSchema = assetInputSchema.partial();
export type AssetUpdateInput = z.infer<typeof assetUpdateSchema>;

export const assetSearchSchema = z.object({
  scope: z.enum(['all', 'top_level', 'units']).optional(),
  asset_type: z.enum(ASSET_TYPES).optional(),
  physical_status: z.enum(ASSET_PHYSICAL_STATUSES).optional(),
  project_id: z.string().uuid().optional(),
  parent_asset_id: z.string().uuid().optional(),
  city_id: z.string().uuid().optional(),
  district_id: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(50).default(20),
});

export const listingInputSchema = z.object({
  listing_number: z.string().trim().min(1).max(100),
  listing_type: z.enum(LISTING_TYPES),
  asset_ids: z.array(z.string().uuid()).min(1, 'اختر عقارًا واحدًا على الأقل'),
  title_ar: z.string().trim().min(2),
  title_en: z.string().trim().optional().nullable(),
  description_ar: z.string().optional().nullable(),
  description_en: z.string().optional().nullable(),
  asking_price: z.number().nonnegative(),
  pricing_period: z.enum(LISTING_PRICING_PERIODS).optional().nullable(),
  advertisement_license_number: z.string().max(100).optional().nullable(),
  advertisement_license_expires_at: z.string().date().optional().nullable(),
  advertiser_name: z.string().max(200).optional().nullable(),
  marketing_mandate_id: nullableUuid,
  assigned_user_id: nullableUuid,
}).superRefine((value, ctx) => {
  if (value.listing_type === 'rent' && !value.pricing_period) {
    ctx.addIssue({ code: 'custom', path: ['pricing_period'], message: 'دورية الإيجار مطلوبة' });
  }
  if (value.listing_type === 'sale' && value.pricing_period != null) {
    ctx.addIssue({ code: 'custom', path: ['pricing_period'], message: 'دورية السعر خاصة بعروض الإيجار' });
  }
});
export type ListingInput = z.infer<typeof listingInputSchema>;

export const listingUpdateSchema = z.object({
  title_ar: z.string().trim().min(2).optional(),
  title_en: z.string().trim().optional().nullable(),
  description_ar: z.string().optional().nullable(),
  description_en: z.string().optional().nullable(),
  asking_price: z.number().nonnegative().optional(),
  pricing_period: z.enum(LISTING_PRICING_PERIODS).optional().nullable(),
  publication_status: z.enum(LISTING_PUBLICATION_STATUSES).optional(),
  commercial_status: z.enum(LISTING_COMMERCIAL_STATUSES).optional(),
  advertisement_license_number: z.string().max(100).optional().nullable(),
  advertisement_license_expires_at: z.string().date().optional().nullable(),
  advertiser_name: z.string().max(200).optional().nullable(),
  marketing_mandate_id: nullableUuid,
  assigned_user_id: nullableUuid,
});
export type ListingUpdateInput = z.infer<typeof listingUpdateSchema>;

export const partyInputSchema = z.object({
  party_type: z.enum(PARTY_TYPES),
  name: z.string().trim().min(2),
  phone: z.string().trim().optional().nullable(),
  email: z.string().email().optional().nullable(),
  national_id: z.string().trim().optional().nullable(),
  commercial_registration: z.string().trim().optional().nullable(),
  tax_number: z.string().trim().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const reservationInputSchema = z.object({
  reservation_number: z.string().trim().min(1).max(100),
  lead_id: nullableUuid,
  listing_id: nullableUuid,
  asset_ids: z.array(z.string().uuid()).min(1),
  status: z.enum(RESERVATION_STATUSES).optional(),
  reserved_at: z.string().datetime().optional(),
  expires_at: z.string().datetime().optional().nullable(),
  deposit_amount: z.number().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
}).refine(v => !v.expires_at || !v.reserved_at || new Date(v.expires_at) > new Date(v.reserved_at), {
  message: 'تاريخ انتهاء الحجز يجب أن يكون بعد تاريخ الحجز',
  path: ['expires_at'],
});


const marketingMandateBaseSchema = z.object({
  reference_number: z.string().trim().min(1).max(100),
  owner_party_id: nullableUuid,
  mandate_type: z.enum(MARKETING_MANDATE_TYPES),
  commission_type: z.enum(COMMISSION_TYPES).optional().nullable(),
  commission_value: z.number().nonnegative().optional().nullable(),
  status: z.enum(MARKETING_MANDATE_STATUSES).optional(),
  starts_at: z.string().date().optional().nullable(),
  expires_at: z.string().date().optional().nullable(),
  notes: z.string().optional().nullable(),
  asset_ids: z.array(z.string().uuid()).min(1, 'اختر عقارًا واحدًا على الأقل'),
});

const validateMarketingMandate = (value: z.infer<typeof marketingMandateBaseSchema>, ctx: z.RefinementCtx) => {
  if ((value.commission_type == null) !== (value.commission_value == null)) ctx.addIssue({ code:'custom', path:['commission_value'], message:'نوع العمولة وقيمتها يجب إدخالهما معًا' });
  if (value.commission_type === 'percentage' && value.commission_value != null && value.commission_value > 100) ctx.addIssue({ code:'custom', path:['commission_value'], message:'نسبة العمولة لا تتجاوز 100%' });
  if (value.starts_at && value.expires_at && value.expires_at < value.starts_at) ctx.addIssue({ code:'custom', path:['expires_at'], message:'تاريخ الانتهاء يجب ألا يسبق تاريخ البداية' });
};

export const marketingMandateInputSchema = marketingMandateBaseSchema.superRefine(validateMarketingMandate);
export type MarketingMandateInput = z.infer<typeof marketingMandateInputSchema>;
export const marketingMandateUpdateSchema = marketingMandateBaseSchema.omit({ asset_ids:true }).partial().superRefine((value, ctx) => {
  if (value.commission_type === 'percentage' && value.commission_value != null && value.commission_value > 100) ctx.addIssue({ code:'custom', path:['commission_value'], message:'نسبة العمولة لا تتجاوز 100%' });
  if (value.starts_at && value.expires_at && value.expires_at < value.starts_at) ctx.addIssue({ code:'custom', path:['expires_at'], message:'تاريخ الانتهاء يجب ألا يسبق تاريخ البداية' });
});
export type MarketingMandateUpdateInput = z.infer<typeof marketingMandateUpdateSchema>;
