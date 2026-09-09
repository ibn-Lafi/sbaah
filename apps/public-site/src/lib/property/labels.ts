import type { ListingType, PropertyType } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';

const PROPERTY_TYPE_LABELS: Record<Locale, Record<PropertyType, string>> = {
  ar: { apartment: 'شقة', villa: 'فيلا', land: 'أرض', office: 'مكتب', shop: 'محل', building: 'عمارة' },
  en: { apartment: 'Apartment', villa: 'Villa', land: 'Land', office: 'Office', shop: 'Shop', building: 'Building' },
};

const LISTING_TYPE_LABELS: Record<Locale, Record<ListingType, string>> = {
  ar: { sale: 'بيع', rent: 'إيجار' },
  en: { sale: 'For sale', rent: 'For rent' },
};

export function getPropertyTypeLabel(locale: Locale, type: PropertyType): string {
  return PROPERTY_TYPE_LABELS[locale][type];
}

export function getListingTypeLabel(locale: Locale, type: ListingType): string {
  return LISTING_TYPE_LABELS[locale][type];
}
