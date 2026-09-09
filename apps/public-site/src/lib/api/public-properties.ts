import type { Property, PropertyMedia, PropertySearchInput } from '@sbaah/shared';
import { apiGet } from './client';
import { getHost } from '@/lib/tenant/get-host';

export type PublicProperty = Property & { property_media: Pick<PropertyMedia, 'url' | 'media_type' | 'order_index'>[] };

export interface PublicPropertyListResponse {
  properties: PublicProperty[];
  page: number;
  page_size: number;
  total: number;
}

/** Every filter field is optional and maps 1:1 onto propertySearchSchema (packages/shared) — the URL's own search params are the source of truth, no renaming layer. */
export async function listPublicProperties(
  filters: Partial<Omit<PropertySearchInput, 'page' | 'page_size'>> & { page?: number },
): Promise<PublicPropertyListResponse> {
  const host = await getHost();
  const query = new URLSearchParams({ domain: host ?? '' });
  if (filters.city_id) query.set('city_id', filters.city_id);
  if (filters.district_id) query.set('district_id', filters.district_id);
  if (filters.property_type) query.set('property_type', filters.property_type);
  if (filters.listing_type) query.set('listing_type', filters.listing_type);
  if (filters.min_price !== undefined) query.set('min_price', String(filters.min_price));
  if (filters.max_price !== undefined) query.set('max_price', String(filters.max_price));
  if (filters.bedrooms !== undefined) query.set('bedrooms', String(filters.bedrooms));
  if (filters.page) query.set('page', String(filters.page));

  return apiGet<PublicPropertyListResponse>(`/public/properties?${query.toString()}`);
}
