import type { ListingType, PropertyAvailability, PropertyStatus, PropertyType } from '@sbaah/shared';
import { LISTING_TYPE_LABELS_BILINGUAL, PROPERTY_TYPE_LABELS_BILINGUAL } from '@sbaah/shared';

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  draft: 'مسودة',
  published: 'منشور',
  archived: 'مؤرشف',
};

/** Dashboard is Arabic-only (PRODUCT_SPEC section 7) — derived from the bilingual source shared with public-site instead of its own copy of the strings. */
export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = Object.fromEntries(
  Object.entries(PROPERTY_TYPE_LABELS_BILINGUAL).map(([type, { ar }]) => [type, ar]),
) as Record<PropertyType, string>;

export const LISTING_TYPE_LABELS: Record<ListingType, string> = Object.fromEntries(
  Object.entries(LISTING_TYPE_LABELS_BILINGUAL).map(([type, { ar }]) => [type, ar]),
) as Record<ListingType, string>;

export const PROPERTY_AVAILABILITY_LABELS: Record<PropertyAvailability, string> = {
  available: 'متاح',
  reserved: 'محجوز',
  sold: 'مباع',
  rented: 'مؤجَّر',
};
