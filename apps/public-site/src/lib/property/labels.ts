import { LISTING_TYPE_LABELS_BILINGUAL, PROPERTY_TYPE_LABELS_BILINGUAL, type AssetType, type ListingType } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';

export function getPropertyTypeLabel(locale: Locale, type: AssetType): string {
  return PROPERTY_TYPE_LABELS_BILINGUAL[type][locale];
}

export function getListingTypeLabel(locale: Locale, type: ListingType): string {
  return LISTING_TYPE_LABELS_BILINGUAL[type][locale];
}

/** Western digits even on the Arabic page — matches `dashboard`'s established convention, not ar-SA's Arabic-Indic digits. */
export function formatPrice(locale: Locale, price: number): string {
  const amount = price.toLocaleString('en-US');
  return locale === 'ar' ? `${amount} ر.س` : `SAR ${amount}`;
}

/** Short form for a map pin badge (e.g. "620K") — same western-digit convention as formatPrice, just compact so pins stay small. */
export function formatPriceCompact(price: number): string {
  return price.toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 });
}
