import type { Property, PropertyMedia } from '@sbaah/shared';
import { apiGet, ApiRequestError } from './client';
import { getHost } from '@/lib/tenant/get-host';

export type PublicProperty = Property & { property_media: Pick<PropertyMedia, 'url' | 'media_type' | 'order_index'>[] };

/** The detail page's full ordered gallery — GET /v1/public/properties/[id] embeds every media row, not just a thumbnail (task 34/42). */
export type PublicPropertyDetail = Property & { property_media: PropertyMedia[] };

export interface PublicPropertyListResponse {
  properties: PublicProperty[];
  page: number;
  page_size: number;
  total: number;
}

export interface PublicPropertySearchFilters {
  city_id?: string;
  district_id?: string;
  property_type?: string;
  listing_type?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  page?: number;
}

/** Public-site filters map directly to the public properties API query parameters. */
export async function listPublicProperties(
  filters: PublicPropertySearchFilters,
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

/** Returns `null` for "not found" (wrong tenant, unpublished, or nonexistent id) so the page can render notFound() itself, same convention as getTenantSite(). */
export async function getPublicProperty(id: string): Promise<PublicPropertyDetail | null> {
  const host = await getHost();
  try {
    const { property } = await apiGet<{ property: PublicPropertyDetail }>(
      `/public/properties/${id}?domain=${encodeURIComponent(host ?? '')}`,
    );
    return property;
  } catch (error) {
    if (error instanceof ApiRequestError && error.code === 'property_not_found') {
      return null;
    }
    throw error;
  }
}
