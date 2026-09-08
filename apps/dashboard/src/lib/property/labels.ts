import type { ListingType, PropertyAvailability, PropertyStatus, PropertyType } from '@sbaah/shared';

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  draft: 'مسودة',
  published: 'منشور',
  archived: 'مؤرشف',
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: 'شقة',
  villa: 'فيلا',
  land: 'أرض',
  office: 'مكتب',
  shop: 'محل',
  building: 'عمارة',
};

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  sale: 'بيع',
  rent: 'إيجار',
};

export const PROPERTY_AVAILABILITY_LABELS: Record<PropertyAvailability, string> = {
  available: 'متاح',
  reserved: 'محجوز',
  sold: 'مباع',
  rented: 'مؤجَّر',
};
