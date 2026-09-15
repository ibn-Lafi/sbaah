import type { ListingType, PropertyType } from '@sbaah/shared';
import { LISTING_TYPE_LABELS_BILINGUAL, PROPERTY_TYPE_LABELS_BILINGUAL } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locale';

/** Modules not yet translated (leads, rentals) still read the Arabic-only records below — derived once from the bilingual source shared with public-site instead of their own copy of the strings. */
export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = Object.fromEntries(
  Object.entries(PROPERTY_TYPE_LABELS_BILINGUAL).map(([type, { ar }]) => [type, ar]),
) as Record<PropertyType, string>;

export const LISTING_TYPE_LABELS: Record<ListingType, string> = Object.fromEntries(
  Object.entries(LISTING_TYPE_LABELS_BILINGUAL).map(([type, { ar }]) => [type, ar]),
) as Record<ListingType, string>;

/** Locale-aware lookup for the properties/buildings/projects module, which reads the active `locale` instead of always picking `.ar`. */
export function getPropertyTypeLabels(locale: Locale): Record<PropertyType, string> {
  return Object.fromEntries(
    Object.entries(PROPERTY_TYPE_LABELS_BILINGUAL).map(([type, label]) => [type, label[locale]]),
  ) as Record<PropertyType, string>;
}

export function getListingTypeLabels(locale: Locale): Record<ListingType, string> {
  return Object.fromEntries(
    Object.entries(LISTING_TYPE_LABELS_BILINGUAL).map(([type, label]) => [type, label[locale]]),
  ) as Record<ListingType, string>;
}
