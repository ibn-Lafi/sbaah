import { LISTING_TYPE_LABELS_BILINGUAL, PROPERTY_TYPE_LABELS_BILINGUAL, type ListingType, type PropertyType } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';

export function getPropertyTypeLabel(locale: Locale, type: PropertyType): string {
  return PROPERTY_TYPE_LABELS_BILINGUAL[type][locale];
}

export function getListingTypeLabel(locale: Locale, type: ListingType): string {
  return LISTING_TYPE_LABELS_BILINGUAL[type][locale];
}
