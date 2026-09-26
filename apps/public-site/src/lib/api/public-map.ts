import type { AssetType, ListingType } from '@sbaah/shared';
import { apiGet } from './client';
import { getHost } from '@/lib/tenant/get-host';

export interface MapPropertyPin {
  id: string;
  title_ar: string;
  title_en: string | null;
  property_type: AssetType;
  listing_type: ListingType | null;
  price: number | null;
  area_sqm: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  city_id: string | null;
  district_id: string | null;
  lat: number;
  lng: number;
  property_media: { url: string; media_type: string; order_index: number }[];
}

export interface MapProjectPin {
  id: string;
  name_ar: string;
  name_en: string | null;
  city_id: string;
  district_id: string | null;
  lat: number;
  lng: number;
}

export interface MapBuildingPin {
  id: string;
  name_ar: string;
  name_en: string | null;
  city_id: string;
  district_id: string | null;
  lat: number;
  lng: number;
}

export interface MapPinsResponse {
  properties: MapPropertyPin[];
  projects: MapProjectPin[];
  buildings: MapBuildingPin[];
}

/** GET /v1/public/map-pins — only properties/projects/buildings with a location set are returned; see that route's own doc comment. */
export async function listMapPins(): Promise<MapPinsResponse> {
  const host = await getHost();
  return apiGet<MapPinsResponse>(`/public/map-pins?domain=${encodeURIComponent(host ?? '')}`);
}
